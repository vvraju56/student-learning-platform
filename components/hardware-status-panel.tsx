"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Wifi, AlertTriangle, CheckCircle, XCircle, Clock, Activity } from 'lucide-react'
import { useHardwareMonitoring } from '@/hooks/use-hardware-monitoring'

interface HardwareStatusPanelProps {
  userId: string
  deviceId?: string
  showControls?: boolean
}

export function HardwareStatusPanel({
  userId,
  deviceId,
  showControls = true
}: HardwareStatusPanelProps) {
  const {
    hardwareStatus,
    isOnline,
    isMotionDetected,
    motionDuration,
    motionViolation,
    hardwareError,
    triggerAlert,
    clearAlert,
    refreshStatus
  } = useHardwareMonitoring({ userId, deviceId })

  const [motionSeconds, setMotionSeconds] = useState(0)

  // Update motion seconds counter
  useEffect(() => {
    if (isMotionDetected) {
      const interval = setInterval(() => {
        setMotionSeconds(Math.floor(motionDuration / 1000))
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setMotionSeconds(0)
    }
  }, [isMotionDetected, motionDuration])

  // Get motion status text
  const getMotionStatusText = () => {
    if (!isMotionDetected) return 'No motion'
    if (motionViolation) return 'Violation!'
    if (motionSeconds >= 3) return 'Long motion...'
    return 'Motion detected'
  }

  // Get motion status color
  const getMotionStatusColor = () => {
    if (motionViolation) return 'bg-red-100 text-red-700'
    if (isMotionDetected) {
      if (motionSeconds >= 4) return 'bg-orange-100 text-orange-700'
      if (motionSeconds >= 3) return 'bg-yellow-100 text-yellow-700'
      return 'bg-blue-100 text-blue-700'
    }
    return 'bg-green-100 text-green-700'
  }

  // Get motion progress (based on 5-second threshold)
  const motionProgress = Math.min((motionDuration / 5000) * 100, 100)

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Hardware Status
          <Badge variant={isOnline ? "default" : "destructive"} className="ml-auto">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className={`h-4 w-4 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-sm text-gray-600">ESP32 Connection</span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
            {isOnline ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Motion Detection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${isMotionDetected ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-600">Motion Detection</span>
            </div>
            <Badge className={getMotionStatusColor()}>
              {getMotionStatusText()}
            </Badge>
          </div>
          
          {/* Motion Progress Bar (5-second threshold) */}
          {isMotionDetected && (
            <div className="space-y-1">
              <Progress 
                value={motionProgress} 
                className="h-2"
                indicatorClassName={motionViolation ? 'bg-red-500' : motionSeconds >= 3 ? 'bg-orange-500' : 'bg-blue-500'}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0s</span>
                <span>{motionSeconds}s / 5s</span>
                <span>5s</span>
              </div>
            </div>
          )}
        </div>

        {/* Alert Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-4 w-4 ${hardwareStatus?.alert?.buzzer ? 'text-red-600' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-600">Alert Status</span>
          </div>
          <Badge variant={hardwareStatus?.alert?.buzzer ? "destructive" : "secondary"} className="text-xs">
            {hardwareStatus?.alert?.reason || 'None'}
          </Badge>
        </div>

        {/* WiFi Signal (if available) */}
        {hardwareStatus?.wifiRSSI !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">WiFi Signal</span>
            </div>
            <span className="text-xs text-gray-500">
              {hardwareStatus.wifiRSSI} dBm
            </span>
          </div>
        )}

        {/* Error Message */}
        {hardwareError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
            <XCircle className="h-4 w-4" />
            {hardwareError}
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={refreshStatus}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            {hardwareStatus?.alert?.buzzer && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={clearAlert}
                className="flex-1"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Clear Alert
              </Button>
            )}
          </div>
        )}

        {/* Status Timestamp */}
        <div className="text-xs text-gray-400 text-center pt-2">
          Last updated: {new Date(hardwareStatus?.lastHeartbeat || Date.now()).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper component for refresh icon
function RefreshCw({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}


