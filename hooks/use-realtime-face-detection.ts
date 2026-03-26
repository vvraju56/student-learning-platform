"use client"

import { useState, useEffect, useRef } from "react"

interface RealtimeFaceDetectionHook {
  isFaceDetected: boolean
  isEyesDetected: boolean
  isEyeTrackingStable: boolean
  eyeTrackingConfidence: number
  gazeDirection: string
  isBlinking: boolean
  isWebcamActive: boolean
  confidence: number
  boundingBox: { x: number; y: number; width: number; height: number } | null
  startWebcam: () => Promise<void>
  stopWebcam: () => void
  faceDetectionError: string | null
  videoStream: MediaStream | null
}

type Point = { x: number; y: number }

type DetectionResult = {
  face: boolean
  eyes: boolean
  eyeStable: boolean
  gaze: string
  blink: boolean
  confidence: number
  trackingConfidence: number
  box: { x: number; y: number; width: number; height: number } | null
}

type FaceLandmarkerInstance = {
  detectForVideo: (videoFrame: HTMLVideoElement, timestampMs: number) => any
  close?: () => void
}

type TfFaceMeshDetector = {
  estimateFaces: (input: HTMLVideoElement, estimationConfig?: { flipHorizontal?: boolean }) => Promise<any[]>
  dispose?: () => void
}

type FaceOnlyDetector = {
  estimateFaces: (input: HTMLVideoElement) => Promise<any[]>
  dispose?: () => void
}

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function gazeRatioHorizontal(eyePoints: Point[], iris: Point) {
  if (eyePoints.length < 2) return 0.5
  const xs = eyePoints.map((p) => p.x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const width = maxX - minX
  if (width <= 1e-6) return 0.5
  const value = (iris.x - minX) / width
  return Math.max(0, Math.min(1, value))
}

function gazeRatioVertical(eyePoints: Point[], iris: Point) {
  if (eyePoints.length < 2) return 0.5
  const ys = eyePoints.map((p) => p.y)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const height = maxY - minY
  if (height <= 1e-6) return 0.5
  const value = (iris.y - minY) / height
  return Math.max(0, Math.min(1, value))
}

function pointFromNormalized(
  landmarks: Array<{ x: number; y: number }>,
  index: number,
  width: number,
  height: number,
): Point | null {
  const p = landmarks?.[index]
  if (!p || typeof p.x !== "number" || typeof p.y !== "number") return null
  return { x: p.x * width, y: p.y * height }
}

function contourFromIndices(
  landmarks: Array<{ x: number; y: number }>,
  indices: number[],
  width: number,
  height: number,
) {
  const points: Point[] = []
  for (const idx of indices) {
    const p = pointFromNormalized(landmarks, idx, width, height)
    if (p) points.push(p)
  }
  return points
}

export function useRealtimeFaceDetection(): RealtimeFaceDetectionHook {
  const [isFaceDetected, setIsFaceDetected] = useState(false)
  const [isEyesDetected, setIsEyesDetected] = useState(false)
  const [isEyeTrackingStable, setIsEyeTrackingStable] = useState(false)
  const [eyeTrackingConfidence, setEyeTrackingConfidence] = useState(0)
  const [gazeDirection, setGazeDirection] = useState("unknown")
  const [isBlinking, setIsBlinking] = useState(false)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [boundingBox, setBoundingBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isDetectingRef = useRef(false)
  const faceLandmarkerRef = useRef<FaceLandmarkerInstance | null>(null)
  const tfFaceMeshRef = useRef<TfFaceMeshDetector | null>(null)
  const faceOnlyDetectorRef = useRef<FaceOnlyDetector | null>(null)

  const eyeClosedFramesRef = useRef(0)
  const openEarSamplesRef = useRef<number[]>([])
  const trackingHistoryRef = useRef<number[]>([])

  // Same landmark ids as your Python files.
  const LEFT_EYE_TOP = 159
  const LEFT_EYE_BOTTOM = 145
  const RIGHT_EYE_TOP = 386
  const RIGHT_EYE_BOTTOM = 374
  const LEFT_EYE_LEFT = 33
  const LEFT_EYE_RIGHT = 133
  const RIGHT_EYE_LEFT = 362
  const RIGHT_EYE_RIGHT = 263
  const LEFT_IRIS = 468
  const RIGHT_IRIS = 473

  const LEFT_EYE_LANDMARKS = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
  const RIGHT_EYE_LANDMARKS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]

  // Tuned from python defaults.
  const EYE_CLOSED_CONFIRM_FRAMES = 3
  const EAR_BASE_THRESHOLD = 0.2
  const EAR_CALIBRATION_FACTOR = 0.65
  const EAR_SAMPLE_WINDOW = 30
  const EYE_STABLE_MIN_CONFIDENCE = 0.45
  const EYE_CONFIDENCE_WINDOW = 24

  // Python fallback gaze bounds.
  const GAZE_LEFT = 0.4
  const GAZE_RIGHT = 0.6
  const SCREEN_H_MIN = 0.25
  const SCREEN_H_MAX = 0.75
  const SCREEN_V_MIN = 0.35
  const SCREEN_V_MAX = 0.75

  const pushTrackingHistory = (value: boolean) => {
    trackingHistoryRef.current.push(value ? 1 : 0)
    if (trackingHistoryRef.current.length > EYE_CONFIDENCE_WINDOW) {
      trackingHistoryRef.current.shift()
    }
  }

  const currentTrackingConfidence = () => {
    if (trackingHistoryRef.current.length === 0) return 0
    return average(trackingHistoryRef.current)
  }

  const loadFaceDetectionModel = async () => {
    faceLandmarkerRef.current = null
    tfFaceMeshRef.current = null
    faceOnlyDetectorRef.current = null
    let hasAnyDetector = false

    // 1) Primary: TensorFlow FaceMesh model for browser runtime.
    try {
      const [faceLandmarksDetection, tf] = await Promise.all([
        import("@tensorflow-models/face-landmarks-detection"),
        import("@tensorflow/tfjs"),
        import("@tensorflow/tfjs-backend-webgl"),
      ])

      try {
        if (tf.getBackend() !== "webgl") {
          await tf.setBackend("webgl")
        }
      } catch {
        await tf.setBackend("cpu")
      }
      await tf.ready()

      tfFaceMeshRef.current = (await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          refineLandmarks: true,
          maxFaces: 1,
        },
      )) as TfFaceMeshDetector
      if (tfFaceMeshRef.current) {
        hasAnyDetector = true
      }
    } catch (tfError) {
      console.warn("Failed to initialize TF FaceMesh fallback:", tfError)
    }

    // 2) Final fallback for face state: face-only detector.
    try {
      const [faceDetection, tf] = await Promise.all([
        import("@tensorflow-models/face-detection"),
        import("@tensorflow/tfjs"),
      ])

      try {
        if (tf.getBackend() !== "webgl") {
          await tf.setBackend("webgl")
        }
      } catch {
        await tf.setBackend("cpu")
      }
      await tf.ready()

      faceOnlyDetectorRef.current = (await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
          runtime: "tfjs",
          modelType: "short",
          maxFaces: 1,
        },
      )) as FaceOnlyDetector
      if (faceOnlyDetectorRef.current) {
        hasAnyDetector = true
      }
    } catch (faceOnlyError) {
      console.warn("Failed to initialize face-only fallback:", faceOnlyError)
    }

    return hasAnyDetector
  }

  const detectFace = async (): Promise<DetectionResult> => {
    if (
      !videoRef.current ||
      videoRef.current.readyState < 2 ||
      (!faceLandmarkerRef.current && !tfFaceMeshRef.current && !faceOnlyDetectorRef.current)
    ) {
      return {
        face: false,
        eyes: false,
        eyeStable: false,
        gaze: "unknown",
        blink: false,
        confidence: 0,
        trackingConfidence: currentTrackingConfidence(),
        box: null,
      }
    }

    try {
      const video = videoRef.current
      const width = video.videoWidth || 640
      const height = video.videoHeight || 480

      let landmarks: Array<{ x: number; y: number }> | undefined
      let modelConfidence = 0.9

      if (faceLandmarkerRef.current) {
        const result = faceLandmarkerRef.current.detectForVideo(video, performance.now())
        landmarks = result?.faceLandmarks?.[0] as Array<{ x: number; y: number }> | undefined
      }

      if ((!landmarks || landmarks.length < 400) && tfFaceMeshRef.current) {
        const tfFaces = await tfFaceMeshRef.current.estimateFaces(video, { flipHorizontal: true })
        const tfFace = tfFaces?.[0]
        if (tfFace?.keypoints?.length >= 400) {
          modelConfidence = typeof tfFace.faceInViewConfidence === "number" ? tfFace.faceInViewConfidence : 0.85
          landmarks = tfFace.keypoints.map((p: any) => ({
            x: (typeof p?.x === "number" ? p.x : 0) / width,
            y: (typeof p?.y === "number" ? p.y : 0) / height,
          }))
        }
      }

      if ((!landmarks || landmarks.length < 400) && faceOnlyDetectorRef.current) {
        const faces = await faceOnlyDetectorRef.current.estimateFaces(video)
        const face = faces?.[0]
        if (face) {
          const fallbackLandmarks = Array.isArray(face.keypoints) ? face.keypoints : []
          const keyName = (value: any) =>
            String(value ?? "")
              .toLowerCase()
              .replace(/[^a-z]/g, "")
          const parseKeypoint = (kp: any): Point | null => {
            if (Array.isArray(kp) && kp.length >= 2 && Number.isFinite(kp[0]) && Number.isFinite(kp[1])) {
              return { x: kp[0], y: kp[1] }
            }
            if (kp && typeof kp.x === "number" && typeof kp.y === "number") {
              return { x: kp.x, y: kp.y }
            }
            return null
          }
          const namedLeft = fallbackLandmarks.find((kp: any) => keyName(kp?.name) === "lefteye")
          const namedRight = fallbackLandmarks.find((kp: any) => keyName(kp?.name) === "righteye")
          const leftEye = parseKeypoint(namedLeft ?? fallbackLandmarks[1] ?? fallbackLandmarks[0])
          const rightEye = parseKeypoint(namedRight ?? fallbackLandmarks[0] ?? fallbackLandmarks[1])
          const hasFallbackEyes = !!leftEye && !!rightEye

          const fBox = face.box
            ? {
                x: face.box.xMin ?? 0,
                y: face.box.yMin ?? 0,
                width: face.box.width ?? 0,
                height: face.box.height ?? 0,
              }
            : null
          const fConfidence = Array.isArray(face.score)
            ? (face.score[0] ?? 0.8)
            : (typeof face.score === "number" ? face.score : 0.8)

          pushTrackingHistory(hasFallbackEyes)
          const fallbackTrackingConfidence = currentTrackingConfidence()

          return {
            face: true,
            eyes: hasFallbackEyes,
            eyeStable: hasFallbackEyes && fallbackTrackingConfidence >= EYE_STABLE_MIN_CONFIDENCE,
            gaze: hasFallbackEyes ? "center" : "unknown",
            blink: false,
            confidence: fConfidence,
            trackingConfidence: fallbackTrackingConfidence,
            box: fBox,
          }
        }
      }

      if (!landmarks || landmarks.length < 400) {
        pushTrackingHistory(false)
        eyeClosedFramesRef.current = 0
        return {
          face: false,
          eyes: false,
          eyeStable: false,
          gaze: "unknown",
          blink: false,
          confidence: 0,
          trackingConfidence: currentTrackingConfidence(),
          box: null,
        }
      }

      const allX = landmarks.map((p) => p.x * width)
      const allY = landmarks.map((p) => p.y * height)
      const minX = Math.min(...allX)
      const maxX = Math.max(...allX)
      const minY = Math.min(...allY)
      const maxY = Math.max(...allY)
      const box = {
        x: minX,
        y: minY,
        width: Math.max(0, maxX - minX),
        height: Math.max(0, maxY - minY),
      }

      const leftTop = pointFromNormalized(landmarks, LEFT_EYE_TOP, width, height)
      const leftBottom = pointFromNormalized(landmarks, LEFT_EYE_BOTTOM, width, height)
      const leftLeft = pointFromNormalized(landmarks, LEFT_EYE_LEFT, width, height)
      const leftRight = pointFromNormalized(landmarks, LEFT_EYE_RIGHT, width, height)
      const rightTop = pointFromNormalized(landmarks, RIGHT_EYE_TOP, width, height)
      const rightBottom = pointFromNormalized(landmarks, RIGHT_EYE_BOTTOM, width, height)
      const rightLeft = pointFromNormalized(landmarks, RIGHT_EYE_LEFT, width, height)
      const rightRight = pointFromNormalized(landmarks, RIGHT_EYE_RIGHT, width, height)

      const leftEyeContour = contourFromIndices(landmarks, LEFT_EYE_LANDMARKS, width, height)
      const rightEyeContour = contourFromIndices(landmarks, RIGHT_EYE_LANDMARKS, width, height)
      const leftIris = pointFromNormalized(landmarks, LEFT_IRIS, width, height)
      const rightIris = pointFromNormalized(landmarks, RIGHT_IRIS, width, height)

      const hasEyeCore =
        !!leftTop && !!leftBottom && !!leftLeft && !!leftRight &&
        !!rightTop && !!rightBottom && !!rightLeft && !!rightRight
      const hasEyeContours = leftEyeContour.length >= 8 && rightEyeContour.length >= 8
      const eyesDetected = hasEyeCore || hasEyeContours

      if (!eyesDetected) {
        pushTrackingHistory(false)
        return {
          face: true,
          eyes: false,
          eyeStable: false,
          gaze: "unknown",
          blink: false,
          confidence: 0.8,
          trackingConfidence: currentTrackingConfidence(),
          box,
        }
      }

      const leftEar = hasEyeCore ? dist(leftTop!, leftBottom!) / Math.max(dist(leftLeft!, leftRight!), 1e-6) : 0.24
      const rightEar = hasEyeCore ? dist(rightTop!, rightBottom!) / Math.max(dist(rightLeft!, rightRight!), 1e-6) : 0.24
      const avgEar = (leftEar + rightEar) / 2

      if (avgEar > EAR_BASE_THRESHOLD) {
        openEarSamplesRef.current.push(avgEar)
        if (openEarSamplesRef.current.length > EAR_SAMPLE_WINDOW) {
          openEarSamplesRef.current.shift()
        }
      }

      const openEyeEar = openEarSamplesRef.current.length >= 10 ? average(openEarSamplesRef.current) : 0.3
      const dynamicThreshold = Math.max(EAR_BASE_THRESHOLD, openEyeEar * EAR_CALIBRATION_FACTOR)
      const eyesClosed = avgEar < dynamicThreshold

      if (eyesClosed) eyeClosedFramesRef.current += 1
      else eyeClosedFramesRef.current = 0

      const eyesOpen = eyeClosedFramesRef.current < EYE_CLOSED_CONFIRM_FRAMES
      const blink = !eyesOpen

      let gaze = "unknown"
      let onScreen = false

      if (leftIris && rightIris && hasEyeContours) {
        const leftH = gazeRatioHorizontal(leftEyeContour, leftIris)
        const rightH = gazeRatioHorizontal(rightEyeContour, rightIris)
        const avgH = (leftH + rightH) / 2

        const leftV = gazeRatioVertical(leftEyeContour, leftIris)
        const rightV = gazeRatioVertical(rightEyeContour, rightIris)
        const avgV = (leftV + rightV) / 2

        if (avgH < GAZE_LEFT) gaze = "left"
        else if (avgH > GAZE_RIGHT) gaze = "right"
        else gaze = "center"

        onScreen = avgH > SCREEN_H_MIN && avgH < SCREEN_H_MAX && avgV > SCREEN_V_MIN && avgV < SCREEN_V_MAX
      }

      const trackFrameOk = eyesOpen && onScreen
      pushTrackingHistory(trackFrameOk)
      const trackingConfidence = currentTrackingConfidence()
      const eyeStable = trackingConfidence >= EYE_STABLE_MIN_CONFIDENCE

      return {
        face: true,
        eyes: eyesDetected,
        eyeStable,
        gaze,
        blink,
        confidence: modelConfidence,
        trackingConfidence,
        box,
      }
    } catch (error) {
      console.error("FaceLandmarker detection error:", error)
      pushTrackingHistory(false)
      return {
        face: false,
        eyes: false,
        eyeStable: false,
        gaze: "unknown",
        blink: false,
        confidence: 0,
        trackingConfidence: currentTrackingConfidence(),
        box: null,
      }
    }
  }

  const startFaceDetectionLoop = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }

    let faceMissingCount = 0
    const maxFaceMissingCount = 3

    detectionIntervalRef.current = setInterval(async () => {
      if (isDetectingRef.current) return
      isDetectingRef.current = true

      try {
        if (!streamRef.current || !streamRef.current.active) {
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current)
            detectionIntervalRef.current = null
          }
          setIsWebcamActive(false)
          setIsFaceDetected(false)
          setIsEyesDetected(false)
          setIsEyeTrackingStable(false)
          setGazeDirection("unknown")
          setIsBlinking(false)
          setConfidence(0)
          setEyeTrackingConfidence(0)
          setBoundingBox(null)
          return
        }

        const detection = await detectFace()

        if (detection.face) {
          faceMissingCount = 0
          setIsFaceDetected(true)
          setIsEyesDetected(detection.eyes)
          setIsEyeTrackingStable(detection.eyeStable)
          setGazeDirection(detection.gaze)
          setIsBlinking(detection.blink)
          setConfidence(detection.confidence)
          setEyeTrackingConfidence(detection.trackingConfidence)
          setBoundingBox(detection.box)
        } else {
          faceMissingCount += 1
          if (faceMissingCount >= maxFaceMissingCount) {
            setIsFaceDetected(false)
            setIsEyesDetected(false)
            setIsEyeTrackingStable(false)
            setGazeDirection("unknown")
            setIsBlinking(false)
            setConfidence(0)
            setBoundingBox(null)
          }
          setEyeTrackingConfidence(detection.trackingConfidence)
        }
      } finally {
        isDetectingRef.current = false
      }
    }, 300)
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
    } catch (error: any) {
      const errorName = typeof error?.name === "string" ? error.name : ""
      const deviceBusy = errorName === "NotReadableError"

      if (deviceBusy) {
        console.warn("Webcam busy: another app/service is using the camera")
        setFaceDetectionError("Webcam is already in use (Python eye service may own it).")
      } else {
        console.error("Webcam access/model init error:", error)
        setFaceDetectionError("Webcam access denied or model failed to initialize")
      }
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

    if (faceLandmarkerRef.current?.close) {
      faceLandmarkerRef.current.close()
    }
    faceLandmarkerRef.current = null

    if (tfFaceMeshRef.current?.dispose) {
      tfFaceMeshRef.current.dispose()
    }
    tfFaceMeshRef.current = null

    if (faceOnlyDetectorRef.current?.dispose) {
      faceOnlyDetectorRef.current.dispose()
    }
    faceOnlyDetectorRef.current = null

    setIsWebcamActive(false)
    setIsFaceDetected(false)
    setIsEyesDetected(false)
    setIsEyeTrackingStable(false)
    setGazeDirection("unknown")
    setIsBlinking(false)
    setConfidence(0)
    setEyeTrackingConfidence(0)
    setBoundingBox(null)
    setVideoStream(null)

    isDetectingRef.current = false
    eyeClosedFramesRef.current = 0
    openEarSamplesRef.current = []
    trackingHistoryRef.current = []
  }

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  return {
    isFaceDetected,
    isEyesDetected,
    isEyeTrackingStable,
    eyeTrackingConfidence,
    gazeDirection,
    isBlinking,
    isWebcamActive,
    confidence,
    boundingBox,
    startWebcam,
    stopWebcam,
    faceDetectionError,
    videoStream,
  }
}
