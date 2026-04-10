"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface FaceDetectionHook {
  isFaceDetected: boolean
  isWebcamActive: boolean
  startWebcam: () => Promise<void>
  stopWebcam: () => void
  faceDetectionError: string | null
  modelsLoaded: boolean
  videoStream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement>
}

export function useFaceDetection(): FaceDetectionHook {
  const [isFaceDetected, setIsFaceDetected] = useState(false)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const detectionIntervalRef = useRef<number | null>(null)

  const getOrCreateVideoElement = useCallback(() => {
    if (videoRef.current) {
      return videoRef.current
    }

    const internalVideo = document.createElement("video")
    internalVideo.autoplay = true
    internalVideo.muted = true
    internalVideo.playsInline = true
    internalVideo.setAttribute("data-face-detector-internal", "true")
    internalVideo.style.position = "fixed"
    internalVideo.style.left = "-9999px"
    internalVideo.style.top = "-9999px"
    internalVideo.style.width = "1px"
    internalVideo.style.height = "1px"
    internalVideo.style.opacity = "0"
    internalVideo.style.pointerEvents = "none"
    document.body.appendChild(internalVideo)
    videoRef.current = internalVideo
    return internalVideo
  }, [])

  const stopDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }, [])

  const loadFaceDetector = useCallback(async () => {
    if (detectorRef.current) return true

    try {
      const FaceDetectorCtor = (window as any).FaceDetector

      if (FaceDetectorCtor) {
        detectorRef.current = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 })
        setModelsLoaded(true)
        return true
      }

      // Fallback to TensorFlow model if available
      const faceDetection = await import("@tensorflow-models/face-detection")
      const tf = await import("@tensorflow/tfjs")

      await tf.setBackend("webgl")
      await tf.ready()

      const model = faceDetection.SupportedModels.MediaPipeFaceDetector
      detectorRef.current = await faceDetection.createDetector(model, {
        runtime: "tfjs" as const,
        maxFaces: 1
      })

      setModelsLoaded(true)
      return true
    } catch (error: any) {
      console.error("❌ Failed to load face detector:", error)
      setFaceDetectionError("Face detection not available in this browser")
      setModelsLoaded(false)
      return false
    }
  }, [])

  const detectFace = useCallback(async () => {
    const detector = detectorRef.current
    const videoEl = videoRef.current

    if (!detector || !videoEl || videoEl.readyState < 2) return false

    try {
      let faces: any[] = []

      if (typeof detector.detect === "function") {
        faces = await detector.detect(videoEl)
      } else if (typeof detector.estimateFaces === "function") {
        faces = await detector.estimateFaces(videoEl)
      }

      const detected = Array.isArray(faces) && faces.length > 0
      setIsFaceDetected(detected)
      return detected
    } catch (error) {
      console.error("Face detection error:", error)
      setFaceDetectionError("Unable to detect a face. Try repositioning or better lighting.")
      setIsFaceDetected(false)
      return false
    }
  }, [])

  const startDetectionLoop = useCallback(() => {
    stopDetectionLoop()
    detectionIntervalRef.current = window.setInterval(detectFace, 800)
  }, [detectFace, stopDetectionLoop])

  const startWebcam = async () => {
    if (streamRef.current) {
      console.log("📷 Already have stream - reusing")
      try {
        const videoEl = getOrCreateVideoElement()
        if (videoEl.srcObject !== streamRef.current) {
          videoEl.srcObject = streamRef.current
        }
        await videoEl.play()
        setIsWebcamActive(true)
        startDetectionLoop()
        void detectFace()
      } catch (err: any) {
        setFaceDetectionError(err?.message || "Camera error")
      }
      return
    }

    console.log("📷 Starting webcam...")

    try {
      setFaceDetectionError(null)

      const detectorReady = await loadFaceDetector()
      if (!detectorReady) return

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false
      })

      console.log("✅ Got stream")
      streamRef.current = stream
      setVideoStream(stream)
      const videoEl = getOrCreateVideoElement()
      videoEl.srcObject = stream
      await videoEl.play()
      console.log("✅ Playing")
      setIsWebcamActive(true)
      startDetectionLoop()
      void detectFace()
    } catch (err: any) {
      console.error("❌ Error:", err)
      setFaceDetectionError(err.message || "Camera error")
    }
  }

  const stopWebcam = () => {
    console.log("🛑 Stopping")

    stopDetectionLoop()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onplay = null
      const isInternal = videoRef.current.getAttribute("data-face-detector-internal") === "true"
      if (isInternal) {
        videoRef.current.remove()
        videoRef.current = null
      }
    }

    setVideoStream(null)
    setIsWebcamActive(false)
    setIsFaceDetected(false)
  }

  useEffect(() => {
    return () => {
      stopWebcam()
      stopDetectionLoop()
    }
  }, [stopDetectionLoop])

  return {
    isFaceDetected,
    isWebcamActive,
    startWebcam,
    stopWebcam,
    faceDetectionError,
    modelsLoaded,
    videoStream,
    videoRef
  }
}
