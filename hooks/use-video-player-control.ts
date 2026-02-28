"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface VideoValidationRules {
  maxTabSwitches: number
  maxFaceMissingEvents: number
  maxAutoPauses: number
  maxSkips: number
  minWatchTimePercentage: number
}

interface VideoMetrics {
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
}

interface VideoPlayerControlHook {
  // Video state
  isPlaying: boolean
  currentTime: number
  duration: number
  metrics: VideoMetrics
  
  // Video controls
  playVideo: () => void
  pauseVideo: () => void
  seekVideo: (time: number) => void
  skipForward: (seconds?: number) => void
  skipBackward: (seconds?: number) => void
  
  // YouTube iframe control
  setIframeRef: (iframe: HTMLIFrameElement | null) => void
  
  // Validation
  validateVideoCompletion: () => { isValid: boolean; reasons: string[] }
  resetMetrics: () => void
  addViolation: (type: keyof VideoMetrics['violations']) => void
}

const DEFAULT_RULES: VideoValidationRules = {
  maxTabSwitches: 10,
  maxFaceMissingEvents: 10,
  maxAutoPauses: 10,
  maxSkips: 5,
  minWatchTimePercentage: 0.9
}

export function useVideoPlayerControl(
  courseId: string,
  videoId: string,
  rules: Partial<VideoValidationRules> = {}
): VideoPlayerControlHook {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const validationRules = { ...DEFAULT_RULES, ...rules }
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [metrics, setMetrics] = useState<VideoMetrics>({
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
    isCompleted: false
  })

  // YouTube iframe API setup
  const setupYouTubePlayer = useCallback(() => {
    if (!iframeRef.current) return

    // Load YouTube IFrame API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      if (firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      }
    }

    // Initialize YouTube player
    const initPlayer = () => {
      if (!iframeRef.current) return
      
      playerRef.current = new (window as any).YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            console.log('🎬 YouTube player ready')
            setDuration(event.target.getDuration())
            setMetrics(prev => ({ ...prev, totalDuration: event.target.getDuration() }))
          },
          onStateChange: (event: any) => {
            const playerState = event.data
            switch (playerState) {
              case (window as any).YT.PlayerState.PLAYING:
                setIsPlaying(true)
                console.log('▶️ Video playing')
                break
              case (window as any).YT.PlayerState.PAUSED:
                setIsPlaying(false)
                console.log('⏸️ Video paused')
                break
              case (window as any).YT.PlayerState.ENDED:
                handleVideoEnd()
                break
            }
          },
          onTimeUpdate: () => {
            if (playerRef.current) {
              const time = playerRef.current.getCurrentTime()
              setCurrentTime(time)
              
              // Update watch time only when playing and valid
              if (isPlaying && metrics.isValid) {
                setMetrics(prev => ({ ...prev, watchTime: prev.watchTime + 1 }))
              }
            }
          }
        }
      })
    }

    // Wait for YouTube API to be ready
    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer()
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer
    }
  }, [isPlaying, metrics.isValid])

  // Video control functions
  const playVideo = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.playVideo()
      setIsPlaying(true)
    } else {
      // Fallback for non-YouTube videos
      sendPostMessage('play')
      setIsPlaying(true)
    }
  }, [])

  const pauseVideo = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo()
      setIsPlaying(false)
    } else {
      // Fallback for non-YouTube videos
      sendPostMessage('pause')
      setIsPlaying(false)
    }
  }, [])

  const seekVideo = useCallback((time: number) => {
    const previousTime = currentTime
    const timeDifference = Math.abs(time - previousTime)
    
    if (timeDifference > 5) { // Skip threshold of 5 seconds
      setMetrics(prev => ({
        ...prev,
        violations: {
          ...prev.violations,
          skipCount: prev.violations.skipCount + 1,
          skippedTime: prev.violations.skippedTime + timeDifference
        }
      }))
      console.log(`⏭️ Skip detected: ${timeDifference.toFixed(1)}s`)
    }
    
    if (playerRef.current) {
      playerRef.current.seekTo(time, true)
    } else {
      // Fallback for non-YouTube videos
      sendPostMessage('seek', time)
    }
    
    setCurrentTime(time)
  }, [currentTime])

  const skipForward = useCallback((seconds = 10) => {
    const newTime = Math.min(currentTime + seconds, duration)
    seekVideo(newTime)
  }, [currentTime, duration, seekVideo])

  const skipBackward = useCallback((seconds = 10) => {
    const newTime = Math.max(currentTime - seconds, 0)
    seekVideo(newTime)
  }, [currentTime, seekVideo])

  // Helper function for postMessage communication
  const sendPostMessage = useCallback((command: string, time?: number) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const message = time !== undefined 
        ? `{"event":"command","func":"${command}","args":[${time}]}`
        : `{"event":"command","func":"${command}","args":""}`
      
      iframeRef.current.contentWindow.postMessage(message, '*')
    }
  }, [])

  // Handle video completion
  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false)
    console.log('🏁 Video ended - validating completion')
    
    const validation = validateVideoCompletion()
    setMetrics(prev => ({ ...prev, isCompleted: validation.isValid }))
    
    if (validation.isValid) {
      console.log('✅ Video completed successfully')
      // Trigger auto-next video event
      window.dispatchEvent(new CustomEvent('videoCompleted', {
        detail: { courseId, videoId, metrics }
      }))
    } else {
      console.log('❌ Video completion invalid:', validation.reasons)
      // Trigger rewatch required event
      window.dispatchEvent(new CustomEvent('videoInvalid', {
        detail: { courseId, videoId, reasons: validation.reasons }
      }))
    }
  }, [courseId, videoId])

  // Validate video completion
  const validateVideoCompletion = useCallback((): { isValid: boolean; reasons: string[] } => {
    const { violations, totalDuration, watchTime } = metrics
    const reasons: string[] = []
    
    // Check minimum watch time (90% of video)
    const minWatchTime = totalDuration * validationRules.minWatchTimePercentage
    if (watchTime < minWatchTime) {
      reasons.push(`Insufficient watch time (${Math.round(watchTime)}s / ${Math.round(minWatchTime)}s required)`)
    }
    
    // Check violation thresholds
    if (violations.tabSwitches > validationRules.maxTabSwitches) {
      reasons.push(`Too many tab switches (${violations.tabSwitches} > ${validationRules.maxTabSwitches})`)
    }
    
    if (violations.faceMissingEvents > validationRules.maxFaceMissingEvents) {
      reasons.push(`Too many face-missing events (${violations.faceMissingEvents} > ${validationRules.maxFaceMissingEvents})`)
    }
    
    if (violations.autoPauses > validationRules.maxAutoPauses) {
      reasons.push(`Too many auto-pauses (${violations.autoPauses} > ${validationRules.maxAutoPauses})`)
    }
    
    if (violations.skipCount > validationRules.maxSkips) {
      reasons.push(`Too many skips (${violations.skipCount} > ${validationRules.maxSkips})`)
    }
    
    // Check skipped time percentage
    const skippedTimePercentage = totalDuration > 0 ? violations.skippedTime / totalDuration : 0
    if (skippedTimePercentage > 0.1) { // 10% threshold
      reasons.push(`Too much skipped time (${Math.round(skippedTimePercentage * 100)}% > 10%)`)
    }
    
    const isValid = reasons.length === 0
    setMetrics(prev => ({ ...prev, isValid }))
    
    return { isValid, reasons }
  }, [metrics, validationRules])

  // Add violation
  const addViolation = useCallback((type: keyof VideoMetrics['violations']) => {
    setMetrics(prev => ({
      ...prev,
      violations: {
        ...prev.violations,
        [type]: prev.violations[type] + 1
      }
    }))
    
    // Auto-pause on certain violations
    if (type === 'autoPauses') {
      pauseVideo()
    }
  }, [pauseVideo])

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      watchTime: 0,
      totalDuration: duration,
      violations: {
        tabSwitches: 0,
        faceMissingEvents: 0,
        autoPauses: 0,
        skipCount: 0,
        skippedTime: 0
      },
      isValid: true,
      isCompleted: false
    })
  }, [duration])

  // Set iframe reference
  const setIframeRef = useCallback((iframe: HTMLIFrameElement | null) => {
    iframeRef.current = iframe
    if (iframe) {
      setupYouTubePlayer()
    }
  }, [setupYouTubePlayer])

  // Time tracking interval
  useEffect(() => {
    if (isPlaying && metrics.isValid) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          const time = playerRef.current.getCurrentTime()
          setCurrentTime(time)
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, metrics.isValid])

  return {
    isPlaying,
    currentTime,
    duration,
    metrics,
    playVideo,
    pauseVideo,
    seekVideo,
    skipForward,
    skipBackward,
    setIframeRef,
    validateVideoCompletion,
    resetMetrics,
    addViolation
  }
}