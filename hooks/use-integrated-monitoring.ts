"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRealtimeMonitoring, MonitoringEvent } from './use-realtime-monitoring'
import { useHardwareMonitoring, HardwareStatus } from './use-hardware-monitoring'
import { useAuth } from '@/contexts/auth-context'

export interface IntegratedMonitoringState {
  // Hardware monitoring
  hardwareOnline: boolean
  hardwareMotionDetected: boolean
  hardwareMotionDuration: number
  hardwareMotionViolation: boolean
  
  // AI monitoring
  faceDetected: boolean
  postureStatus: 'Good' | 'Leaning Forward' | 'Poor' | 'Unknown'
  attentionStatus: 'Focused' | 'Distracted' | 'Absent'
  
  // Combined status
  isMonitoring: boolean
  isVideoPlaying: boolean
  canContinue: boolean
  
  // Events
  events: MonitoringEvent[]
}

export interface IntegratedMonitoringResult {
  state: IntegratedMonitoringState
  validWatchTime: number
  startMonitoring: (courseId: string, videoId: string) => Promise<void>
  stopMonitoring: () => void
  pauseVideo: () => void
  resumeVideo: () => void
  triggerHardwareAlert: (reason: string) => Promise<void>
  clearHardwareAlert: () => Promise<void>
  setVideoElementRef: (element: HTMLIFrameElement | null) => void
}

export function useIntegratedMonitoring(): IntegratedMonitoringResult {
  const { user } = useAuth()
  const userId = user?.uid || ''
  
  // AI Monitoring
  const aiMonitoring = useRealtimeMonitoring(userId)
  
  // Hardware Monitoring (ESP32)
  const hardwareMonitoring = useHardwareMonitoring({
    userId,    motionThresholdMs: 5000, // 5-second rule
    heartbeatTimeoutMs: 7000
  })

  // Combined state
  const [canContinue, setCanContinue] = useState(true)
  const [pauseReason, setPauseReason] = useState<string | null>(null)

  // Calculate combined status based on all monitoring inputs
  useEffect(() => {
    const hardwareOK = hardwareMonitoring.isOnline && 
                      !hardwareMonitoring.motionViolation
    
    const aiOK = aiMonitoring.state.faceDetected && 
                 aiMonitoring.state.attentionStatus !== 'Absent'
    
    const combinedOK = hardwareOK && aiOK
    
    setCanContinue(combinedOK)
    
    // Determine pause reason if monitoring is blocked
    if (!combinedOK) {
      if (!hardwareMonitoring.isOnline) {
        setPauseReason('hardware_offline')
      } else if (hardwareMonitoring.motionViolation) {
        setPauseReason('excessive_movement')
      } else if (!aiMonitoring.state.faceDetected) {
        setPauseReason('face_missing')
      } else {
        setPauseReason('attention_lost')
      }
    } else {
      setPauseReason(null)
    }
  }, [
    hardwareMonitoring.isOnline,
    hardwareMonitoring.motionViolation,
    aiMonitoring.state.faceDetected,
    aiMonitoring.state.attentionStatus
  ])

  // Auto-pause video when monitoring conditions are violated
  useEffect(() => {
    if (!canContinue && aiMonitoring.state.isVideoPlaying) {
      console.log('🚫 Auto-pausing video due to monitoring violation:', pauseReason)
      aiMonitoring.pauseVideo()
    }
  }, [canContinue, aiMonitoring.state.isVideoPlaying, pauseReason])

  // Create integrated monitoring functions
  const startMonitoring = useCallback(async (courseId: string, videoId: string) => {
    console.log('🚀 Starting integrated monitoring (AI + Hardware)...')
    
    // Start AI monitoring
    await aiMonitoring.startMonitoring(courseId, videoId)
    
    // Hardware monitoring starts automatically via hook
    console.log('✅ Integrated monitoring started')
  }, [aiMonitoring])

  const stopMonitoring = useCallback(() => {
    console.log('⏹️ Stopping integrated monitoring')
    aiMonitoring.stopMonitoring()
  }, [aiMonitoring])

  const pauseVideo = useCallback(() => {
    aiMonitoring.pauseVideo()
  }, [aiMonitoring])

  const resumeVideo = useCallback(() => {
    if (canContinue) {
      aiMonitoring.resumeVideo()
    }
  }, [canContinue, aiMonitoring])

  const setVideoElementRef = useCallback((element: HTMLIFrameElement | null) => {
    aiMonitoring.setVideoElementRef(element)
  }, [aiMonitoring])

  const triggerHardwareAlert = useCallback(async (reason: string) => {
    await hardwareMonitoring.triggerAlert(reason)
  }, [hardwareMonitoring])

  const clearHardwareAlert = useCallback(async () => {
    await hardwareMonitoring.clearAlert()
  }, [hardwareMonitoring])

  return {
    state: {
      // Hardware monitoring
      hardwareOnline: hardwareMonitoring.isOnline,
      hardwareMotionDetected: hardwareMonitoring.isMotionDetected,
      hardwareMotionDuration: hardwareMonitoring.motionDuration,
      hardwareMotionViolation: hardwareMonitoring.motionViolation,
      
      // AI monitoring
      faceDetected: aiMonitoring.state.faceDetected,
      postureStatus: aiMonitoring.state.postureStatus,
      attentionStatus: aiMonitoring.state.attentionStatus,
      
      // Combined status
      isMonitoring: aiMonitoring.state.isMonitoring,
      isVideoPlaying: aiMonitoring.state.isVideoPlaying,
      canContinue,
      
      // Events
      events: aiMonitoring.events
    },
    validWatchTime: aiMonitoring.validWatchTime,
    startMonitoring,
    stopMonitoring,
    pauseVideo,
    resumeVideo,
    triggerHardwareAlert,
    clearHardwareAlert,
    setVideoElementRef
  }
}

