"use client"

import React from "react"
import { Eye, Monitor, Camera, CameraOff, AlertTriangle, Activity } from "lucide-react"

interface PythonFaceMonitoringStatusProps {
  isConnected: boolean
  isFaceDetected: boolean
  isEyesDetected: boolean
  isEyeTrackingStable: boolean
  gazeDirection: string
  isBlinking: boolean
  isDrowsy: boolean
  headPose: { yaw: number; pitch: number; roll: number }
  gazePosition: { x: number; y: number }
  distracted: boolean
  reason: string
}

export function PythonFaceMonitoringStatus({
  isConnected,
  isFaceDetected,
  isEyesDetected,
  isEyeTrackingStable,
  gazeDirection,
  isBlinking,
  isDrowsy,
  headPose,
  gazePosition,
  distracted,
  reason
}: PythonFaceMonitoringStatusProps) {
  return (
    <div className="grid grid-cols-1 gap-3 w-full">
      {/* Connection Status */}
      <div className={`p-3 rounded-lg border ${isConnected ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          <Activity className={`h-4 w-4 ${isConnected ? 'text-blue-600' : 'text-red-600'}`} />
          <span className="font-medium text-sm">Python Backend Connection</span>
          <span className={`ml-auto text-xs font-bold ${isConnected ? 'text-blue-600' : 'text-red-600'}`}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {isConnected ? 'Using Python MediaPipe for advanced tracking' : 'Run web_server.py in eye dectetion folder'}
        </p>
      </div>

      {/* Face & Eye Detection Status */}
      <div className={`p-3 rounded-lg border ${!isConnected ? 'bg-gray-50 border-gray-200 text-gray-400' : isFaceDetected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          <Camera className={`h-4 w-4 ${!isConnected ? 'text-gray-400' : isFaceDetected ? 'text-green-600' : 'text-red-600'}`} />
          <span className="font-medium text-sm">Python Face Detection</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {!isConnected ? 'Waiting for connection' : isFaceDetected ? (isEyesDetected ? 'Face & Eyes Detected' : 'Face OK, Eyes Missing') : 'No Face Detected'}
        </p>
      </div>

      {/* Head Pose & Gaze Status */}
      <div className={`p-3 rounded-lg border ${!isConnected || !isFaceDetected ? 'bg-gray-50 border-gray-200 text-gray-400' : distracted ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center gap-2">
          <Monitor className={`h-4 w-4 ${!isConnected || !isFaceDetected ? 'text-gray-400' : distracted ? 'text-orange-600' : 'text-green-600'}`} />
          <span className="font-medium text-sm">Advanced Monitoring</span>
          {isConnected && isFaceDetected && distracted && (
            <span className="ml-auto text-xs font-bold text-orange-600 uppercase">
              {reason || 'Distracted'}
            </span>
          )}
        </div>
        
        {isConnected && isFaceDetected && (
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-bold uppercase">
              <div className="flex items-center gap-1">
                <span className={Math.abs(headPose.yaw) < 20 ? 'text-green-600' : 'text-red-600'}>
                  Yaw: {headPose.yaw.toFixed(1)}°
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={Math.abs(headPose.pitch) < 20 ? 'text-green-600' : 'text-red-600'}>
                  Pitch: {headPose.pitch.toFixed(1)}°
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={gazeDirection === 'center' ? 'text-green-600' : 'text-orange-600'}>
                  Gaze: {gazeDirection}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={isDrowsy ? 'text-red-600' : 'text-green-600'}>
                  {isDrowsy ? 'Eyes Closed' : 'Eyes Open'}
                </span>
              </div>
            </div>
            
            {/* Gaze Position Visualization */}
            <div className="relative w-full h-1 bg-gray-200 rounded overflow-hidden">
               <div 
                 className="absolute top-0 h-full bg-blue-500 w-2 transition-all duration-100"
                 style={{ left: `${gazePosition.x * 100}%` }}
               />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
