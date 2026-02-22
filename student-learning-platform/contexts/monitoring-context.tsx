"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { FirebaseProgressManager } from "../lib/firebase-progress"

interface MonitoringState {
  isVideoPlaying: boolean
  currentCourseId: string | null
  currentVideoId: string | null
  focusActive: boolean
  isMonitoring: boolean
  postureStatus: 'Good' | 'Leaning Forward' | 'Poor'
  attentionStatus: 'Focused' | 'Distracted' | 'Absent'
  cameraStatus: boolean
  timerPaused: boolean
  faceDetected: boolean
  lastAlert: string | null
  alertCount: number
}

interface MonitoringActions {
  startMonitoring: () => void
  stopMonitoring: () => void
  startVideoPlayback: (courseId: string, videoId: string) => void
  pauseVideoPlayback: () => void
  resumeVideoPlayback: () => void
  setVideoElementRef: (element: HTMLIFrameElement | null) => void
}

interface MonitoringContextType extends MonitoringState, MonitoringActions {}

const MonitoringContext = createContext<MonitoringContextType | null>(null)

export function useMonitoring(): MonitoringContextType {
  const context = useContext(MonitoringContext)
  if (!context) {
    throw new Error('useMonitoring must be used within MonitoringProvider')
  }
  return context
}

interface MonitoringProviderProps {
  children: ReactNode
  userId: string
}

export function MonitoringProvider({ children, userId }: MonitoringProviderProps) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  // ✅ FREE PLAN: Initialize Firebase Progress Manager
  const firebaseManager = new FirebaseProgressManager(userId)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [focusActive, setFocusActive] = useState(true)
  const [timerPaused, setTimerPaused] = useState(false)
  const [postureStatus, setPostureStatus] = useState<'Good' | 'Leaning Forward' | 'Poor'>('Good')
  const [attentionStatus, setAttentionStatus] = useState<'Focused' | 'Distracted' | 'Absent'>('Focused')
  const [cameraStatus, setCameraStatus] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [lastAlert, setLastAlert] = useState<string | null>(null)
  const [alertCount, setAlertCount] = useState(0)
  const [videoElement, setVideoElement] = useState<HTMLIFrameElement | null>(null)

  const startMonitoring = async () => {
    try {
      // Request camera access for face detection
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      })
      setCameraStatus(true)
      setFaceDetected(true)
      
      // Start face detection simulation
      startFaceDetection(stream)
    } catch (error) {
      // Camera denied, use simulation
      setCameraStatus(true)
      setFaceDetected(true)
    }
    
    setIsMonitoring(true)
    setPostureStatus('Good')
    setAttentionStatus('Focused')
  }

  // Real-time face detection simulation
  const startFaceDetection = (stream: MediaStream) => {
    let faceMissingTime = 0
    const maxFaceMissingTime = 5 // 5 seconds threshold
    
    const faceDetectionInterval = setInterval(() => {
      if (!isMonitoring) {
        clearInterval(faceDetectionInterval)
        return
      }
      
      // Simulate face detection (in real implementation, use face-api.js or MediaPipe)
      const faceDetectedNow = Math.random() > 0.1 // 90% detection rate
      
      if (faceDetectedNow) {
        setFaceDetected(true)
        faceMissingTime = 0
        
        // Update attention status based on all conditions
        updateAttentionStatus()
      } else {
        faceMissingTime++
        setFaceDetected(false)
        
        // Auto-pause if face missing for too long
        if (faceMissingTime >= maxFaceMissingTime) {
          handleFaceMissing()
        }
      }
    }, 1000)
  }

  // Handle face missing event
  const handleFaceMissing = () => {
    console.log('🚫 Face Not Detected - Auto-pausing video')
    setAttentionStatus('Absent')
    setIsVideoPlaying(false)
    setTimerPaused(true)
    setLastAlert('Face not detected - Please ensure your face is visible')
    setAlertCount(prev => prev + 1)
    
    // Auto-pause YouTube video
    pauseYouTubeVideo()
    
    firebaseManager.recordViolation('faceMissing')
  }

  // Update attention status based on all conditions
  const updateAttentionStatus = () => {
    if (!document.hidden && faceDetected && postureStatus === 'Good') {
      setAttentionStatus('Focused')
      setFocusActive(true)
    } else {
      setAttentionStatus('Distracted')
      setFocusActive(false)
    }
  }

  // YouTube video control
  const pauseYouTubeVideo = () => {
    if (videoElement && videoElement.contentWindow) {
      videoElement.contentWindow.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}',
        '*'
      )
    }
  }

  const playYouTubeVideo = () => {
    if (videoElement && videoElement.contentWindow) {
      videoElement.contentWindow.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        '*'
      )
    }
  }

  const stopMonitoring = () => {
    console.log('⏹️ Stopping AI Monitoring')
    
    setIsMonitoring(false)
    setCameraStatus(false)
    setFaceDetected(false)
    setPostureStatus('Good')
    setAttentionStatus('Focused')
    setIsVideoPlaying(false)
    setTimerPaused(false)
    
    console.log('⏹️ AI Monitoring Stopped')
  }

  const startVideoPlayback = (courseId: string, videoId: string) => {
    setCurrentCourseId(courseId)
    setCurrentVideoId(videoId)
    setIsVideoPlaying(true)
    console.log(`▶️ Video Started: ${courseId}/${videoId}`)
  }

  const pauseVideoPlayback = () => {
    setIsVideoPlaying(false)
    setTimerPaused(true)
    console.log('⏸️ Video Paused - Timer Stopped')
    pauseYouTubeVideo()
  }

  const resumeVideoPlayback = () => {
    setIsVideoPlaying(true)
    setTimerPaused(false)
    console.log('▶️ Video Resumed - Timer Started')
    playYouTubeVideo()
  }

  // Video element reference function
  const setVideoElementRef = (element: HTMLIFrameElement | null) => {
    setVideoElement(element)
  }

  // Posture monitoring simulation with Firebase tracking
  useEffect(() => {
    if (!isMonitoring) return
    
    let postureWarningTime = 0
    const maxPostureWarningTime = 3 // 3 seconds threshold
    
    const interval = setInterval(() => {
      const random = Math.random()
      if (random > 0.8) {
        setPostureStatus('Leaning Forward')
        postureWarningTime++
        
        if (postureWarningTime >= maxPostureWarningTime) {
          setLastAlert('⚠️ Please sit straight - You are leaning too close to screen')
          setAlertCount(prev => prev + 1)
          
          // ✅ FREE PLAN: Record violation locally (throttled)
          firebaseManager.recordViolation('postureIssues')
        }
      } else {
        setPostureStatus('Good')
        postureWarningTime = 0
      }
      
      // Update attention status based on all conditions
      updateAttentionStatus()
    }, 2000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  // Enhanced tab switching and window focus detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isMonitoring) {
        console.log('🚫 Tab Switch/Website Left - Auto-pausing video')
        setIsVideoPlaying(false)
        setTimerPaused(true)
        setAttentionStatus('Distracted')
        setLastAlert('Tab switched - Please stay on the learning page')
        setAlertCount(prev => prev + 1)
        
        // Auto-pause YouTube video
        pauseYouTubeVideo()
        
        // ✅ FREE PLAN: Record violation locally (throttled)  
        firebaseManager.recordViolation('tabSwitch')
      } else if (!document.hidden && isMonitoring) {
        console.log('✅ Tab Active - Resume monitoring')
        setAttentionStatus('Focused')
        setFocusActive(true)
        
        // Resume video if face is detected
        if (faceDetected) {
          setIsVideoPlaying(true)
          setTimerPaused(false)
          playYouTubeVideo()
        }
      }
    }

    const handleWindowBlur = () => {
      if (isMonitoring && !document.hidden) {
        console.log('🚫 Window Lost Focus - Auto-pausing video')
        setIsVideoPlaying(false)
        setTimerPaused(true)
        setAttentionStatus('Distracted')
        setLastAlert('Window lost focus - Please stay on the learning page')
        setAlertCount(prev => prev + 1)
        
        pauseYouTubeVideo()
        // ✅ FREE PLAN: Record violation locally (throttled)  
        firebaseManager.recordViolation('tabSwitch')
      }
    }

    const handleWindowFocus = () => {
      if (isMonitoring && !document.hidden) {
        console.log('✅ Window Regained Focus - Resume monitoring')
        setAttentionStatus('Focused')
        setFocusActive(true)
        
        if (faceDetected) {
          setIsVideoPlaying(true)
          setTimerPaused(false)
          playYouTubeVideo()
        }
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
  }, [isMonitoring, faceDetected])

  const value: MonitoringContextType = {
    isVideoPlaying,
    currentCourseId,
    currentVideoId,
    focusActive,
    isMonitoring,
    postureStatus,
    attentionStatus,
    cameraStatus,
    timerPaused,
    faceDetected,
    lastAlert,
    alertCount,
    startMonitoring,
    stopMonitoring,
    startVideoPlayback,
    pauseVideoPlayback,
    resumeVideoPlayback,
    setVideoElementRef
  }

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  )
}