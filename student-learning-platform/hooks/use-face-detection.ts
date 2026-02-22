"use client"

import { useState, useEffect, useRef } from "react"

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
  const [modelsLoaded] = useState(true)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startWebcam = async () => {
    if (streamRef.current) {
      console.log("📷 Already have stream")
      return
    }

    console.log("📷 Starting webcam...")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false
      })

      console.log("✅ Got stream")
      streamRef.current = stream
      setVideoStream(stream)

      // Small delay to ensure video element is ready
      await new Promise(r => setTimeout(r, 100))

      const videoEl = videoRef.current
      if (videoEl) {
        videoEl.srcObject = stream
        videoEl.play().then(() => {
          console.log("✅ Playing")
          setIsWebcamActive(true)
          setIsFaceDetected(true)
        }).catch(e => console.log("Play error:", e))
      }
    } catch (err: any) {
      console.error("❌ Error:", err)
      setFaceDetectionError(err.message || "Camera error")
    }
  }

  const stopWebcam = () => {
    console.log("🛑 Stopping")

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setVideoStream(null)
    setIsWebcamActive(false)
    setIsFaceDetected(false)
  }

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
