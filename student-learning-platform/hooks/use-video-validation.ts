"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { realtimeDb, saveAlertToFirebase } from "../lib/firebase"

interface VideoValidationState {
  watchTime: number
  totalDuration: number
  violations: {
    tabSwitches: number
    faceMissingEvents: number
    autoPauses: number
    skipCount: number
    skippedTime: number
  }
  isValid: boolean
  isCompleted: boolean
  completionPercentage: number
  isVideoPlaying: boolean
}

interface VideoValidationHook {
  state: VideoValidationState
  startVideoValidation: (duration: number) => void
  addViolation: (type: keyof VideoValidationState['violations']) => void
  validateVideoCompletion: () => { isValid: boolean; reasons: string[] }
  resetValidation: () => void
  getVideoProgress: () => { percentage: number; timeRemaining: number }
  resumeVideo: () => void
  pauseVideo: () => void
}

interface VideoCompletionRule {
  maxTabSwitches: number
  maxFaceMissingEvents: number
  maxAutoPauses: number
  maxSkips: number
  minWatchTimePercentage: number
  maxSkippedTimePercentage: number
}

const DEFAULT_RULES: VideoCompletionRule = {
  maxTabSwitches: 10,
  maxFaceMissingEvents: 10,
  maxAutoPauses: 10,
  maxSkips: 5,
  minWatchTimePercentage: 0.9, // 90%
  maxSkippedTimePercentage: 0.1 // 10%
}

export function useVideoValidation(
  userId: string,
  customRules: Partial<VideoCompletionRule> = {}
): VideoValidationHook {
  const rules = { ...DEFAULT_RULES, ...customRules }
  
  const [state, setState] = useState<VideoValidationState>({
    watchTime: 0,
    totalDuration: 0,
    violations: {
      tabSwitches: 0,
      faceMissingEvents: 0,
      autoPauses: 0,
      skipCount: 0,
      skippedTime: 0
    },
    isValid: true,
    isCompleted: false,
    completionPercentage: 0,
    isVideoPlaying: false
  })
  
  const lastPositionRef = useRef<number>(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  // Start video validation
  const startVideoValidation = (duration: number) => {
    console.log('🎬 Starting video validation with strict rules...')
    
    setState(prev => ({
      ...prev,
      totalDuration: duration,
      watchTime: 0,
      violations: {
        tabSwitches: 0,
        faceMissingEvents: 0,
        autoPauses: 0,
        skipCount: 0,
        skippedTime: 0
      },
      isValid: true,
      isCompleted: false,
      completionPercentage: 0
    }))
    
    setHasStarted(true)
    setIsPaused(false)
    
    saveAlertToFirebase(userId, {
      type: 'attention',
      severity: 'low',
      message: 'Video validation started',
    })
  }
  
  // Add violation
  const addViolation = (type: keyof VideoValidationState['violations']) => {
    console.log(`⚠️ Adding violation: ${type}`)
    
    setState(prev => {
      const newViolations = { ...prev.violations }
      newViolations[type] += 1
      
      return {
        ...prev,
        violations: newViolations,
        lastUpdate: Date.now()
      }
    })
    
    // Log violation to Firebase
    saveAlertToFirebase(userId, {
      type: 'attention',
      severity: 'high',
      message: `Violation added: ${type}`,
    })
  }
  
  // Enhanced skip tracking
  const addSkip = (amount: number) => {
    console.log(`⏭️ Skip detected: ${amount} seconds`)
    
    setState(prev => ({
      ...prev,
      violations: {
        ...prev.violations,
        skipCount: prev.violations.skipCount + 1,
        skippedTime: prev.violations.skippedTime + amount
      },
      lastUpdate: Date.now()
    }))
    
    // Log skip to Firebase
    saveAlertToFirebase(userId, {
      type: 'attention',
      severity: 'medium',
      message: `User skipped ${amount} seconds`,
    })
  }
  
  // Auto-pause tracking
  const incrementAutoPauseCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      violations: {
        ...prev.violations,
        autoPauses: prev.violations.autoPauses + 1
      },
      lastUpdate: Date.now()
    }))
    
    saveAlertToFirebase(userId, {
      type: 'auto_pause',
      severity: 'medium',
      message: 'Video auto-paused',
    })
  }, [userId, setState])
  
  // Position tracking for skip detection
  useEffect(() => {
    const handleSeek = () => {
      if (!hasStarted || isPaused) return
      
      const currentTime = state.watchTime
      const newPosition = Math.abs(currentTime - lastPositionRef.current)
      
      if (newPosition > 10) { // Skip threshold of 10 seconds
        console.log(`⚠️ Skip detected: ${newPosition} seconds`)
        addSkip(newPosition)
      }
      
      lastPositionRef.current = currentTime
    }
    
    // Listen for seek events
    const video = document.querySelector('video')
    const iframe = document.querySelector('iframe')
    
    if (video) {
      video.addEventListener('seeked', handleSeek)
    } else if (iframe) {
      // For iframe videos, listen to postMessage
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'seek') {
          handleSeek()
        }
      })
    }
    
    return () => {
      if (video) {
        video.removeEventListener('seeked', handleSeek)
      }
      window.removeEventListener('message', (event) => {
        if (event.data && event.data.type === 'seek') {
          handleSeek()
        }
      })
    }
  }, [hasStarted, isPaused, addSkip, state.watchTime])
  
  // Check if video should be paused
  const checkVideoStatus = useCallback(() => {
    if (state.watchTime > 0 && isPaused && !hasStarted) {
      incrementAutoPauseCount()
    }
  }, [state.watchTime, isPaused, hasStarted, incrementAutoPauseCount])
  
  // Check every second
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    intervalRef.current = setInterval(checkVideoStatus, 1000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkVideoStatus])
  
  // Resume tracking
  const resumeVideo = () => {
    console.log('▶️ Video resumed')
    setIsPaused(false)
    setHasStarted(true)
    setState(prev => ({ ...prev, isVideoPlaying: true }))
    
    saveAlertToFirebase(userId, {
      type: 'attention',
      severity: 'low',
      message: 'Video resumed by user',
    })
  }
  
  const pauseVideo = () => {
    console.log('⏸️ Video paused')
    setIsPaused(true)
    setState(prev => ({ ...prev, isVideoPlaying: false }))
    
    saveAlertToFirebase(userId, {
      type: 'attention',
      severity: 'low',
      message: 'Video paused by user',
    })
  }
  
  // Validate video completion
  const validateVideoCompletion = (): { isValid: boolean; reasons: string[] } => {
    const { watchTime, totalDuration, violations } = state
    
    if (totalDuration === 0) {
      return {
        isValid: false,
        reasons: ['No video duration set']
      }
    }
    
    const minWatchTime = totalDuration * rules.minWatchTimePercentage
    const isValidWatchTime = watchTime >= minWatchTime
    
    const reasons: string[] = []
    
    // Check each violation rule
    if (!isValidWatchTime) {
      reasons.push(`Insufficient watch time (${Math.round(watchTime)}s / ${Math.round(minWatchTime)}s required)`)
    }
    
    if (violations.tabSwitches > rules.maxTabSwitches) {
      reasons.push(`Too many tab switches (${violations.tabSwitches} > ${rules.maxTabSwitches})`)
    }
    
    if (violations.faceMissingEvents > rules.maxFaceMissingEvents) {
      reasons.push(`Too many face-missing events (${violations.faceMissingEvents} > ${rules.maxFaceMissingEvents})`)
    }
    
    if (violations.autoPauses > rules.maxAutoPauses) {
      reasons.push(`Too many auto-pauses (${violations.autoPauses} > ${rules.maxAutoPauses})`)
    }
    
    if (violations.skipCount > rules.maxSkips) {
      reasons.push(`Too many skips (${violations.skipCount} > ${rules.maxSkips})`)
    }
    
    const skippedTimePercentage = totalDuration > 0 ? violations.skippedTime / totalDuration : 0
    if (skippedTimePercentage > rules.maxSkippedTimePercentage) {
      reasons.push(`Too much skipped time (${Math.round(skippedTimePercentage * 100)}% > ${Math.round(rules.maxSkippedTimePercentage * 100)}%)`)
    }
    
    const isValid = reasons.length === 0 && isValidWatchTime
    const completionPercentage = Math.min((watchTime / totalDuration) * 100, 100)
    
    setState(prev => ({
      ...prev,
      isValid,
      isCompleted: isValid && completionPercentage >= 100,
      completionPercentage
    }))
    
    console.log(`📊 Video validation result: ${isValid ? 'VALID' : 'INVALID'}`)
    if (reasons.length > 0) {
      console.log('❌ Invalid reasons:', reasons)
    }
    
    // Save validation result to Firebase
    saveAlertToFirebase(userId, {
      type: 'attention',
      severity: isValid ? 'low' : 'high',
      message: isValid ? 'Video completed successfully' : `Video completion invalid: ${reasons.join(', ')}`,
    })
    
    return { isValid, reasons }
  }
  
  // Get video progress
  const getVideoProgress = () => {
    const { watchTime, totalDuration } = state
    
    if (totalDuration === 0) {
      return { percentage: 0, timeRemaining: 0 }
    }
    
    const percentage = Math.min((watchTime / totalDuration) * 100, 100)
    const timeRemaining = Math.max(0, totalDuration - watchTime)
    
    return { percentage, timeRemaining }
  }
  
  // Reset validation
  const resetValidation = () => {
    console.log('🔄 Resetting video validation')
    
    setState({
      watchTime: 0,
      totalDuration: 0,
      violations: {
        tabSwitches: 0,
        faceMissingEvents: 0,
        autoPauses: 0,
        skipCount: 0,
        skippedTime: 0
      },
      isValid: true,
      isCompleted: false,
      completionPercentage: 0,
      isVideoPlaying: false
    })
    
    lastPositionRef.current = 0
    setHasStarted(false)
    setIsPaused(false)
    
    saveAlertToFirebase(userId, {
      type: 'attention',
      severity: 'low',
      message: 'Video validation reset',
    })
  }
  
  return {
    state,
    startVideoValidation,
    addViolation,
    validateVideoCompletion,
    resetValidation,
    getVideoProgress,
    resumeVideo,
    pauseVideo
  }
}