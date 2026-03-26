"use client"

import { ref, set, get, onValue, update, onDisconnect } from 'firebase/database'
import { realtimeDb } from '@/lib/firebase'

// Types
export interface HardwareStatus {
  online: boolean
  lastHeartbeat: number
  motionDetected: boolean
  lastMotionAt: number
  deviceId: string
}

export interface HardwareAlert {
  led: boolean
  buzzer: boolean
  reason: string
  timestamp: number
}

export interface HardwareConfig {
  userId: string
  deviceId: string
  motionThreshold: number // 5 seconds in ms
  heartbeatInterval: number // 2 seconds in ms
}

// Constants
const MOTION_THRESHOLD_MS = 5000 // 5 seconds for motion violation
const HEARTBEAT_INTERVAL_MS = 2000 // 2 seconds for heartbeat
const OFFLINE_THRESHOLD_MS = 7000 // 7 seconds without heartbeat = offline

// Hardware monitoring state
let hardwareStatus: HardwareStatus | null = null
let hardwareListeners: ((status: HardwareStatus) => void)[] = []
let motionViolationTimer: NodeJS.Timeout | null = null
let heartbeatInterval: NodeJS.Timeout | null = null

// Initialize hardware monitoring service
export const initHardwareMonitoring = async (config: HardwareConfig) => {
  const hardwareRef = ref(realtimeDb, `hardwareStatus/${config.userId}/${config.deviceId}`)

  // Listen for hardware status changes
  const unsubscribe = onValue(
    hardwareRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data) {
        hardwareStatus = {
          online: data.online || false,
          lastHeartbeat: data.lastHeartbeat || Date.now(),
          motionDetected: data.motionDetected || false,
          lastMotionAt: data.lastMotionAt || Date.now(),
          deviceId: config.deviceId
        }

        // Notify all listeners
        hardwareListeners.forEach(listener => listener(hardwareStatus))
      }
    },
    (error: any) => {
      const msg = String(error?.message || "").toLowerCase()
      if (msg.includes("permission")) {
        console.warn("Hardware monitoring listener permission denied.")
        return
      }
      console.error("Hardware monitoring listener error:", error)
    }
  )

  // Setup heartbeat timeout check
  heartbeatInterval = setInterval(() => {
    if (hardwareStatus) {
      const timeSinceHeartbeat = Date.now() - hardwareStatus.lastHeartbeat
      if (timeSinceHeartbeat > OFFLINE_THRESHOLD_MS) {
        hardwareStatus.online = false
        hardwareListeners.forEach(listener => listener(hardwareStatus))
      }
    }
  }, 1000)

  return () => {
    unsubscribe()
    if (heartbeatInterval) clearInterval(heartbeatInterval)
  }
}

// Send heartbeat from website (for simulation/testing)
export const sendHardwareHeartbeat = async (userId: string, deviceId: string) => {
  try {
    const hardwareRef = ref(realtimeDb, `hardwareStatus/${userId}/${deviceId}`)
    await update(hardwareRef, {
      online: true,
      lastHeartbeat: Date.now()
    })
  } catch (error: any) {
    const msg = String(error?.message || '').toLowerCase()
    if (msg.includes('permission')) {
      console.warn('Permission denied while sending hardware heartbeat.')
      return
    }
    console.error('Failed to send hardware heartbeat:', error)
  }
}

// Trigger hardware alert (website -> ESP32)
export const triggerHardwareAlert = async (userId: string, deviceId: string, reason: string) => {
  try {
    const alertRef = ref(realtimeDb, `hardwareStatus/${userId}/${deviceId}/alert`)
    await set(alertRef, {
      led: true,
      buzzer: true,
      reason: reason,
      timestamp: Date.now()
    })
    console.log(`🚨 Hardware alert triggered: ${reason}`)
  } catch (error: any) {
    const msg = String(error?.message || '').toLowerCase()
    if (msg.includes('permission')) {
      console.warn('Permission denied while triggering hardware alert.')
      return
    }
    console.error('Failed to trigger hardware alert:', error)
  }
}

// Clear hardware alert
export const clearHardwareAlert = async (userId: string, deviceId: string) => {
  try {
    const alertRef = ref(realtimeDb, `hardwareStatus/${userId}/${deviceId}/alert`)
    await set(alertRef, {
      led: false,
      buzzer: false,
      reason: 'ok',
      timestamp: Date.now()
    })
    console.log('✅ Hardware alert cleared')
  } catch (error: any) {
    const msg = String(error?.message || '').toLowerCase()
    if (msg.includes('permission')) {
      console.warn('Permission denied while clearing hardware alert.')
      return
    }
    console.error('Failed to clear hardware alert:', error)
  }
}

// Check motion violation with 5-second rule
export const checkMotionViolation = async (
  userId: string,
  deviceId: string,
  motionDetected: boolean,
  lastMotionAt: number
): Promise<boolean> => {
  if (!motionDetected) return false

  const motionDuration = Date.now() - lastMotionAt
  if (motionDuration >= MOTION_THRESHOLD_MS) {
    // Motion violation detected
    await triggerHardwareAlert(userId, deviceId, 'excessive_movement')
    return true
  }
  return false
}

// Update motion status from ESP32
export const updateMotionStatus = async (
  userId: string,
  deviceId: string,
  motionDetected: boolean
) => {
  try {
    const motionRef = ref(realtimeDb, `hardwareStatus/${userId}/${deviceId}`)
    await update(motionRef, {
      motionDetected: motionDetected,
      lastMotionAt: motionDetected ? Date.now() : hardwareStatus?.lastMotionAt || Date.now()
    })
  } catch (error: any) {
    const msg = String(error?.message || '').toLowerCase()
    if (msg.includes('permission')) {
      console.warn('Permission denied while updating motion status.')
      return
    }
    console.error('Failed to update motion status:', error)
  }
}

// Subscribe to hardware status changes
export const subscribeToHardwareStatus = (
  userId: string,
  deviceId: string,
  callback: (status: HardwareStatus) => void
) => {
  hardwareListeners.push(callback)

  // Return unsubscribe function
  return () => {
    hardwareListeners = hardwareListeners.filter(listener => listener !== callback)
  }
}

// Get current hardware status
export const getHardwareStatus = (): HardwareStatus | null => {
  return hardwareStatus
}

// Check if hardware is online
export const isHardwareOnline = (): boolean => {
  return hardwareStatus?.online ?? false
}

// Check if motion is detected
export const isMotionDetected = (): boolean => {
  return hardwareStatus?.motionDetected ?? false
}

// Setup motion monitoring with 5-second rule
export const setupMotionMonitoring = (
  userId: string,
  deviceId: string,
  onViolation: () => void
) => {
  let motionStartTime: number | null = null

  const checkMotion = () => {
    if (hardwareStatus?.motionDetected) {
      if (motionStartTime === null) {
        motionStartTime = Date.now()
      }

      const motionDuration = Date.now() - motionStartTime
      if (motionDuration >= MOTION_THRESHOLD_MS) {
        onViolation()
        triggerHardwareAlert(userId, deviceId, 'excessive_movement')
        motionStartTime = null
      }
    } else {
      motionStartTime = null
    }
  }

  const motionCheckInterval = setInterval(checkMotion, 1000)

  return () => {
    clearInterval(motionCheckInterval)
    motionStartTime = null
  }
}

// Create hardware status report
export const createHardwareReport = (userId: string): HardwareReport => {
  return {
    userId,
    timestamp: Date.now(),
    hardwareOnline: hardwareStatus?.online ?? false,
    motionDetected: hardwareStatus?.motionDetected ?? false,
    lastMotionAt: hardwareStatus?.lastMotionAt ?? 0,
    motionDuration: hardwareStatus?.motionDetected
      ? Date.now() - (hardwareStatus.lastMotionAt || Date.now())
      : 0
  }
}

export interface HardwareReport {
  userId: string
  timestamp: number
  hardwareOnline: boolean
  motionDetected: boolean
  lastMotionAt: number
  motionDuration: number
}
