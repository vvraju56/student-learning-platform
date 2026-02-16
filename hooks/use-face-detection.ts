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
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      setFaceDetectionError(null)
      try {
        console.log("🔄 Loading face-api.js models...")

        // Dynamic import face-api.js
        const faceapi = await import("face-api.js")

        // Load TinyFaceDetector model from public/models
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models")

        setModelsLoaded(true)
        console.log("✅ face-api.js models loaded!")
      } catch (error: any) {
        console.error("❌ Error loading face detection models:", error)
        setFaceDetectionError(`Failed to load AI models: ${error.message}`)
      }
    }

    loadModels()
  }, [])

  // Start webcam and face detection
  const startWebcam = useCallback(async () => {
    console.log("📷 START WEBCAM CALLED")

    try {
      console.log("📷 Requesting camera access...")
      setFaceDetectionError(null)

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      })

      console.log("✅ Camera stream obtained")
      streamRef.current = stream
      setVideoStream(stream)

      // Get video element
      const videoEl = videoRef.current
      if (!videoEl) {
        setFaceDetectionError("Video element not ready")
        return
      }

      // Connect stream to video element
      videoEl.srcObject = stream
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        videoEl.onloadedmetadata = () => {
          console.log("📹 Video metadata loaded:", videoEl.videoWidth, "x", videoEl.videoHeight)
          resolve()
        }
      })

      // Start playing video
      await videoEl.play()
      console.log("✅ Video playing")

      setIsWebcamActive(true)
      
      // Start face detection if models loaded
      if (modelsLoaded) {
        startFaceDetection()
      } else {
        // Load models first, then start detection
        try {
          const faceapi = await import("face-api.js")
          await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
          setModelsLoaded(true)
          startFaceDetection()
        } catch (error) {
          console.error("Failed to load models:", error)
        }
      }
      
    } catch (error: any) {
      console.error("❌ Webcam access denied:", error)
      if (error.name === "NotAllowedError") {
        setFaceDetectionError("Webcam access denied. Please allow camera access in your browser settings.")
      } else if (error.name === "NotFoundError") {
        setFaceDetectionError("No webcam found. Please ensure a webcam is connected.")
      } else {
        setFaceDetectionError(`Error accessing webcam: ${error.message}`)
      }
      setIsWebcamActive(false)
    }
  }, [modelsLoaded])

  // Face detection loop
  const startFaceDetection = () => {
    const videoEl = videoRef.current
    if (!videoEl) {
      console.log("❌ Video element not ready")
      return
    }

    console.log("🔄 Starting face-api.js face detection...")

    const detectFace = async () => {
      if (!videoEl || !streamRef.current?.active) {
        return
      }

      // Check if video is ready
      if (videoEl.readyState !== 4 || videoEl.videoWidth === 0) {
        return
      }

      try {
        // Dynamic import face-api.js
        const faceapi = await import("face-api.js")

        // Detect faces using TinyFaceDetector
        const detections = await faceapi.detectAllFaces(
          videoEl,
          new faceapi.TinyFaceDetectorOptions()
        )

        const faceFound = detections && detections.length > 0
        setIsFaceDetected(faceFound)
        
        if (faceFound) {
          console.log("👤 Face DETECTED")
        }
      } catch (error) {
        console.error("Face detection error:", error)
      }
    }

    // Run detection every 500ms
    detectionIntervalRef.current = setInterval(detectFace, 500)
    console.log("✅ Face detection started")
  }

  // Stop webcam and cleanup
  const stopWebcam = useCallback(() => {
    console.log("🛑 Stopping webcam and face detection...")

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
    }

    setVideoStream(null)
    setIsWebcamActive(false)
    setIsFaceDetected(false)
    console.log("✅ Webcam and face detection stopped")
  }, [])

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
