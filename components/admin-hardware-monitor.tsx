"use client"

import { useState, useEffect } from "react"

interface HardwareStatus {
  userId: string
  deviceId: string
  online: boolean
  lastHeartbeat: number
  motionDetected: boolean
  lastMotionAt: number
  lastSensorUpdate?: number
  alert: {
    led: boolean
    buzzer: boolean
    reason: string
    timestamp: number
  }
  wifiRSSI?: number
}

interface AdminHardwareMonitorProps {
  userId: string
  deviceId?: string
  adminEmail?: string
}

const HEARTBEAT_TIMEOUT_MS = 7000
const SENSOR_TIMEOUT_MS = 15000

export function AdminHardwareMonitor({
  userId,
  deviceId,
  adminEmail = "admin@123.in"
}: AdminHardwareMonitorProps) {
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !adminEmail) return

    let mounted = true

    const fetchHardwareStatus = async (isInitial = false) => {
      if (isInitial) {
        setLoading(true)
      }

      try {
        const params = new URLSearchParams({ userId, adminEmail })
        if (deviceId?.trim()) {
          params.set("deviceId", deviceId.trim())
        }

        const response = await fetch(`/api/admin/hardware-status?${params.toString()}`, {
          cache: "no-store"
        })
        const payload = await response.json()

        if (!mounted) return

        if (!response.ok || !payload?.success) {
          setError(payload?.error || "Failed to load hardware status")
          if (isInitial) {
            setLoading(false)
          }
          return
        }

        const data = payload.status
        const selectedDeviceId = (payload?.deviceId || deviceId || "unassigned").toString()

        if (data) {
          setHardwareStatus({
            userId,
            deviceId: selectedDeviceId,
            online: data.online ?? false,
            lastHeartbeat: data.lastHeartbeat ?? 0,
            motionDetected: data.motionDetected ?? false,
            lastMotionAt: data.lastMotionAt ?? 0,
            lastSensorUpdate: data.lastSensorUpdate ?? data.lastHeartbeat ?? 0,
            alert: data.alert ?? { led: false, buzzer: false, reason: "ok", timestamp: 0 },
            wifiRSSI: data.wifiRSSI
          })
        } else {
          setHardwareStatus(null)
        }

        setError(null)
      } catch (fetchError) {
        if (!mounted) return
        console.error("Hardware monitor API error:", fetchError)
        setError("Failed to load hardware status")
      } finally {
        if (mounted && isInitial) {
          setLoading(false)
        }
      }
    }

    void fetchHardwareStatus(true)
    const intervalId = setInterval(() => {
      void fetchHardwareStatus(false)
    }, 3000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [userId, deviceId, adminEmail])

  if (loading) return <div className="text-gray-400 text-sm">Loading hardware status...</div>
  if (error) return <div className="text-red-400 text-sm">{error}</div>
  if (!hardwareStatus) return <div className="text-gray-500 text-sm">No hardware connected</div>

  const { online, motionDetected, alert, lastHeartbeat } = hardwareStatus
  const heartbeatAgeMs = Date.now() - (lastHeartbeat || 0)
  const isOnline = online && lastHeartbeat > 0 && heartbeatAgeMs <= HEARTBEAT_TIMEOUT_MS
  const sensorAgeMs = Date.now() - (hardwareStatus.lastSensorUpdate || lastHeartbeat || 0)
  const sensorStale = isOnline && sensorAgeMs > SENSOR_TIMEOUT_MS
  const isMotionViolation = motionDetected && (Date.now() - (hardwareStatus.lastMotionAt || 0)) > 5000

  return (
    <div className="hardware-status-panel bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Hardware Status</h3>
        <span className={`px-2 py-1 rounded text-xs ${isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Device ID:</span>
          <span className="text-white">{hardwareStatus.deviceId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Motion:</span>
          <span className={`${motionDetected ? "text-blue-400" : "text-gray-400"}`}>
            {motionDetected ? "Detected" : "None"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Alert:</span>
          <span className={`${alert?.buzzer ? "text-red-400" : "text-gray-400"}`}>
            {alert?.reason || "None"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Sensor:</span>
          <span className={`${sensorStale ? "text-red-400" : "text-green-400"}`}>
            {sensorStale ? "Stale" : "OK"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Last Seen:</span>
          <span className="text-white">
            {lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : "N/A"}
          </span>
        </div>
      </div>

      {motionDetected && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Motion Duration</span>
            <span>{Math.floor((Date.now() - (hardwareStatus.lastMotionAt || 0)) / 1000)}s / 5s</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${isMotionViolation ? "bg-red-500" : "bg-blue-500"}`}
              style={{
                width: `${Math.min(((Date.now() - (hardwareStatus.lastMotionAt || 0)) / 5000) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
