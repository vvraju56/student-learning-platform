"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { useFaceDetection } from './use-face-detection'
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
  blinkCount: number
  gazeDirection: string
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
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  toggleLandmarks: () => void
}

export function useRealtimeMonitoring(userId: string): MonitoringHook {
  const {
    isFaceDetected,
    isWebcamActive,
    startWebcam,
    stopWebcam
  } = useFaceDetection()

  // kept for API compatibility with existing components
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const toggleLandmarks = useCallback(() => {}, [])
  
  const [state, setState] = useState<RealtimeMonitoringState>({
    isMonitoring: false,
    isVideoPlaying: false,
    faceDetected: false,
    postureStatus: 'Good',
    attentionStatus: 'Focused',
    cameraActive: false,
    lastUpdate: Date.now(),
    blinkCount: 0,
    gazeDirection: 'N/A'
  })

  // Sync face-only state to our internal state
  useEffect(() => {
    if (state.isMonitoring) {
      const nextAttention: RealtimeMonitoringState['attentionStatus'] =
        !isFaceDetected ? 'Absent' : state.postureStatus === 'Good' ? 'Focused' : 'Distracted'

      setState(prev => ({
        ...prev,
        faceDetected: isFaceDetected,
        attentionStatus: nextAttention,
        cameraActive: isWebcamActive,
        lastUpdate: Date.now(),
        blinkCount: 0,
        gazeDirection: 'N/A'
      }))

    }
  }, [isFaceDetected, isWebcamActive, state.isMonitoring, state.postureStatus])
  
  const [events, setEvents] = useState<MonitoringEvent[]>([])
  const [validWatchTime, setValidWatchTime] = useState(0)
  
  const videoRef = useRef<HTMLIFrameElement>(null)
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
  
  // Face-only detection
  const startFaceDetection = useCallback(async () => {
    try {
      console.log('📷 Starting face monitoring...')
      await startWebcam()
      
      setState(prev => ({
        ...prev,
        cameraActive: true,
        lastUpdate: Date.now()
      }))
    } catch (error) {
      console.error('Failed to start face tracking:', error)
      addEvent({
        type: 'face',
        severity: 'high',
        message: `Face monitoring failed to start: ${error}`,
      })
    }
  }, [startWebcam, addEvent])
  
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
      } catch {
        console.log('📱 ESP32 not available, falling back to webcam-based detection')
      }
      
      // Fallback to webcam-based posture monitoring
      if (!esp32Connected && isWebcamActive) {
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
    
    // Stop camera monitoring
    stopWebcam()

    // Clear all intervals
    if (postureIntervalRef.current) {
      clearInterval(postureIntervalRef.current)
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
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
  }, [stopWebcam])
  
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
    setVideoElementRef,
    canvasRef,
    toggleLandmarks
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
