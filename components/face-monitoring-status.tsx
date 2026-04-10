import { Camera } from "lucide-react"

type FaceMonitoringStatusProps = {
  cameraActive: boolean
  isFaceDetected: boolean
  faceNotDetectedCountdown: number | null
}

export function FaceMonitoringStatus({
  cameraActive,
  isFaceDetected,
  faceNotDetectedCountdown,
}: FaceMonitoringStatusProps) {
  return (
    <div className={`p-3 rounded-lg border ${isFaceDetected ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex items-center gap-2">
        <Camera className={`h-4 w-4 ${isFaceDetected ? "text-green-600" : "text-red-500"}`} />
        <span className="font-medium text-sm">Face Detection</span>
        {!isFaceDetected && cameraActive && faceNotDetectedCountdown !== null && faceNotDetectedCountdown > 0 && (
          <span className="ml-auto text-xs font-semibold text-red-600">{faceNotDetectedCountdown}s</span>
        )}
      </div>
      <p className="text-xs text-gray-700 mt-1">
        {!cameraActive
          ? "Camera Inactive"
          : isFaceDetected
            ? "Face Detected"
            : faceNotDetectedCountdown !== null && faceNotDetectedCountdown > 0
              ? `Pausing in ${faceNotDetectedCountdown}s...`
              : "No Face"}
      </p>
    </div>
  )
}
