"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ref, onValue, update, get } from 'firebase/database'
import { realtimeDb } from '@/lib/firebase'

let mappingPermissionWarned = false
let streamPermissionWarned = false

export interface HardwareStatus {
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

export interface HardwareConfig {
  userId: string
  deviceId?: string
  defaultDeviceId?: string
  motionThresholdMs?: number // Default: 5000 (5 seconds)
  heartbeatTimeoutMs?: number // Default: 7000 (7 seconds)
  sensorTimeoutMs?: number // Default: 15000 (15 seconds)
}

export interface TriggerAlertOptions {
  led?: boolean
  buzzer?: boolean
}

export interface HardwareMonitoringResult {
  activeDeviceId: string | null
  hardwareStatus: HardwareStatus | null
  isOnline: boolean
  isMotionDetected: boolean
  motionDuration: number
  motionViolation: boolean
  isMotionSensorStale: boolean
  connectionAgeMs: number
  hardwareError: string | null
  triggerAlert: (reason: string, options?: TriggerAlertOptions) => Promise<void>
  clearAlert: () => Promise<void>
  refreshStatus: () => Promise<void>
}

export function useHardwareMonitoring(config: HardwareConfig): HardwareMonitoringResult {
  const {
    userId,
    deviceId,
    defaultDeviceId = 'esp32-01',
    motionThresholdMs = 5000,
    heartbeatTimeoutMs = 7000,
    sensorTimeoutMs = 15000
  } = config

  const requestedDeviceId = deviceId?.trim()
  const fallbackDeviceId = defaultDeviceId.trim() || 'esp32-01'

  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(requestedDeviceId || null)
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null)
  const [listenerError, setListenerError] = useState<string | null>(null)
  const [motionViolation, setMotionViolation] = useState(false)
  const [nowTs, setNowTs] = useState(() => Date.now())

  const motionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Keep a lightweight clock so durations and heartbeat checks stay live.
  useEffect(() => {
    const tick = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  // Resolve assigned hardware device for this user.
  useEffect(() => {
    if (!userId) {
      setActiveDeviceId(null)
      return
    }

    if (requestedDeviceId) {
      setActiveDeviceId(requestedDeviceId)
      return
    }

    let cancelled = false

    const normalizeDeviceId = (value: unknown) =>
      typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

    const resolveDeviceId = async () => {
      const assignmentPaths = [
        `users/${userId}/hardware/deviceId`,
        `users/${userId}/hardwareDeviceId`,
        `users/${userId}/deviceId`,
        `hardwareAssignments/${userId}/deviceId`
      ]

      try {
        for (const assignmentPath of assignmentPaths) {
          const assignmentSnapshot = await get(ref(realtimeDb, assignmentPath))
          const assignedDeviceId = normalizeDeviceId(assignmentSnapshot.val())
          if (assignedDeviceId) {
            if (!cancelled) {
              setActiveDeviceId(assignedDeviceId)
            }
            return
          }
        }

        const hardwareRootSnapshot = await get(ref(realtimeDb, `hardwareStatus/${userId}`))
        if (hardwareRootSnapshot.exists()) {
          const hardwareNodes = hardwareRootSnapshot.val() as Record<string, any>
          const entries = Object.entries(hardwareNodes)
            .filter(([key, value]) => typeof key === 'string' && key.trim().length > 0 && value && typeof value === 'object')
            .sort((a, b) => {
              const aHeartbeat = Number(a[1]?.lastHeartbeat) || 0
              const bHeartbeat = Number(b[1]?.lastHeartbeat) || 0
              return bHeartbeat - aHeartbeat
            })

          if (entries.length > 0) {
            if (!cancelled) {
              setActiveDeviceId(entries[0][0])
            }
            return
          }
        }
      } catch (error) {
        const msg = String((error as any)?.message || '').toLowerCase()
        if (msg.includes('permission')) {
          if (!mappingPermissionWarned) {
            mappingPermissionWarned = true
            console.warn('Hardware device mapping read denied. Using default ESP32 device ID.')
          }
        } else {
          console.warn('Failed to resolve hardware device mapping:', error)
        }
      }

      if (!cancelled) {
        setActiveDeviceId(fallbackDeviceId)
      }
    }

    void resolveDeviceId()

    return () => {
      cancelled = true
    }
  }, [userId, requestedDeviceId, fallbackDeviceId])

  // Subscribe to hardware status changes
  useEffect(() => {
    if (!userId || !activeDeviceId) return

    const hardwareRef = ref(realtimeDb, `hardwareStatus/${userId}/${activeDeviceId}`)

    const unsubscribe = onValue(
      hardwareRef,
      (snapshot) => {
        const data = snapshot.val()

        if (!data) {
          setHardwareStatus(null)
          setListenerError('No ESP32 status found. Please connect the device.')
          return
        }

        const status: HardwareStatus = {
          online: data.online ?? false,
          lastHeartbeat: data.lastHeartbeat ?? 0,
          motionDetected: data.motionDetected ?? false,
          lastMotionAt: data.lastMotionAt ?? 0,
          lastSensorUpdate: data.lastSensorUpdate ?? data.lastHeartbeat ?? 0,
          alert: data.alert ?? { led: false, buzzer: false, reason: 'ok', timestamp: Date.now() },
          wifiRSSI: data.wifiRSSI
        }

        setHardwareStatus(status)
        setListenerError(null)
      },
      (error) => {
        const msg = String((error as any)?.message || '').toLowerCase()
        if (msg.includes('permission')) {
          if (!streamPermissionWarned) {
            streamPermissionWarned = true
            console.warn('Hardware monitoring permission denied for this user/device path.')
          }
          setListenerError('Permission denied for ESP32 status. Check Realtime Database rules.')
        } else {
          console.error('Hardware monitoring error:', error)
          setListenerError('Failed to connect to hardware status stream')
        }
      }
    )

    return () => {
      unsubscribe()
      if (motionTimerRef.current) {
        clearTimeout(motionTimerRef.current)
        motionTimerRef.current = null
      }
    }
  }, [userId, activeDeviceId])

  const connectionAgeMs = useMemo(() => {
    if (!hardwareStatus?.lastHeartbeat) return Number.POSITIVE_INFINITY
    return Math.max(0, nowTs - hardwareStatus.lastHeartbeat)
  }, [hardwareStatus?.lastHeartbeat, nowTs])

  const isOnline = useMemo(() => {
    if (!hardwareStatus) return false
    return Boolean(hardwareStatus.online) && connectionAgeMs <= heartbeatTimeoutMs
  }, [hardwareStatus, connectionAgeMs, heartbeatTimeoutMs])

  const isMotionDetected = hardwareStatus?.motionDetected ?? false

  const motionDuration = useMemo(() => {
    if (!hardwareStatus?.motionDetected || !hardwareStatus.lastMotionAt) return 0
    return Math.max(0, nowTs - hardwareStatus.lastMotionAt)
  }, [hardwareStatus?.motionDetected, hardwareStatus?.lastMotionAt, nowTs])

  const isMotionSensorStale = useMemo(() => {
    if (!isOnline || !hardwareStatus) return false
    const sensorBaseTs = hardwareStatus.lastSensorUpdate || hardwareStatus.lastHeartbeat
    if (!sensorBaseTs) return true
    return (nowTs - sensorBaseTs) > sensorTimeoutMs
  }, [isOnline, hardwareStatus, nowTs, sensorTimeoutMs])

  const triggerAlert = useCallback(async (reason: string, options?: TriggerAlertOptions) => {
    if (!activeDeviceId) {
      setListenerError('No hardware device assigned for this user')
      return
    }

    try {
      const alertRef = ref(realtimeDb, `hardwareStatus/${userId}/${activeDeviceId}/alert`)
      await update(alertRef, {
        led: options?.led ?? true,
        buzzer: options?.buzzer ?? true,
        reason,
        timestamp: Date.now()
      })
      console.log(`Hardware alert triggered: ${reason}`)
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase()
      if (msg.includes('permission')) {
        console.warn('Permission denied while triggering ESP32 alert.')
        setListenerError('Permission denied while writing hardware alert')
        return
      }
      console.error('Failed to trigger hardware alert:', error)
      setListenerError('Failed to trigger alert on ESP32')
    }
  }, [userId, activeDeviceId])

  const clearAlert = useCallback(async () => {
    if (!activeDeviceId) {
      setListenerError('No hardware device assigned for this user')
      return
    }

    try {
      const alertRef = ref(realtimeDb, `hardwareStatus/${userId}/${activeDeviceId}/alert`)
      await update(alertRef, {
        led: false,
        buzzer: false,
        reason: 'ok',
        timestamp: Date.now()
      })
      setMotionViolation(false)
      console.log('Hardware alert cleared')
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase()
      if (msg.includes('permission')) {
        console.warn('Permission denied while clearing ESP32 alert.')
        setListenerError('Permission denied while clearing hardware alert')
        return
      }
      console.error('Failed to clear hardware alert:', error)
      setListenerError('Failed to clear ESP32 alert')
    }
  }, [userId, activeDeviceId])

  // Check motion violation with 5-second rule
  useEffect(() => {
    if (!isMotionDetected) {
      setMotionViolation(false)
      if (motionTimerRef.current) {
        clearTimeout(motionTimerRef.current)
        motionTimerRef.current = null
      }
      return
    }

    if (motionTimerRef.current) {
      clearTimeout(motionTimerRef.current)
    }

    motionTimerRef.current = setTimeout(() => {
      setMotionViolation(true)
      void triggerAlert('excessive_movement', { led: true, buzzer: true })
      console.log('Motion violation: Movement detected for too long')
    }, motionThresholdMs)

    return () => {
      if (motionTimerRef.current) {
        clearTimeout(motionTimerRef.current)
        motionTimerRef.current = null
      }
    }
  }, [isMotionDetected, motionThresholdMs, triggerAlert])

  // Refresh hardware status
  const refreshStatus = useCallback(async () => {
    if (!activeDeviceId) {
      setListenerError('No hardware device assigned for this user')
      return
    }

    try {
      const hardwareRef = ref(realtimeDb, `hardwareStatus/${userId}/${activeDeviceId}`)
      await update(hardwareRef, {
        lastHeartbeat: Date.now(),
        online: true,
        lastSensorUpdate: Date.now()
      })
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase()
      if (msg.includes('permission')) {
        console.warn('Permission denied while refreshing hardware status.')
        setListenerError('Permission denied while refreshing hardware status')
        return
      }
      console.error('Failed to refresh hardware status:', error)
    }
  }, [userId, activeDeviceId])

  const hardwareError = useMemo(() => {
    if (listenerError) return listenerError
    if (userId && !activeDeviceId) return 'Resolving assigned ESP32 device...'
    if (hardwareStatus && !isOnline) {
      return `ESP32 offline (last heartbeat ${Math.round(connectionAgeMs / 1000)}s ago)`
    }
    if (isMotionSensorStale) {
      return 'Motion sensor data is stale. Check PIR sensor wiring.'
    }
    return null
  }, [listenerError, userId, activeDeviceId, hardwareStatus, isOnline, connectionAgeMs, isMotionSensorStale])

  return {
    activeDeviceId,
    hardwareStatus,
    isOnline,
    isMotionDetected,
    motionDuration,
    motionViolation,
    isMotionSensorStale,
    connectionAgeMs,
    hardwareError,
    triggerAlert,
    clearAlert,
    refreshStatus
  }
}
