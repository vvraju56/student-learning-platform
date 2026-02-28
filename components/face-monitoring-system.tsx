"use client"

import { useEffect } from "react"
import { useFaceMonitoring } from "@/hooks/use-face-monitoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  CameraOff, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause
} from "lucide-react"

interface FaceMonitoringProps {
  videoRef: React.RefObject<HTMLIFrameElement>
  userId: string
  courseId: string
  videoId: string
  onProgressUpdate?: (validTime: number) => void
}

export default function FaceMonitoringComponent({ 
  videoRef, 
  userId, 
  courseId, 
  videoId,
  onProgressUpdate 
}: FaceMonitoringProps) {
  const { states, violations, validWatchTime, startMonitoring, stopMonitoring, requestCameraPermission, pauseVideo, resumeVideo } = useFaceMonitoring(videoRef)

  // Auto-save progress
  useEffect(() => {
    onProgressUpdate?.(validWatchTime)
  }, [validWatchTime, onProgressUpdate])

  const getStatusColor = (active: boolean) => 
    active ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"

  const getViolationColor = (count: number) => {
    if (count >= 10) return "text-red-600"
    if (count >= 5) return "text-amber-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Face Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Start/Stop Controls */}
          <div className="flex gap-2">
            {!states.monitoringActive ? (
              <Button onClick={startMonitoring} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Start Monitoring
              </Button>
            ) : (
              <Button onClick={stopMonitoring} variant="destructive" className="flex-1">
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Monitoring
              </Button>
            )}

            {states.monitoringActive && (
              <>
                {states.videoPlaying ? (
                  <Button onClick={pauseVideo} variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeVideo} variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Real-time Status Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${getStatusColor(states.cameraActive)}`}>
              <div className="flex items-center gap-2 mb-1">
                {states.cameraActive ? (
                  <Camera className="h-4 w-4" />
                ) : (
                  <CameraOff className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Camera</span>
              </div>
              <span className="text-xs">{states.cameraActive ? "Active" : "Inactive"}</span>
            </div>

            <div className={`p-3 rounded-lg border ${getStatusColor(states.faceDetected)}`}>
              <div className="flex items-center gap-2 mb-1">
                {states.faceDetected ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Face Detection</span>
              </div>
              <span className="text-xs">{states.faceDetected ? "Face Detected" : "No Face"}</span>
            </div>

            <div className={`p-3 rounded-lg border ${getStatusColor(states.tabVisible)}`}>
              <div className="flex items-center gap-2 mb-1">
                {states.tabVisible ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Focus</span>
              </div>
              <span className="text-xs">{states.tabVisible ? "Focused" : "Tab Switched"}</span>
            </div>

            <div className={`p-3 rounded-lg border ${getStatusColor(states.videoPlaying)}`}>
              <div className="flex items-center gap-2 mb-1">
                {states.videoPlaying ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Video</span>
              </div>
              <span className="text-xs">{states.videoPlaying ? "Playing" : "Paused"}</span>
            </div>
          </div>

          {/* Enforcement Status */}
          <div className="p-3 rounded-lg border bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Valid Watch Time</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.floor(validWatchTime / 60)}m {validWatchTime % 60}s
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violation Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Violation Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getViolationColor(violations.faceMissingCount)}`}>
                {violations.faceMissingCount}
              </div>
              <div className="text-sm text-gray-600">Face Missing</div>
              <div className="text-xs text-gray-500">Limit: {VIOLATION_LIMIT}</div>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold ${getViolationColor(violations.tabSwitchCount)}`}>
                {violations.tabSwitchCount}
              </div>
              <div className="text-sm text-gray-600">Tab Switches</div>
              <div className="text-xs text-gray-500">Limit: {VIOLATION_LIMIT}</div>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold ${getViolationColor(violations.autoPauseCount)}`}>
                {violations.autoPauseCount}
              </div>
              <div className="text-sm text-gray-600">Auto Pauses</div>
              <div className="text-xs text-gray-500">Total violations</div>
            </div>
          </div>

          {violations.videoInvalidated && (
            <div className="mt-4 p-3 rounded-lg border-2 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Video Invalidated</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Too many violations detected. Progress will not be counted for this video.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">🎯 Face Monitoring Rules</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Progress counted only when face is detected AND tab is active</li>
            <li>• Camera must remain uncovered throughout the session</li>
            <li>• Tab switching or window minimization pauses progress</li>
            <li>• More than {VIOLATION_LIMIT} violations invalidates the video</li>
            <li>• Your privacy is protected - no video is stored or recorded</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}