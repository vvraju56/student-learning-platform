"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Badge from "react-bootstrap/Badge"
import { 
  Camera, CameraOff, AlertTriangle, CheckCircle, Play, Pause, 
  Eye, User, Monitor, Activity
} from "lucide-react"

export function FaceMonitoringComponentV2({ videoRef }: { videoRef: React.RefObject<any> }) {
  const [monitoringActive, setMonitoringActive] = useState(false)
  const [state, setState] = useState({
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<any>(null)

  // Simple face detection using Canvas 2D API
  const simpleFaceDetection = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
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
      const grayPrev = (data[i - 4]) * 0.299 + (data[i - 3]) * 0.587 + (data[i - 2]) * 0.114
      const diff = Math.abs(gray - grayPrev)
      if (diff > 30) motion++
    }

    return motion > 100
  }, [])

  const analyzeAttention = useCallback((faceDetected: boolean): string => {
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
      const constraints = {
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
        await videoRef.current.play()
      }

      if (canvasRef.current) {
        canvasRef.current.width = 640
        canvasRef.current.height = 480
      }

      streamRef.current = stream
      setMonitoringActive(true)
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
      setState(prev => ({ ...prev, isMonitoring: false }))
      alert("Camera access is required for monitoring. Please allow camera access.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: any) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setMonitoringActive(false)
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
    if (!monitoringActive) return

    const detect = () => {
      if (!monitoringActive) return
      
      const faceDetected = simpleFaceDetection()
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
  }, [monitoringActive, state.faceDetected])

  const handleVisibilityChange = useCallback(() => {
    if (!monitoringActive) return
    
    if (document.hidden) {
      setState(prev => ({ ...prev, attentionStatus: "Distracted" }))
      
      if (videoRef.current && !videoRef.current?.paused) {
        videoRef.current.pause()
        setState(prev => ({
          ...prev,
          violations: {
            ...prev.violations,
            tabSwitches: prev.violations.tabSwitches + 1
          }
        }))
        console.log("🚫 Tab switched - Video auto-paused")
      }
    } else {
      setState(prev => ({ ...prev, attentionStatus: "Focused" }))
    }
  }, [monitoringActive])

  const handleBlur = useCallback(() => {
    if (!monitoringActive) return
    setState(prev => ({ ...prev, attentionStatus: "Distracted" }))
  }, [monitoringActive])

  const handleFocus = useCallback(() => {
    if (!monitoringActive) return
    setState(prev => ({ ...prev, attentionStatus: "Focused" }))
  }, [monitoringActive])

  useEffect(() => {
    const handleBlur = () => {
      if (!monitoringActive) return
      setState(prev => ({ ...prev, attentionStatus: "Distracted" }))
    }

    const handleFocus = () => {
      if (!monitoringActive) return
      setState(prev => ({ ...prev, attentionStatus: "Focused" }))
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("blur", handleBlur)
      document.removeEventListener("focus", handleFocus)
    }
  }, [monitoringActive])

  useEffect(() => {
    if (!monitoringActive) {
      console.log("🧠 Attention tracking disabled")
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
      }
      return
    }

    if (!state.cameraActive) {
      console.log("📷 Camera Off")
      return
    }

    if (!state.faceDetected) {
      console.log("🧠 Attention tracking disabled - No face detected")
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
      }
      return
    }

    console.log("🧠 Attention tracking enabled")
  }, [monitoringActive, state.cameraActive, state.faceDetected])

  const actions = {
    startMonitoring: () => {
      startCamera()
    },
    
    stopMonitoring: () => {
      stopCamera()
    },
    
    pauseVideo: () => {
      if (videoRef.current && !videoRef.current?.paused) {
        videoRef.current.pause()
        console.log("⏸️ Video manually paused")
      }
    },
    
    resumeVideo: () => {
      if (videoRef.current && videoRef.current?.paused && state.faceDetected) {
        videoRef.current.play()
        console.log("▶️ Video manually resumed")
      }
    },
    
    updatePosture: (status: string) => {
      setState(prev => ({
        ...prev,
        postureStatus: status
      }))
      console.log(`🧍 Posture updated: ${status}`)
      
      if (status === "Poor" && videoRef.current && !videoRef.current?.paused) {
        setTimeout(() => {
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause()
            setState(prev => ({
              ...prev,
              violations: {
                ...prev.violations,
                autoPauses: prev.violations.autoPauses + 1
              }
            }))
            console.log("⚠️ Poor posture detected - Video auto-paused")
          }
        }, 1000)
      }
    },
    
    updateAttention: (status: string) => {
      setState(prev => ({
        ...prev,
        attentionStatus: status
      }))
      console.log(`👁️ Attention updated: ${status}`)
    }
  }

  return { 
    state: {
      ...state,
      isMonitoring: monitoringActive
    }, 
    actions,
    videoRef,
    canvasRef,
    streamRef,
    monitoringActive
  }
}