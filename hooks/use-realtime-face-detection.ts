"use client"

import { useMemo } from "react"
import { useFaceDetection } from "./use-face-detection"

interface RealtimeFaceDetectionHook {
  isFaceDetected: boolean
  isWebcamActive: boolean
  startWebcam: () => Promise<void>
  stopWebcam: () => void
  faceDetectionError: string | null
  videoStream: MediaStream | null
}

export function useRealtimeFaceDetection(): RealtimeFaceDetectionHook {
  const {
    isFaceDetected,
    isWebcamActive,
    startWebcam,
    stopWebcam,
    faceDetectionError,
    videoStream,
  } = useFaceDetection()

  return useMemo(
    () => ({
      isFaceDetected,
      isWebcamActive,
      startWebcam,
      stopWebcam,
      faceDetectionError,
      videoStream,
    }),
    [isFaceDetected, isWebcamActive, startWebcam, stopWebcam, faceDetectionError, videoStream],
  )
}
