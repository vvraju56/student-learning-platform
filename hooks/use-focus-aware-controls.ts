"use client"

import { useState, useEffect, useRef } from "react"
import { realtimeDb, saveAlertToFirebase } from "../lib/firebase"

interface FocusAwareControlsProps {
  userId: string
  courseId: string
  videoId: string
  onVideoPause: () => void
  onVideoResume: () => void
  children: (isPaused: boolean, controls: FocusControls) => React.ReactNode
}

export interface FocusControls {
  isPaused: boolean
  violations: {
    tabSwitches: number
    faceMissingCount: number
    autoPauses: number
  }
  resumeLearning: () => void
  requestPause: (reason: string) => void
}

export function FocusAwareControls({ 
  userId, 
  courseId, 
  videoId, 
  onVideoPause, 
  onVideoResume, 
  children 
}: FocusAwareControlsProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [violations, setViolations] = useState({
    tabSwitches: 0,
    faceMissingCount: 0,
    autoPauses: 0
  })
  const [focusActive, setFocusActive] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switched or window minimized
        handleFocusLoss('Tab switch detected')
      } else {
        // Tab regained focus
        handleFocusRegain()
      }
    }

    const handleBlur = () => {
      handleFocusLoss('Window lost focus')
    }

    const handleFocus = () => {
      handleFocusRegain()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Monitor violations and auto-pause if thresholds exceeded
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      // Check if any violation threshold is exceeded
      if (violations.tabSwitches > 10 || violations.faceMissingCount > 10 || violations.autoPauses > 10) {
        handleFocusLoss('Violation threshold exceeded')
      }
    }, 5000) // Check every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [violations])

  const handleFocusLoss = async (reason: string) => {
    if (!focusActive || isPaused) return

    setIsPaused(true)
    setFocusActive(false)
    onVideoPause()

    // Log violation
    const updatedViolations = {
      ...violations,
      tabSwitches: violations.tabSwitches + (reason.includes('Tab') ? 1 : 0),
      autoPauses: violations.autoPauses + 1
    }
    setViolations(updatedViolations)

    // Save alert to Firebase
    if (reason.includes('Tab')) {
      await saveAlertToFirebase(userId, {
        type: 'tab_switch',
        message: 'User switched tabs during video playback',
        courseId,
        videoId
      })
    } else {
      await saveAlertToFirebase(userId, {
        type: 'focus',
        message: `Focus lost: ${reason}`,
        courseId,
        videoId
      })
    }

    console.log(`Learning paused: ${reason}`)
  }

  const handleFocusRegain = () => {
    setFocusActive(true)
    // Don't auto-resume - require user action
  }

  const resumeLearning = () => {
    if (!isPaused) return

    setIsPaused(false)
    onVideoResume()
    console.log('Learning resumed by user')
  }

  const requestPause = (reason: string) => {
    handleFocusLoss(reason)
  }

  const controls: FocusControls = {
    isPaused,
    violations,
    resumeLearning,
    requestPause
  }

  return children(isPaused, controls)
}

export function useVideoValidation() {
  const [validationState, setValidationState] = useState({
    isValid: true,
    watchTime: 0,
    totalDuration: 0,
    violations: {
      tabSwitches: 0,
      faceMissingEvents: 0,
      autoPauses: 0,
      skipCount: 0
    }
  })

  const validateVideoCompletion = () => {
    const { totalDuration, violations } = validationState
    
    // Require at least 90% valid watch time
    const minWatchTime = totalDuration * 0.9
    const isValidWatchTime = validationState.watchTime >= minWatchTime
    
    // Violation thresholds
    const maxTabSwitches = 10
    const maxFaceMissingEvents = 10
    const maxAutoPauses = 10
    const maxSkips = 5 // Limited skipping allowed
    
    const isValid = 
      isValidWatchTime &&
      violations.tabSwitches <= maxTabSwitches &&
      violations.faceMissingEvents <= maxFaceMissingEvents &&
      violations.autoPauses <= maxAutoPauses &&
      violations.skipCount <= maxSkips

    setValidationState(prev => ({ ...prev, isValid }))

    return {
      isValid,
      reasons: [
        !isValidWatchTime ? 'Insufficient watch time (<90%)' : null,
        violations.tabSwitches > maxTabSwitches ? `Too many tab switches (${violations.tabSwitches})` : null,
        violations.faceMissingEvents > maxFaceMissingEvents ? `Too many face-missing events (${violations.faceMissingEvents})` : null,
        violations.autoPauses > maxAutoPauses ? `Too many auto-pauses (${violations.autoPauses})` : null,
        violations.skipCount > maxSkips ? `Too many skips (${violations.skipCount})` : null
      ].filter(Boolean)
    }
  }

  const updateWatchTime = (time: number) => {
    setValidationState(prev => ({ ...prev, watchTime: time }))
  }

  const setVideoDuration = (duration: number) => {
    setValidationState(prev => ({ ...prev, totalDuration: duration }))
  }

  const addViolation = (type: 'tabSwitches' | 'faceMissingEvents' | 'autoPauses' | 'skipCount') => {
    setValidationState(prev => ({
      ...prev,
      violations: {
        ...prev.violations,
        [type]: prev.violations[type] + 1
      }
    }))
  }

  return {
    validationState,
    validateVideoCompletion,
    updateWatchTime,
    setVideoDuration,
    addViolation
  }
}