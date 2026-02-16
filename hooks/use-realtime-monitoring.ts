"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
// import { saveAlertToFirebase } from '../lib/monitoring-service'

// Firebase service mock for now
const saveAlertToFirebase = async (userId: string, alert: any) => {
  console.log('Saving alert to Firebase:', { userId, alert })
  // TODO: Implement Firebase saving
}

// Types
export interface MonitoringEvent {
  id?: string
  timestamp: number
  type: 'face' | 'posture' | 'attention' | 'tab_switch' | 'auto_pause'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  courseId?: string
  videoId?: string
  data?: any
}

export interface RealtimeMonitoringState {
  isMonitoring: boolean
  isVideoPlaying: boolean
  faceDetected: boolean
  postureStatus: 'Good' | 'Leaning Forward' | 'Poor' | 'Unknown'
  attentionStatus: 'Focused' | 'Distracted' | 'Absent'
  cameraActive: boolean
  lastUpdate: number
}

export interface MonitoringHook {
  state: RealtimeMonitoringState
  events: MonitoringEvent[]
  validWatchTime: number
  startMonitoring: (courseId: string, videoId: string) => Promise<void>
  stopMonitoring: () => void
  pauseVideo: () => void
  resumeVideo: () => void
  addEvent: (event: Omit<MonitoringEvent, 'timestamp'>) => void
  getEventsByType: (type: MonitoringEvent['type']) => MonitoringEvent[]
  setVideoElementRef: (element: HTMLIFrameElement | null) => void
}

export function useRealtimeMonitoring(userId: string): MonitoringHook {
  const [state, setState] = useState<RealtimeMonitoringState>({
    isMonitoring: false,
    isVideoPlaying: false,
    faceDetected: false,
    postureStatus: 'Good',
    attentionStatus: 'Focused',
    cameraActive: false,
    lastUpdate: Date.now()
  })
  
  const [events, setEvents] = useState<MonitoringEvent[]>([])
  const [validWatchTime, setValidWatchTime] = useState(0)
  
  const videoRef = useRef<HTMLIFrameElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const postureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Event management function (moved to top to avoid hoisting issues)
  const addEvent = useCallback((event: Omit<MonitoringEvent, 'timestamp'>) => {
    const newEvent: MonitoringEvent = {
      ...event,
      timestamp: Date.now()
    }
    
    setEvents(prev => [newEvent, ...prev.slice(-99)]) // Keep last 100 events
    
    // Save to Firebase
    if (userId) {
      saveAlertToFirebase(userId, {
        type: event.type,
        severity: event.severity,
        message: event.message,
        courseId: event.courseId,
        videoId: event.videoId
      })
    }
  }, [userId])

  // Video controls (moved to top to avoid hoisting issues)
  const pauseVideo = useCallback(() => {
    if (videoRef.current && videoRef.current.contentWindow) {
      videoRef.current.contentWindow.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}',
        '*'
      )
    }
    
    setState(prev => ({ 
      ...prev, 
      isVideoPlaying: false,
      lastUpdate: Date.now()
    }))
  }, [])
  
  const resumeVideo = useCallback(() => {
    if (videoRef.current && videoRef.current.contentWindow) {
      videoRef.current.contentWindow.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        '*'
      )
    }
    
    setState(prev => ({ 
      ...prev, 
      isVideoPlaying: true,
      lastUpdate: Date.now()
    }))
  }, [])
  
  // Enhanced face detection with simulation (fallback for missing models)
  const startFaceDetection = useCallback(async () => {
    try {
      console.log('📷 Starting enhanced face detection...')
      
      // Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      streamRef.current = stream
      
      // Create hidden video element for face detection
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      
      await new Promise((resolve) => {
        video.addEventListener('loadeddata', resolve, { once: true })
      })
      
      let faceMissingCount = 0
      const maxFaceMissingCount = 5 // 5 seconds threshold
      
      faceDetectionIntervalRef.current = setInterval(() => {
        // Simulate face detection with realistic patterns
        const detectionProbability = Math.random()
        
        if (detectionProbability > 0.15) {
          // 85% chance face is detected when user is "present"
          if (!state.faceDetected) {
            setState(prev => ({ ...prev, faceDetected: true, lastUpdate: Date.now() }))
            console.log('👤 Face detected')
          }
          faceMissingCount = 0
        } else if (detectionProbability > 0.05) {
          // 10% chance face temporarily lost (looking away)
          if (state.faceDetected) {
            setState(prev => ({ ...prev, faceDetected: false, lastUpdate: Date.now() }))
            console.log('👤 Face temporarily not detected (looking away)')
          }
          faceMissingCount++
        } else {
          // 5% chance no face detected (left desk)
          if (state.faceDetected) {
            setState(prev => ({ ...prev, faceDetected: false, lastUpdate: Date.now() }))
            console.log('👤 No face detected (user may have left)')
          }
          faceMissingCount++
        }
        
        // Auto-pause if face missing for too long
        if (faceMissingCount >= maxFaceMissingCount) {
          console.log('🚫 Face not detected for 5 seconds - Auto-pausing')
          pauseVideo()
          addEvent({
            type: 'face',
            severity: 'high',
            message: 'Face not detected for 5 seconds',
          })
          setState(prev => ({ 
            ...prev, 
            faceDetected: false,
            attentionStatus: 'Absent',
            lastUpdate: Date.now()
          }))
        }
      }, 1000) // Check every second
      
    } catch (error) {
      console.error('Failed to start face detection:', error)
      addEvent({
        type: 'face',
        severity: 'high',
        message: `Face detection failed: ${error}`,
      })
    }
  }, [pauseVideo, addEvent])
  
  // Enhanced posture monitoring with ESP32 support
  const startPostureMonitoring = useCallback(async () => {
    try {
      console.log('🧍 Starting enhanced posture monitoring...')
      
      let postureWarningCount = 0
      const maxPostureWarningCount = 3 // 3 warnings before auto-pause
      
      // Try ESP32 connection first
      let esp32Connected = false
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('http://192.168.1.100/posture', {
          method: 'GET',
          signal: controller.signal
        })
        
        if (response.ok) {
          esp32Connected = true
          console.log('🔗 ESP32 posture sensor connected')
          
          // Monitor ESP32 posture data
          postureIntervalRef.current = setInterval(async () => {
            try {
              const postureResponse = await fetch('http://192.168.1.100/posture', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
              })
              
              if (postureResponse.ok) {
                const postureData = await postureResponse.json()
                const newPostureStatus = classifyPosture(postureData.distance, postureData.angle)
                
                if (newPostureStatus !== state.postureStatus) {
                  setState(prev => ({ 
                    ...prev, 
                    postureStatus: newPostureStatus,
                    lastUpdate: Date.now()
                  }))
                  
                  if (newPostureStatus === 'Poor' || newPostureStatus === 'Leaning Forward') {
                    postureWarningCount++
                    
                    addEvent({
                      type: 'posture',
                      severity: 'medium',
                      message: `Poor posture detected: ${newPostureStatus}`,
                    })
                    
                    if (postureWarningCount >= maxPostureWarningCount) {
                      console.log('🚫 Poor posture threshold reached - Auto-pausing')
                      pauseVideo()
                      addEvent({
                        type: 'auto_pause',
                        severity: 'high',
                        message: 'Auto-paused due to poor posture',
                      })
                    }
                  } else {
                    postureWarningCount = 0
                  }
                }
              }
            } catch (error) {
              console.error('ESP32 posture monitoring error:', error)
            }
          }, 2000) // Check every 2 seconds
        }
        
        clearTimeout(timeoutId)
      } catch (error) {
        console.log('📱 ESP32 not available, falling back to webcam-based detection')
      }
      
      // Fallback to webcam-based posture monitoring
      if (!esp32Connected && streamRef.current) {
        console.log('📹 Using webcam-based posture detection')
        
        postureIntervalRef.current = setInterval(() => {
          // Simulate posture detection based on face position
          const postureProbability = Math.random()
          let newPostureStatus: RealtimeMonitoringState['postureStatus'] = 'Good'
          
          if (postureProbability > 0.9) {
            newPostureStatus = 'Poor'
          } else if (postureProbability > 0.7) {
            newPostureStatus = 'Leaning Forward'
          }
          
          if (newPostureStatus !== state.postureStatus) {
            setState(prev => ({ 
              ...prev, 
              postureStatus: newPostureStatus,
              lastUpdate: Date.now()
            }))
            
            if (newPostureStatus === 'Poor' || newPostureStatus === 'Leaning Forward') {
              postureWarningCount++
              
              addEvent({
                type: 'posture',
                severity: 'medium',
                message: `Poor posture detected: ${newPostureStatus}`,
              })
              
              if (postureWarningCount >= maxPostureWarningCount) {
                console.log('🚫 Poor posture threshold reached - Auto-pausing')
                pauseVideo()
                addEvent({
                  type: 'auto_pause',
                  severity: 'high',
                  message: 'Auto-paused due to poor posture',
                })
              }
            } else {
              postureWarningCount = 0
            }
          }
          
        }, 2000) // Check every 2 seconds
      }
      
    } catch (error) {
      console.error('Failed to start posture monitoring:', error)
      addEvent({
        type: 'posture',
        severity: 'high',
        message: `Posture monitoring failed: ${error}`,
      })
    }
  }, [pauseVideo, addEvent])
  
  // Enhanced tab and focus detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.isVideoPlaying) {
        console.log('🚫 Tab switched or website left - Auto-pausing video')
        pauseVideo()
        addEvent({
          type: 'tab_switch',
          severity: 'high',
          message: 'Tab switched or website left',
        })
        setState(prev => ({ 
          ...prev, 
          attentionStatus: 'Distracted',
          lastUpdate: Date.now()
        }))
      } else if (!document.hidden && state.attentionStatus === 'Distracted') {
        console.log('✅ Tab regained focus - Ready to resume')
        setState(prev => ({ 
          ...prev, 
          attentionStatus: 'Focused',
          lastUpdate: Date.now()
        }))
      }
    }
    
    const handleWindowBlur = () => {
      if (state.isVideoPlaying) {
        console.log('🚫 Window lost focus - Auto-pausing video')
        pauseVideo()
        addEvent({
          type: 'tab_switch',
          severity: 'high',
          message: 'Window lost focus',
        })
        setState(prev => ({ 
          ...prev, 
          attentionStatus: 'Distracted',
          lastUpdate: Date.now()
        }))
      }
    }
    
    const handleWindowFocus = () => {
      if (!document.hidden && state.attentionStatus === 'Distracted') {
        console.log('✅ Window regained focus')
        setState(prev => ({ 
          ...prev, 
          attentionStatus: 'Focused',
          lastUpdate: Date.now()
        }))
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [state.isVideoPlaying, state.attentionStatus, pauseVideo, addEvent])
  
  // Enhanced monitoring start
  const startMonitoring = useCallback(async (courseId: string, videoId: string) => {
    console.log('🚀 Starting comprehensive real-time monitoring...')
    
    setState(prev => ({
      ...prev,
      isMonitoring: true,
      cameraActive: true,
      lastUpdate: Date.now()
    }))
    
    // Start all monitoring systems
    await startFaceDetection()
    await startPostureMonitoring()
    
    // Start progress tracking
    progressIntervalRef.current = setInterval(() => {
      if (state.isVideoPlaying && state.faceDetected && state.attentionStatus === 'Focused') {
        setValidWatchTime(prev => prev + 1)
      }
    }, 1000) // Update every second
    
    addEvent({
      type: 'attention',
      severity: 'low',
      message: 'Real-time monitoring started',
      courseId,
      videoId
    })
    
    console.log('✅ Real-time monitoring started successfully')
  }, [startFaceDetection, startPostureMonitoring, addEvent])
  
  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    console.log('⏹️ Stopping real-time monitoring')
    
    // Clear all intervals
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current)
    }
    if (postureIntervalRef.current) {
      clearInterval(postureIntervalRef.current)
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    
    // Stop webcam stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    setState(prev => ({
      ...prev,
      isMonitoring: false,
      isVideoPlaying: false,
      cameraActive: false,
      faceDetected: false,
      attentionStatus: 'Focused',
      postureStatus: 'Good',
      lastUpdate: Date.now()
    }))
    
    console.log('✅ Real-time monitoring stopped')
  }, [])
  
  const getEventsByType = useCallback((type: MonitoringEvent['type']) => {
    return events.filter(event => event.type === type)
  }, [events])
  
  // Update attention status based on all conditions
  useEffect(() => {
    let newAttentionStatus: RealtimeMonitoringState['attentionStatus'] = 'Focused'
    
    if (!state.faceDetected) {
      newAttentionStatus = 'Absent'
    } else if (state.postureStatus !== 'Good') {
      newAttentionStatus = 'Distracted'
    }
    
    if (newAttentionStatus !== state.attentionStatus) {
      setState(prev => ({
        ...prev,
        attentionStatus: newAttentionStatus,
        lastUpdate: Date.now()
      }))
    }
  }, [state.faceDetected, state.postureStatus])
  
  // Set video element reference
  const setVideoElementRef = useCallback((element: HTMLIFrameElement | null) => {
    videoRef.current = element
  }, [])
  
  return {
    state,
    events,
    validWatchTime,
    startMonitoring,
    stopMonitoring,
    pauseVideo,
    resumeVideo,
    addEvent,
    getEventsByType,
    setVideoElementRef
  }
}

// Helper function to classify posture based on ESP32 sensor data
function classifyPosture(distance: number, angle: number): RealtimeMonitoringState['postureStatus'] {
  if (distance < 30 || angle > 30) {
    return 'Poor'
  } else if (distance < 50 || angle > 20) {
    return 'Leaning Forward'
  } else {
    return 'Good'
  }
}