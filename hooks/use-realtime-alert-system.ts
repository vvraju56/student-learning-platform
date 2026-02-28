"use client"

import { useState, useEffect, useCallback } from "react"
import { realtimeDb } from "../lib/firebase"
import { ref, onValue, remove, update, set } from "firebase/database"

export interface AlertData {
  id: string
  type: 'posture' | 'attention' | 'face' | 'focus' | 'tab_switch' | 'auto_pause' | 'skip' | 'completion' | 'invalid'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  courseId?: string
  videoId?: string
  metadata?: {
    [key: string]: any
  }
}

export interface AlertMetrics {
  totalAlerts: number
  alertsByType: Record<string, number>
  alertsBySeverity: Record<string, number>
  recentAlerts: AlertData[]
}

interface RealtimeAlertSystemHook {
  alerts: AlertData[]
  metrics: AlertMetrics
  isConnected: boolean
  addAlert: (alert: Omit<AlertData, 'id' | 'timestamp'>) => Promise<void>
  clearAlerts: () => Promise<void>
  markAlertResolved: (alertId: string) => Promise<void>
  getAlertsByType: (type: AlertData['type']) => AlertData[]
  getAlertsBySeverity: (severity: AlertData['severity']) => AlertData[]
  exportAlerts: () => string
  addPostureAlert: (postureType: string, courseId?: string, videoId?: string) => Promise<void>
  addAttentionAlert: (attentionType: string, courseId?: string, videoId?: string) => Promise<void>
  addFaceAlert: (detected: boolean, courseId?: string, videoId?: string) => Promise<void>
  addTabSwitchAlert: (courseId?: string, videoId?: string) => Promise<void>
  addAutoPauseAlert: (reason: string, courseId?: string, videoId?: string) => Promise<void>
  addSkipAlert: (skipAmount: number, courseId?: string, videoId?: string) => Promise<void>
  addVideoCompletionAlert: (isValid: boolean, courseId?: string, videoId?: string, reasons?: string[]) => Promise<void>
}

export function useRealtimeAlertSystem(userId: string): RealtimeAlertSystemHook {
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [metrics, setMetrics] = useState<AlertMetrics>({
    totalAlerts: 0,
    alertsByType: {},
    alertsBySeverity: {},
    recentAlerts: []
  })

  // Generate unique alert ID
  const generateAlertId = () => {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Calculate metrics from alerts
  const calculateMetrics = useCallback((alertList: AlertData[]) => {
    const alertsByType: Record<string, number> = {}
    const alertsBySeverity: Record<string, number> = {}

    alertList.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1
    })

    const recentAlerts = alertList
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10) // Last 10 alerts

    return {
      totalAlerts: alertList.length,
      alertsByType,
      alertsBySeverity,
      recentAlerts
    }
  }, [])

  // Listen for real-time alerts from Firebase
  useEffect(() => {
    if (!userId || !realtimeDb) {
      console.warn('Firebase not available for real-time alerts')
      return
    }

    try {
      const alertsRef = ref(realtimeDb, `users/${userId}/alerts`)
      
      const unsubscribe = onValue(alertsRef, (snapshot: any) => {
        const data = snapshot.val()
        if (data) {
          const alertsArray = Object.entries(data).map(([id, alertData]) => ({
            id,
            ...(alertData as Omit<AlertData, 'id'>)
          }))
          
          setAlerts(alertsArray)
          setMetrics(calculateMetrics(alertsArray))
        } else {
          setAlerts([])
          setMetrics({
            totalAlerts: 0,
            alertsByType: {},
            alertsBySeverity: {},
            recentAlerts: []
          })
        }
        setIsConnected(true)
      })

      return () => {
        unsubscribe()
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Error setting up real-time alerts:', error)
      setIsConnected(false)
    }
  }, [userId, calculateMetrics])

  // ✅ THROTTLED ALERT SYSTEM (30-second batch saves)
  let lastAlertSave = 0
  const alertSaveInterval = 30000 // 30 seconds

  // Add new alert
  const addAlert = useCallback(async (alert: Omit<AlertData, 'id' | 'timestamp'>) => {
    const newAlert: AlertData = {
      ...alert,
      id: generateAlertId(),
      timestamp: Date.now()
    }

    // Always update local state immediately
    const updatedAlerts = [...alerts, newAlert]
    setAlerts(updatedAlerts)
    setMetrics(calculateMetrics(updatedAlerts))
    
    console.log(`🚨 Alert added (local): ${alert.message}`)

    try {
      // ✅ THROTTLED: Save to Firebase only every 30 seconds
      const now = Date.now()
      if (realtimeDb && userId && now - lastAlertSave >= alertSaveInterval) {
        // Batch save recent alerts (last 10 to avoid huge payloads)
        const recentAlerts = updatedAlerts.slice(-10)
        
        await set(ref(realtimeDb, `users/${userId}/recentAlerts`), recentAlerts)
        console.log('💾 Batch alerts saved to Firebase (30-sec throttle)')
        lastAlertSave = now
      }
      
      // Also save to localStorage as backup
      localStorage.setItem(`alerts_${userId}`, JSON.stringify(updatedAlerts))
      
    } catch (error) {
      console.error('Error adding alert:', error)
    }
  }, [userId, alerts, calculateMetrics])

  // Clear all alerts
  const clearAlerts = useCallback(async () => {
    try {
      if (realtimeDb && userId) {
        await remove(ref(realtimeDb, `users/${userId}/alerts`))
        console.log('🧹 All alerts cleared from Firebase')
      } else {
        localStorage.removeItem(`alerts_${userId}`)
        setAlerts([])
        setMetrics({
          totalAlerts: 0,
          alertsByType: {},
          alertsBySeverity: {},
          recentAlerts: []
        })
        console.log('🧹 All alerts cleared from local storage')
      }
    } catch (error) {
      console.error('Error clearing alerts:', error)
    }
  }, [userId])

  // Mark alert as resolved
  const markAlertResolved = useCallback(async (alertId: string) => {
    try {
      if (realtimeDb && userId) {
        await update(ref(realtimeDb, `users/${userId}/alerts/${alertId}`), {
          resolved: true,
          resolvedAt: Date.now()
        })
      }
      
      // Update local state
      const updatedAlerts = alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolvedAt: Date.now() }
          : alert
      )
      setAlerts(updatedAlerts)
      console.log(`✅ Alert marked as resolved: ${alertId}`)
    } catch (error) {
      console.error('Error marking alert as resolved:', error)
    }
  }, [userId, alerts])

  // Get alerts by type
  const getAlertsByType = useCallback((type: AlertData['type']) => {
    return alerts.filter(alert => alert.type === type)
  }, [alerts])

  // Get alerts by severity
  const getAlertsBySeverity = useCallback((severity: AlertData['severity']) => {
    return alerts.filter(alert => alert.severity === severity)
  }, [alerts])

  // Export alerts as JSON
  const exportAlerts = useCallback(() => {
    const exportData = {
      userId,
      exportDate: new Date().toISOString(),
      metrics,
      alerts: alerts.sort((a, b) => b.timestamp - a.timestamp)
    }
    
    return JSON.stringify(exportData, null, 2)
  }, [userId, metrics, alerts])

  // Create specific alert helper functions
  const alertHelpers = {
    addPostureAlert: (postureType: string, courseId?: string, videoId?: string) => 
      addAlert({
        type: 'posture',
        severity: postureType === 'Poor' ? 'high' : 'medium',
        message: `Posture issue detected: ${postureType}`,
        courseId,
        videoId,
        metadata: { postureType }
      }),

    addAttentionAlert: (attentionType: string, courseId?: string, videoId?: string) =>
      addAlert({
        type: 'attention',
        severity: attentionType === 'Absent' ? 'critical' : 'medium',
        message: `Attention issue detected: ${attentionType}`,
        courseId,
        videoId,
        metadata: { attentionType }
      }),

    addFaceAlert: (detected: boolean, courseId?: string, videoId?: string) =>
      addAlert({
        type: 'face',
        severity: detected ? 'low' : 'high',
        message: detected ? 'Face detected' : 'Face not detected',
        courseId,
        videoId,
        metadata: { faceDetected: detected }
      }),

    addTabSwitchAlert: (courseId?: string, videoId?: string) =>
      addAlert({
        type: 'tab_switch',
        severity: 'medium',
        message: 'User switched tabs during video playback',
        courseId,
        videoId,
        metadata: { action: 'tab_switch' }
      }),

    addAutoPauseAlert: (reason: string, courseId?: string, videoId?: string) =>
      addAlert({
        type: 'auto_pause',
        severity: 'medium',
        message: `Video auto-paused: ${reason}`,
        courseId,
        videoId,
        metadata: { reason }
      }),

    addSkipAlert: (skipAmount: number, courseId?: string, videoId?: string) =>
      addAlert({
        type: 'skip',
        severity: 'low',
        message: `User skipped ${skipAmount} seconds`,
        courseId,
        videoId,
        metadata: { skipAmount }
      }),

    addVideoCompletionAlert: (isValid: boolean, courseId?: string, videoId?: string, reasons?: string[]) =>
      addAlert({
        type: isValid ? 'completion' : 'invalid',
        severity: isValid ? 'low' : 'high',
        message: isValid ? 'Video completed successfully' : `Video completion invalid: ${reasons?.join(', ')}`,
        courseId,
        videoId,
        metadata: { isValid, reasons }
      })
  }

  const {
    addPostureAlert,
    addAttentionAlert,
    addFaceAlert,
    addTabSwitchAlert,
    addAutoPauseAlert,
    addSkipAlert,
    addVideoCompletionAlert
  } = alertHelpers

  return {
    alerts,
    metrics,
    isConnected,
    addAlert,
    clearAlerts,
    markAlertResolved,
    getAlertsByType,
    getAlertsBySeverity,
    exportAlerts,
    addPostureAlert,
    addAttentionAlert,
    addFaceAlert,
    addTabSwitchAlert,
    addAutoPauseAlert,
    addSkipAlert,
    addVideoCompletionAlert
  }
}