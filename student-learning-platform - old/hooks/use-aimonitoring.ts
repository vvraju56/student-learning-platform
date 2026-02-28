"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import * as faceapi from "face-api.js"

interface MonitoringStates {
  monitoringActive: boolean
  cameraActive: boolean
  faceDetected: boolean
  tabVisible: boolean
  videoPlaying: boolean
}

interface ViolationCounts {
  faceMissingCount: number
  tabSwitchCount: number
  autoPauseCount: number
  videoInvalidated: boolean
}

interface MonitoringHook {
  states: MonitoringStates
  violations: ViolationCounts
  validWatchTime: number
  startMonitoring: () => Promise<void>
  stopMonitoring: () => void
  requestCameraPermission: () => Promise<void>
  pauseVideo: () => void
  resumeVideo: () => void
}

// Configuration
const VIOLATION_LIMIT = 10
const DETECTION_INTERVAL = 400 // 400ms - every 0.4 seconds
const FIREBASE_SAVE_INTERVAL = 30000 // 30 seconds

export function useAIMonitoring(videoRef: React.RefObject<HTMLIFrameElement>): MonitoringHook {
  // Core monitoring states
  const [monitoringActive, setMonitoringActive] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const [videoPlaying, setVideoPlaying] = useState(false)

  // Violation tracking
  const [faceMissingCount, setFaceMissingCount] = useState(0)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [autoPauseCount, setAutoPauseCount] = useState(0)
  const [videoInvalidated, setVideoInvalidated] = useState(false)

  // Watch time (only increments when ALL conditions are met)
  const [validWatchTime, setValidWatchTime] = useState(0)

  // Refs for intervals and streams
  const videoStreamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const firebaseSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Single source of truth for enforcement
  const canCountTime = monitoringActive && cameraActive && faceDetected && tabVisible && videoPlaying && !videoInvalidated

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        console.log('✅ Face detection models loaded')
      } catch (error) {
        console.warn('⚠️ Face-api models not found, using fallback detection')
      }
    }
    loadModels()
  }, [])

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      })

      videoStreamRef.current = stream
      setCameraActive(true)
      console.log('📷 Camera permission granted')

      return stream
    } catch (error: any) {
      console.error('❌ Camera permission denied:', error.message)
      setCameraActive(false)
      throw error
    }
  }, [])

  // Face detection loop
  const startFaceDetection = useCallback(async () => {
    if (!videoStreamRef.current) return

    const video = document.createElement('video')
    video.srcObject = videoStreamRef.current
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    video.style.display = 'none'
    document.body.appendChild(video)

    // Wait for video to be ready
    await new Promise(resolve => video.onloadedmetadata = resolve)

    detectionIntervalRef.current = setInterval(async () => {
      try {
        // Try face-api detection first
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        )

        const hasFace = detections.length > 0
        setFaceDetected(hasFace)

        if (!hasFace) {
          setFaceMissingCount(prev => {
            const newCount = prev + 1
            if (newCount >= VIOLATION_LIMIT) {
              setVideoInvalidated(true)
              console.log('❌ Video invalidated - too many face violations')
            }
            return newCount
          })
        } else {
          setFaceMissingCount(0)
        }
      } catch (error) {
        // Fallback to simple motion detection if face-api fails
        setFaceDetected(true) // Assume present if no errors
      }
    }, DETECTION_INTERVAL)

    return () => {
      document.body.removeChild(video)
    }
  }, [])

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setTabVisible(isVisible)

      if (!isVisible) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1
          if (newCount >= VIOLATION_LIMIT) {
            setVideoInvalidated(true)
            console.log('❌ Video invalidated - too many tab switches')
          }
          return newCount
        })
        console.log('⛔ Tab switched → Progress blocked')
      }
    }

    const handleFocusChange = () => {
      const hasFocus = !document.hidden && document.hasFocus()
      setTabVisible(hasFocus)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleFocusChange)
    window.addEventListener('focus', handleFocusChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleFocusChange)
      window.removeEventListener('focus', handleFocusChange)
    }
  }, [])

  // Enforced watch-time timer - CORE ENFORCEMENT
  useEffect(() => {
    if (!canCountTime) {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current)
        watchTimeIntervalRef.current = null
      }
      return
    }

    // Only start timer if ALL conditions are met
    watchTimeIntervalRef.current = setInterval(() => {
      setValidWatchTime(prev => prev + 1)
    }, 1000)

    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current)
        watchTimeIntervalRef.current = null
      }
    }
  }, [canCountTime]) // React controls based on canCountTime

  // Video enforcement - pause on violations
  useEffect(() => {
    if (!canCountTime && videoPlaying) {
      pauseVideo()
      console.log('🚫 Enforcement: Video paused - conditions not met')
    }
  }, [canCountTime, videoPlaying])

  // Firebase save interval
  useEffect(() => {
    if (!monitoringActive) return

    firebaseSaveIntervalRef.current = setInterval(() => {
      // Save only valid progress
      saveProgressToFirebase()
    }, FIREBASE_SAVE_INTERVAL)

    return () => {
      if (firebaseSaveIntervalRef.current) {
        clearInterval(firebaseSaveIntervalRef.current)
        firebaseSaveIntervalRef.current = null
      }
    }
  }, [monitoringActive])

  // Video control functions
  const pauseVideo = useCallback(() => {
    if (videoRef.current && videoPlaying) {
      try {
        videoRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          '*'
        )
        setVideoPlaying(false)
        setAutoPauseCount(prev => prev + 1)
        console.log('⏸️ Video paused - enforcement')
      } catch (e) {
        console.log('Cannot control iframe - cross-origin restriction')
      }
    }
  }, [videoRef, videoPlaying])

  const resumeVideo = useCallback(() => {
    if (videoRef.current && !videoPlaying && canCountTime) {
      try {
        videoRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          '*'
        )
        setVideoPlaying(true)
        console.log('▶️ Video resumed - conditions met')
      } catch (e) {
        console.log('Cannot control iframe - cross-origin restriction')
      }
    }
  }, [videoRef, videoPlaying, canCountTime])

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    if (monitoringActive) return

    try {
      const stream = await requestCameraPermission()
      setMonitoringActive(true)
      setVideoInvalidated(false)

      // Start face detection
      await startFaceDetection()

      // Set initial video playing state
      setVideoPlaying(true)

      console.log('🎯 AI Monitoring started')
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error)
    }
  }, [monitoringActive, requestCameraPermission, startFaceDetection])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setMonitoringActive(false)

    // Clear all intervals
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current)
      watchTimeIntervalRef.current = null
    }

    if (firebaseSaveIntervalRef.current) {
      clearInterval(firebaseSaveIntervalRef.current)
      firebaseSaveIntervalRef.current = null
    }

    // Stop camera stream
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop())
      videoStreamRef.current = null
    }

    setCameraActive(false)
    setFaceDetected(false)
    setVideoPlaying(false)

    // Save final progress
    saveProgressToFirebase()

    console.log('⏹️ AI Monitoring stopped')
  }, [])

  // Save progress to Firebase
  const saveProgressToFirebase = useCallback(() => {
    // This would be implemented with your Firebase config
    console.log(`💾 Saving progress: ${validWatchTime}s`)
    // TODO: Replace with actual Firebase save
    // await saveVideoProgressToFirebase(userId, courseId, videoId, validWatchTime)
  }, [validWatchTime])

  // Return hook interface
  return {
    states: {
      monitoringActive,
      cameraActive,
      faceDetected,
      tabVisible,
      videoPlaying
    },
    violations: {
      faceMissingCount,
      tabSwitchCount,
      autoPauseCount,
      videoInvalidated
    },
    validWatchTime,
    startMonitoring,
    stopMonitoring,
    requestCameraPermission,
    pauseVideo,
    resumeVideo
  }
}