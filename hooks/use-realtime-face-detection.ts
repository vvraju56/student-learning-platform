"use client"

import { useState, useEffect, useRef } from "react"

interface RealtimeFaceDetectionHook {
  isFaceDetected: boolean
  isWebcamActive: boolean
  confidence: number
  boundingBox: { x: number; y: number; width: number; height: number } | null
  startWebcam: () => Promise<void>
  stopWebcam: () => void
  faceDetectionError: string | null
  videoStream: MediaStream | null
}

export function useRealtimeFaceDetection(): RealtimeFaceDetectionHook {
  const [isFaceDetected, setIsFaceDetected] = useState(false)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [boundingBox, setBoundingBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const detectorRef = useRef<any>(null)

  const loadFaceDetectionModel = async () => {
    try {
      const tf = await import("@tensorflow/tfjs")
      const faceDetection = await import("@tensorflow-models/face-detection")

      try {
        await tf.setBackend("webgl")
      } catch {
        await tf.setBackend("cpu")
      }
      await tf.ready()

      detectorRef.current = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
          runtime: "tfjs",
          modelType: "short",
          maxFaces: 1,
        },
      )

      return true
    } catch (error) {
      console.error("❌ Failed to load face detection model:", error)
      return false
    }
  }

  const detectFace = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2 || !detectorRef.current) {
      return false
    }

    try {
      const faces = await detectorRef.current.estimateFaces(videoRef.current)

      if (faces && faces.length > 0) {
        const firstFace = faces[0]
        const box = firstFace.box

        if (box) {
          setBoundingBox({
            x: box.xMin,
            y: box.yMin,
            width: box.width,
            height: box.height,
          })
        }

        const score = Array.isArray(firstFace.score) ? firstFace.score[0] : 0.85
        setConfidence(score)
        return true
      }
    } catch (error) {
      console.error("Face detection error:", error)
    }

    return false
  }

  const startFaceDetectionLoop = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }

    let faceMissingCount = 0
    const maxFaceMissingCount = 3

    detectionIntervalRef.current = setInterval(async () => {
      if (!streamRef.current || !streamRef.current.active) {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current)
          detectionIntervalRef.current = null
        }
        setIsWebcamActive(false)
        setIsFaceDetected(false)
        setConfidence(0)
        setBoundingBox(null)
        return
      }

      const foundFace = await detectFace()

      if (foundFace) {
        setIsFaceDetected(true)
        faceMissingCount = 0
      } else {
        faceMissingCount += 1
        if (faceMissingCount >= maxFaceMissingCount) {
          setIsFaceDetected(false)
          setConfidence(0)
          setBoundingBox(null)
        }
      }
    }, 700)
  }

  const startWebcam = async () => {
    try {
      setFaceDetectionError(null)

      const modelLoaded = await loadFaceDetectionModel()
      if (!modelLoaded) {
        setFaceDetectionError("Failed to load face detection model")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      streamRef.current = stream
      setVideoStream(stream)

      const video = document.createElement("video")
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      videoRef.current = video

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve()
      })

      await video.play()
      setIsWebcamActive(true)
      startFaceDetectionLoop()
    } catch (error) {
      console.error("❌ Webcam access/model init error:", error)
      setFaceDetectionError("Webcam access denied or model failed to initialize")
      setIsWebcamActive(false)
    }
  }

  const stopWebcam = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current = null
    }

    if (detectorRef.current?.dispose) {
      detectorRef.current.dispose()
    }
    detectorRef.current = null

    setIsWebcamActive(false)
    setIsFaceDetected(false)
    setConfidence(0)
    setBoundingBox(null)
    setVideoStream(null)
  }

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  return {
    isFaceDetected,
    isWebcamActive,
    confidence,
    boundingBox,
    startWebcam,
    stopWebcam,
    faceDetectionError,
    videoStream,
  }
}
