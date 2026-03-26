"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export type GazeZone = "center" | "left" | "right" | "up" | "down" | "unknown"

export interface EyeTrackingResult {
  isFaceDetected: boolean
  isEyesDetected: boolean
  gazeZone: GazeZone
  gazeRatio: number
  eyeOpenness: number
  lookAwayCount: number
  offScreenTime: number
  focusScore: number
  isDrowsy: boolean
}

interface EyeTrackingHook {
  isTracking: boolean
  isLoading: boolean
  error: string | null
  result: EyeTrackingResult
  startTracking: () => Promise<void>
  stopTracking: () => void
}

const GAZE_LEFT_THRESHOLD = 0.35
const GAZE_RIGHT_THRESHOLD = 0.65
const EYE_OPENNESS_THRESHOLD = 0.2
const OFF_SCREEN_THRESHOLD = 3
const DETECTION_INTERVAL = 300 // 300ms = ~3fps

export function useEyeTracking(videoRef: React.RefObject<HTMLVideoElement | null>): EyeTrackingHook {
  const [isTracking, setIsTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EyeTrackingResult>({
    isFaceDetected: false,
    isEyesDetected: false,
    gazeZone: "unknown",
    gazeRatio: 0.5,
    eyeOpenness: 1,
    lookAwayCount: 0,
    offScreenTime: 0,
    focusScore: 100,
    isDrowsy: false,
  })

  const faceapiRef = useRef<any>(null)
  const modelsLoadedRef = useRef(false)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const offScreenTimeRef = useRef(0)
  const lookAwayCountRef = useRef(0)
  const lastGazeRef = useRef<GazeZone>("unknown")

  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current) return true

    try {
      const faceapi = await import("face-api.js")
      faceapiRef.current = faceapi

      const modelPath = "/models"

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath),
      ])

      modelsLoadedRef.current = true
      console.log("face-api.js models loaded successfully")
      return true
    } catch (err) {
      console.error("Failed to load face-api.js models:", err)
      return false
    }
  }, [])

  const calculateGazeRatio = useCallback((landmarks: any): number => {
    const getEyeCenter = (eyeIndices: number[]) => {
      let sumX = 0, sumY = 0
      eyeIndices.forEach((i) => {
        sumX += landmarks[i].x
        sumY += landmarks[i].y
      })
      return { x: sumX / eyeIndices.length, y: sumY / eyeIndices.length }
    }

    const leftEyeIndices = [36, 37, 38, 39, 40, 41]
    const rightEyeIndices = [42, 43, 44, 45, 46, 47]

    const leftEye = getEyeCenter(leftEyeIndices)
    const rightEye = getEyeCenter(rightEyeIndices)

    const leftCorner = { x: landmarks[36].x, y: landmarks[36].y }
    const rightCorner = { x: landmarks[39].x, y: landmarks[39].y }

    const leftEyeWidth = rightCorner.x - leftCorner.x
    if (leftEyeWidth <= 0) return 0.5

    const leftGazeRatio = (leftEye.x - leftCorner.x) / leftEyeWidth
    const rightGazeRatio = (landmarks[42].x - landmarks[45].x) / (landmarks[45].x - landmarks[42].x)

    return (leftGazeRatio + (1 - rightGazeRatio)) / 2
  }, [])

  const calculateEyeOpenness = useCallback((landmarks: any): number => {
    const leftTop = landmarks[37].y
    const leftBottom = landmarks[41].y
    const leftOpenness = Math.abs(leftBottom - leftTop)

    const rightTop = landmarks[44].y
    const rightBottom = landmarks[46].y
    const rightOpenness = Math.abs(rightBottom - rightTop)

    return Math.min(leftOpenness, rightOpenness) / 20
  }, [])

  const classifyGazeZone = useCallback((gazeRatio: number, eyeOpenness: number): GazeZone => {
    if (eyeOpenness < EYE_OPENNESS_THRESHOLD) {
      return "down"
    }

    if (gazeRatio < GAZE_LEFT_THRESHOLD) return "left"
    if (gazeRatio > GAZE_RIGHT_THRESHOLD) return "right"

    return "center"
  }, [])

  const detect = useCallback(async () => {
    if (!videoRef.current || !faceapiRef.current) return

    const faceapi = faceapiRef.current
    const video = videoRef.current

    if (video.readyState < 2) return

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()

      if (!detection) {
        setResult((prev) => ({
          ...prev,
          isFaceDetected: false,
          isEyesDetected: false,
          gazeZone: "unknown",
          eyeOpenness: 1,
        }))
        offScreenTimeRef.current += DETECTION_INTERVAL / 1000
        return
      }

      const landmarks = detection.landmarks
      const gazeRatio = calculateGazeRatio(landmarks)
      const eyeOpenness = calculateEyeOpenness(landmarks)
      const gazeZone = classifyGazeZone(gazeRatio, eyeOpenness)

      if (gazeZone !== "center" && gazeZone !== "unknown") {
        if (lastGazeRef.current !== gazeZone) {
          lookAwayCountRef.current += 1
        }
        offScreenTimeRef.current += DETECTION_INTERVAL / 1000
      } else {
        offScreenTimeRef.current = Math.max(0, offScreenTimeRef.current - DETECTION_INTERVAL / 1000)
      }

      lastGazeRef.current = gazeZone

      const offScreenPenalty = Math.min(offScreenTimeRef.current / OFF_SCREEN_THRESHOLD, 1)
      const lookAwayPenalty = Math.min(lookAwayCountRef.current / 10, 1)
      const drowsinessPenalty = eyeOpenness < EYE_OPENNESS_THRESHOLD ? 0.2 : 0
      const focusScore = Math.max(0, 100 - (offScreenPenalty * 30 + lookAwayPenalty * 20 + drowsinessPenalty * 50))

      setResult({
        isFaceDetected: true,
        isEyesDetected: true,
        gazeZone,
        gazeRatio,
        eyeOpenness,
        lookAwayCount: lookAwayCountRef.current,
        offScreenTime: Math.round(offScreenTimeRef.current * 10) / 10,
        focusScore: Math.round(focusScore),
        isDrowsy: eyeOpenness < EYE_OPENNESS_THRESHOLD,
      })
    } catch (err) {
      console.error("Eye tracking error:", err)
    }
  }, [videoRef, calculateGazeRatio, calculateEyeOpenness, classifyGazeZone])

  const startTracking = useCallback(async () => {
    if (isTracking) return

    setIsLoading(true)
    setError(null)

    const loaded = await loadModels()
    if (!loaded) {
      setError("Failed to load face detection models")
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setIsTracking(true)

    detectionIntervalRef.current = setInterval(detect, DETECTION_INTERVAL)
  }, [isTracking, loadModels, detect])

  const stopTracking = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    setIsTracking(false)
    offScreenTimeRef.current = 0
    lookAwayCountRef.current = 0
    lastGazeRef.current = "unknown"
  }, [])

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [])

  return {
    isTracking,
    isLoading,
    error,
    result,
    startTracking,
    stopTracking,
  }
}