"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface MonitoringState {
  isActive: boolean
  cameraEnabled: boolean
  faceDetected: boolean
  tabActive: boolean
  violations: {
    tabSwitch: number
    faceMissing: number
    autoPause: number
  }
}

interface MonitoringRules {
  maxTabSwitch: number
  maxFaceMissing: number
  maxAutoPause: number
  minCompletionPercentage: number
}

const DEFAULT_RULES: MonitoringRules = {
  maxTabSwitch: 10,
  maxFaceMissing: 10,
  maxAutoPause: 10,
  minCompletionPercentage: 90
}

export function useVideoMonitoring(rules: Partial<MonitoringRules> = {}) {
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    isActive: false,
    cameraEnabled: false,
    faceDetected: false,
    tabActive: true,
    violations: {
      tabSwitch: 0,
      faceMissing: 0,
      autoPause: 0
    }
  })

  const [isMonitoringValid, setIsMonitoringValid] = useState(false)
  const monitoringRules = { ...DEFAULT_RULES, ...rules }
  
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const faceDetectionRef = useRef<any>(null)
  const lastViolationTime = useRef<{ [key: string]: number }>({})

  // Check if monitoring is currently valid
  const checkMonitoringValidity = useCallback(() => {
    const isValid = 
      monitoringState.cameraEnabled &&
      monitoringState.isActive &&
      monitoringState.faceDetected &&
      monitoringState.tabActive

    setIsMonitoringValid(isValid)
    return isValid
  }, [monitoringState])

  // Start camera and monitoring
  const startMonitoring = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      streamRef.current = stream
      
      // Update state
      setMonitoringState(prev => ({
        ...prev,
        cameraEnabled: true,
        isActive: true
      }))

      // Start face detection
      startFaceDetection(stream)
      
      return true
    } catch (error) {
      console.error("Camera access denied:", error)
      setMonitoringState(prev => ({
        ...prev,
        cameraEnabled: false,
        isActive: false
      }))
      return false
    }
  }, [])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (faceDetectionRef.current) {
      faceDetectionRef.current = null
    }
    
    setMonitoringState(prev => ({
      ...prev,
      isActive: false,
      cameraEnabled: false,
      faceDetected: false
    }))
    
    setIsMonitoringValid(false)
  }, [])

  // Face detection using FaceAPI.js
  const startFaceDetection = async (stream: MediaStream) => {
    try {
      // Import face-api.js dynamically
      const faceapi = await import('face-api.js')
      
      // Load models
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
      
      // Create video element for detection
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      videoRef.current = video
      
      // Detect face continuously
      const detectFace = async () => {
        if (!video || !streamRef.current) return
        
        try {
          const detection = await faceapi.detectSingleFace(
            video, 
            new faceapi.TinyFaceDetectorOptions()
          )
          
          const faceDetected = !!detection
          
          setMonitoringState(prev => {
            const newState = { ...prev, faceDetected }
            
            // Track face missing violations
            if (!faceDetected && prev.isActive) {
              const now = Date.now()
              const lastTime = lastViolationTime.current['faceMissing'] || 0
              
              // Count as violation only if face missing for more than 2 seconds
              if (now - lastTime > 2000) {
                newState.violations = {
                  ...prev.violations,
                  faceMissing: prev.violations.faceMissing + 1
                }
                lastViolationTime.current['faceMissing'] = now
              }
            }
            
            return newState
          })
        } catch (error) {
          console.error('Face detection error:', error)
          setMonitoringState(prev => ({ ...prev, faceDetected: false }))
        }
        
        // Continue detection
        if (streamRef.current) {
          setTimeout(detectFace, 1000) // Check every second
        }
      }
      
      detectFace()
      
    } catch (error) {
      console.error('Failed to start face detection:', error)
    }
  }

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isTabActive = !document.hidden
      
      setMonitoringState(prev => {
        const newState = { ...prev, tabActive: isTabActive }
        
        // Track tab switch violations
        if (!isTabActive && prev.isActive) {
          const now = Date.now()
          const lastTime = lastViolationTime.current['tabSwitch'] || 0
          
          // Count as violation only if tab switched for more than 1 second
          if (now - lastTime > 1000) {
            newState.violations = {
              ...prev.violations,
              tabSwitch: prev.violations.tabSwitch + 1
            }
            lastViolationTime.current['tabSwitch'] = now
          }
        }
        
        return newState
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Check monitoring validity on state changes
  useEffect(() => {
    checkMonitoringValidity()
  }, [monitoringState, checkMonitoringValidity])

  // Auto-pause violation tracking
  const trackAutoPause = useCallback(() => {
    const now = Date.now()
    const lastTime = lastViolationTime.current['autoPause'] || 0
    
    // Count as violation only if auto-paused more than once per minute
    if (now - lastTime > 60000) {
      setMonitoringState(prev => ({
        ...prev,
        violations: {
          ...prev.violations,
          autoPause: prev.violations.autoPause + 1
        }
      }))
      lastViolationTime.current['autoPause'] = now
    }
  }, [])

  // Check if video can be completed with current violations
  const canCompleteVideo = useCallback(() => {
    const { violations } = monitoringState
    return (
      violations.tabSwitch <= monitoringRules.maxTabSwitch &&
      violations.faceMissing <= monitoringRules.maxFaceMissing &&
      violations.autoPause <= monitoringRules.maxAutoPause
    )
  }, [monitoringState, monitoringRules])

  // Get violation summary
  const getViolationSummary = useCallback(() => {
    const { violations } = monitoringState
    return {
      ...violations,
      withinLimits: canCompleteVideo(),
      maxAllowed: monitoringRules
    }
  }, [monitoringState, monitoringRules, canCompleteVideo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  return {
    monitoringState,
    isMonitoringValid,
    startMonitoring,
    stopMonitoring,
    trackAutoPause,
    canCompleteVideo,
    getViolationSummary,
    monitoringRules
  }
}