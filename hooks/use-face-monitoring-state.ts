"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Badge from "react-bootstrap/Badge"
import { 
  Camera, CameraOff, AlertTriangle, CheckCircle, Play, Pause, 
  Eye, User, Monitor, Activity
} from "lucide-react"

// Types for Face Monitoring system
interface FaceMonitoringState {
  isMonitoring: boolean
  cameraActive: boolean
  faceDetected: boolean
  attentionStatus: "Focused" | "Distracted" | "Absent"
  postureStatus: "Good Posture" | "Leaning Forward" | "Poor"
  validWatchTime: number
  sessionStartTime: number
  violations: {
    tabSwitches: number
    faceMissingCount: number
    autoPauses: number
  }
}

interface FaceMonitoringActions {
  startMonitoring: () => void
  stopMonitoring: () => void
  pauseVideo: () => void
  resumeVideo: () => void
  updatePosture: (status: string) => void
  updateAttention: (status: string) => void
}

// Simple face detection using Canvas 2D API (privacy-safe)
const simpleFaceDetection = (
  video: HTMLVideoElement | null, 
  canvas: HTMLCanvasElement | null
  bool
): boolean => {
  if (!video || !canvas || video.paused) return false

  const ctx = canvas.getContext("2d")
  if (!ctx) return false

  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 480

  ctx.drawImage(video, 0, 0)
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let motion = 0
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const grayPrev = (data[i - 4] * 0.299 + data[i - 3] * 0.587 + data[i - 2] * 0.114)
    const diff = Math.abs(gray - grayPrev)
    if (diff > 30) motion++
  }

  return motion > 100
}

// Attention analysis from face landmarks
const analyzeAttention = (
  face: any, 
  hasRequired: boolean = true
): "Focused" | "Distracted" | "Absent" => {
  if (!hasRequired) return "Absent"
    
  // Simple heuristics for attention
  const landmarks = face?.landmarks
  if (!landmarks || landmarks.length === 0) return "Distracted"
    
  const eyesOpen = landmarks?.[0]?.y < 0.2 ? true : false
  const rightEyeOpen = landmarks?.[2]?.y < 0.5 ? true : false
    
  // Simple head pose detection
  const headPose = landmarks?.[33]
    
  const eyesOpen = eyesOpen && rightEyeOpen
  const lookingForward = Math.abs(headPose?.x) < 0.2
    
  return eyesOpen && lookingForward ? "Focused" : (eyesOpen ? "Distracted" : "Absent")
}

// Main Face Monitoring hook
export function useFaceMonitoring(): FaceMonitoringState & FaceMonitoringActions {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [state, setState] = useState<FaceMonitoringState>({
    isMonitoring: false,
    cameraActive: false,
    faceDetected: false,
    attentionStatus: "Focused",
    postureStatus: "Good Posture",
    validWatchTime: 0,
    sessionStartTime: 0,
    violations: {
      tabSwitches: 0,
      faceMissingCount: 0,
      autoPauses: 0
    }
  })

  // Face detection using Canvas 2D API
  const detectFace = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.paused) return false

    return simpleFaceDetection(video, canvas)
  }, [videoRef.current, canvasRef.current])

  // Attention analysis
  const analyzeAttention = useCallback((faceDetected: boolean): "Focused" | "Distracted" | "Absent" => {
    if (!faceDetected) return "Absent"
    
    const now = Date.now()
    const timeSinceLastDetection = state.faceDetected ? now - (state.sessionStartTime || now) : 10000
    
    if (timeSinceLastDetection > 3000) {
      return "Distracted"
    }
    
    return "Focused"
  }, [state.faceDetected, state.sessionStartTime])

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { 
          width: 640, 
          height: 480,
          facing: "user"
        },
        audio: false 
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      if (canvasRef.current) {
        canvasRef.current.width = 640
        canvasRef.current.height = 480
      }

      streamRef.current = stream
      setState(prev => ({ 
        ...prev, 
        cameraActive: true, 
        isMonitoring: true, 
        sessionStartTime: Date.now() 
      }))
      console.log("🎥 Camera started - Face detection active")
      
      startDetectionLoop()
      
    } catch (error) {
      console.error("❌ Camera access denied:", error)
      alert("Camera access is required for monitoring. Please allow camera access.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setState(prev => ({ 
      ...prev, 
      cameraActive: false, 
      isMonitoring: false, 
      faceDetected: false,
      attentionStatus: "Absent"
    }))
    console.log("⏹️ Camera stopped - Monitoring inactive")
  }, [])

  const startDetectionLoop = useCallback(() => {
    if (!state.isMonitoring) return

    const detect = () => {
      const faceDetected = detectFace()
      const wasFaceDetected = state.faceDetected
      
      setState(prev => ({ ...prev, faceDetected }))
      
      if (!wasFaceDetected && faceDetected) {
        console.log("👤 Face detected")
        setState(prev => ({ ...prev, attentionStatus: "Focused" }))
      } else if (wasFaceDetected && !faceDetected) {
        console.log("😐 Face not detected")
        
        const attentionStatus = analyzeAttention(false)
        setState(prev => ({ ...prev, attentionStatus }))
        
        if (videoRef.current && !videoRef.current?.paused) {
          videoRef.current.pause()
          setState(prev => ({
            ...prev,
            violations: {
              ...prev.violations,
              faceMissingCount: prev.violations.faceMissingCount + 1,
              autoPauses: prev.violations.autoPauses + 1
            }
          }))
          console.log("🚫 Face not detected - Video auto-paused")
        }
      }
      
      if (faceDetected && videoRef.current && !videoRef.current.paused) {
        setState(prev => ({ ...prev, validWatchTime: prev.validWatchTime + 0.1 }))
      }
    }

    const interval = setInterval(detect, 100)
    return () => clearInterval(interval)
  }, [state.isMonitoring])

  // Browser focus monitoring
  const handleVisibilityChange = useCallback(() => {
    if (!state.isMonitoring) return
    
    if (document.hidden) {
      setState(prev => ({ ...prev, attentionStatus: "Distracted" })
      
      if (videoRef.current && !videoRef.current?.paused) {
        videoRef.current.pause()
      setState(prev => ({ ...prev,
          violations: {
            ...prev.violations,
            tabSwitches: prev.violations.tabSwitches + 1
          }
        })
        console.log("🚫 Tab switched - Video auto-paused")
      }
    } else {
      setState(prev => ({ ...prev, attentionStatus: "Focused" })
    }
  }, [state.isMonitoring])

  useEffect(() => {
    const handleBlur = () => {
      if (!state.isMonitoring) return
      setState(prev => ({ ...prev, attentionStatus: "Distracted" })
    }, [state.isMonitoring])

    const handleFocus = () => {
      if (!state.isMonitoring) return
      setState(prev => ({ ...prev, attentionStatus: "Focused" })
    }, [state.isMonitoring])

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("blur", handleFocus)
      window.removeEventListener("focus", handleFocus)
    }
  }, [state.isMonitoring])

  // Video control functions
  const pauseVideo = useCallback(() => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
      console.log("Video paused")
    }
  }, [])

  const resumeVideo = useCallback(() => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play()
      console.log("Video resumed")
    }
  }, [])

  const updatePosture = useCallback((status: string) => {
    setState(prev => ({
      ...prev,
      violations: {
        ...prev.violations,
        posture: prev.violations.posture + (status === 'bad' ? 1 : 0)
      }
    }))
  }, [])

  const updateAttention = useCallback((status: string) => {
    setState(prev => ({ ...prev, attentionStatus: status }))
  }, [])

  const actions: FaceMonitoringActions = {
    startMonitoring: startCamera,
    stopMonitoring: stopCamera,
    pauseVideo,
    resumeVideo,
    updatePosture,
    updateAttention
  }

  return { 
    state, 
    actions,
    videoRef, 
    canvasRef,
    streamRef 
  }
}