"use client"

import React from "react"
import { Eye, Camera, CameraOff } from "lucide-react"

interface FaceMonitoringStatusProps {
  cameraActive: boolean
  isFaceDetected: boolean
  isEyesDetected: boolean
  faceNotDetectedCountdown?: number | null
  eyesNotDetectedCountdown?: number | null
}

export function FaceMonitoringStatus({
  cameraActive,
  isFaceDetected,
  isEyesDetected,
  faceNotDetectedCountdown = null,
  eyesNotDetectedCountdown = null,
}: FaceMonitoringStatusProps) {
  return (
    <div className="grid grid-cols-1 gap-3 w-full">
      {/* Face Detection Status */}
      <div className={`p-3 rounded-lg border ${!cameraActive ? 'bg-gray-50 border-gray-200' : isFaceDetected ? 'bg-green-50 border-green-200' : faceNotDetectedCountdown !== null ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          {cameraActive ? (
            <Camera className={`h-4 w-4 ${isFaceDetected ? 'text-green-600' : 'text-red-600'}`} />
          ) : (
            <CameraOff className="h-4 w-4 text-gray-400" />
          )}
          <span className="font-medium text-sm">Face Detection</span>
          {cameraActive && !isFaceDetected && faceNotDetectedCountdown !== null && faceNotDetectedCountdown > 0 && (
            <span className="ml-auto text-xs font-bold text-orange-600">
              {faceNotDetectedCountdown}s
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {cameraActive ? (isFaceDetected ? 'Face Detected' : faceNotDetectedCountdown !== null && faceNotDetectedCountdown > 0 ? `Pausing in ${faceNotDetectedCountdown}s...` : 'No Face') : 'Camera Inactive'}
        </p>
      </div>

      {/* Eye Detection Status */}
      <div className={`p-3 rounded-lg border ${!cameraActive || !isFaceDetected ? 'bg-gray-50 border-gray-200 text-gray-400' : isEyesDetected ? 'bg-green-50 border-green-200' : eyesNotDetectedCountdown !== null ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center gap-2">
          <Eye className={`h-4 w-4 ${!cameraActive || !isFaceDetected ? 'text-gray-400' : isEyesDetected ? 'text-green-600' : eyesNotDetectedCountdown !== null ? 'text-orange-600' : 'text-yellow-600'}`} />
          <span className="font-medium text-sm">Eye Detection</span>
          {cameraActive && isFaceDetected && eyesNotDetectedCountdown !== null && eyesNotDetectedCountdown > 0 && (
            <span className="ml-auto text-xs font-bold text-orange-600">
              {eyesNotDetectedCountdown}s
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {!cameraActive
            ? 'Camera Inactive'
            : !isFaceDetected
              ? 'Waiting for face'
              : isEyesDetected
                ? 'Eyes Detected'
                : eyesNotDetectedCountdown !== null && eyesNotDetectedCountdown > 0
                  ? `Pausing in ${eyesNotDetectedCountdown}s...`
                  : 'Eyes not detected'}
        </p>
      </div>
    </div>
  )
}
