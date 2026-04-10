"use client"

import { useEyeMonitoring } from "./use-eye-monitoring"
import { useRef } from "react"

/**
 * useFaceDetection - Now powered by Eye Tracking
 * Replaces old face detection with focus-aware eye tracking
 */
export function useFaceDetection() {
  const videoIframeRef = useRef<HTMLIFrameElement>(null)
  const { states, startMonitoring, stopMonitoring, canvasRef } = useEyeMonitoring(videoIframeRef)

  return {
    isFaceDetected: states.faceDetected && states.isFocusedNow,
    isWebcamActive: states.cameraActive,
    startWebcam: startMonitoring,
    stopWebcam: stopMonitoring,
    faceDetectionError: null,
    modelsLoaded: true,
    videoStream: null, // Stream is managed internally by useEyeMonitoring
    videoRef: { current: null }, // useEyeMonitoring creates its own video element
    canvasRef
  }
}
