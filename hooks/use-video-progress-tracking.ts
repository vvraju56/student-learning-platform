"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { auth } from "@/lib/firebase"
import { ref, set, update, get, onValue } from "firebase/database"
import { useVideoMonitoring } from "./use-video-monitoring"

interface VideoProgress {
  courseId: string
  videoId: string
  validWatchTime: number
  totalDuration: number
  completed: boolean
  lastWatchedTime: number
  violations: {
    tabSwitch: number
    faceMissing: number
    autoPause: number
  }
}

interface CourseProgress {
  courseId: string
  totalVideos: number
  completedVideos: number
  progress: number
  quizUnlocked: boolean
  lastUpdated: number
}

interface ProgressTrackingOptions {
  totalDuration: number
  autoSaveInterval?: number // seconds
  onProgressUpdate?: (progress: VideoProgress) => void
  onVideoCompleted?: (videoId: string) => void
  onCourseCompleted?: (courseId: string) => void
}

export function useVideoProgressTracking(
  courseId: string,
  videoId: string,
  options: ProgressTrackingOptions
) {
  const [progress, setProgress] = useState<VideoProgress>({
    courseId,
    videoId,
    validWatchTime: 0,
    totalDuration: options.totalDuration,
    completed: false,
    lastWatchedTime: 0,
    violations: {
      tabSwitch: 0,
      faceMissing: 0,
      autoPause: 0
    }
  })

  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const monitoring = useVideoMonitoring()
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveTime = useRef<number>(0)
  
  const userId = auth.currentUser?.uid
  const autoSaveInterval = options.autoSaveInterval || 30 // Save every 30 seconds by default

  // Firebase paths
  const getVideoPath = () => `users/${userId}/videos/${courseId}_${videoId}`
  const getCoursePath = () => `users/${userId}/courses/${courseId}`

  // Load existing progress from Firebase
  const loadProgress = useCallback(async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      
      // Load video progress
      const videoRef = ref(window.realtimeDb, getVideoPath())
      const videoSnapshot = await get(videoRef)
      
      if (videoSnapshot.exists()) {
        const videoData = videoSnapshot.val()
        setProgress(prev => ({
          ...prev,
          validWatchTime: videoData.validWatchTime || 0,
          completed: videoData.completed || false,
          lastWatchedTime: videoData.lastWatchedTime || 0,
          violations: videoData.violations || {
            tabSwitch: 0,
            faceMissing: 0,
            autoPause: 0
          }
        }))
      }

      // Load course progress
      const courseRef = ref(window.realtimeDb, getCoursePath())
      const courseSnapshot = await get(courseRef)
      
      if (courseSnapshot.exists()) {
        setCourseProgress(courseSnapshot.val())
      }

    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, courseId, videoId])

  // Save video progress to Firebase (Firebase-safe)
  const saveVideoProgress = useCallback(async (force: boolean = false) => {
    if (!userId) return false

    const now = Date.now()
    
    // Rate limiting: Don't save if saved within last 5 seconds unless forced
    if (!force && now - lastSaveTime.current < 5000) {
      return false
    }

    try {
      const videoData = {
        ...progress,
        violations: monitoring.getViolationSummary().violations,
        lastUpdated: now
      }

      await set(ref(window.realtimeDb, getVideoPath()), videoData)
      lastSaveTime.current = now
      
      console.log('✅ Video progress saved')
      options.onProgressUpdate?.(videoData)
      
      return true
    } catch (error) {
      console.error('Error saving video progress:', error)
      return false
    }
  }, [userId, progress, monitoring, courseId, videoId, options])

  // Save course progress to Firebase
  const saveCourseProgress = useCallback(async (updatedCourseProgress: CourseProgress) => {
    if (!userId) return false

    try {
      await set(ref(window.realtimeDb, getCoursePath()), {
        ...updatedCourseProgress,
        lastUpdated: Date.now()
      })
      
      setCourseProgress(updatedCourseProgress)
      
      if (updatedCourseProgress.completedVideos === updatedCourseProgress.totalVideos) {
        options.onCourseCompleted?.(courseId)
      }
      
      return true
    } catch (error) {
      console.error('Error saving course progress:', error)
      return false
    }
  }, [userId, courseId, options])

  // Update valid watch time (called every second while video plays)
  const updateWatchTime = useCallback(() => {
    if (!monitoring.isMonitoringValid) {
      return // Don't count time if monitoring is invalid
    }

    setProgress(prev => {
      const newWatchTime = prev.validWatchTime + 1
      const completionPercentage = (newWatchTime / prev.totalDuration) * 100
      
      return {
        ...prev,
        validWatchTime: newWatchTime,
        lastWatchedTime: Date.now()
      }
    })
  }, [monitoring.isMonitoringValid])

  // Check and update video completion status
  const checkVideoCompletion = useCallback(() => {
    const completionPercentage = (progress.validWatchTime / progress.totalDuration) * 100
    const violations = monitoring.getViolationSummary()
    
    const isCompleted = 
      completionPercentage >= 90 && // 90% of video watched
      violations.tabSwitch <= 10 &&
      violations.faceMissing <= 10 &&
      violations.autoPause <= 10

    if (isCompleted && !progress.completed) {
      setProgress(prev => ({ ...prev, completed: true }))
      options.onVideoCompleted?.(videoId)
      
      // Save completion immediately
      saveVideoProgress(true)
    }
    
    return isCompleted
  }, [progress, monitoring, videoId, options, saveVideoProgress])

  // Update course progress when video completes
  const updateCourseProgress = useCallback(async () => {
    if (!courseProgress || !userId) return

    try {
      // Get all completed videos for this course
      const videosRef = ref(window.realtimeDb, `users/${userId}/videos`)
      const snapshot = await get(videosRef)
      
      let completedVideos = 0
      if (snapshot.exists()) {
        const videos = snapshot.val()
        Object.values(videos).forEach((video: any) => {
          if (video.courseId === courseId && video.completed) {
            completedVideos++
          }
        })
      }

      const newProgress = {
        ...courseProgress,
        completedVideos,
        progress: Math.round((completedVideos / courseProgress.totalVideos) * 100),
        quizUnlocked: completedVideos === courseProgress.totalVideos
      }

      await saveCourseProgress(newProgress)
      
    } catch (error) {
      console.error('Error updating course progress:', error)
    }
  }, [courseProgress, courseId, userId, saveCourseProgress])

  // Start progress tracking
  const startTracking = useCallback(async () => {
    if (!userId || !monitoring.startMonitoring()) {
      console.error('Cannot start tracking: Monitoring failed to start')
      return false
    }

    // Update watch time every second
    progressIntervalRef.current = setInterval(() => {
      updateWatchTime()
      checkVideoCompletion()
    }, 1000)

    // Auto-save every 30 seconds
    autoSaveIntervalRef.current = setInterval(() => {
      saveVideoProgress()
    }, autoSaveInterval * 1000)

    return true
  }, [userId, monitoring, updateWatchTime, checkVideoCompletion, saveVideoProgress, autoSaveInterval])

  // Stop progress tracking
  const stopTracking = useCallback(() => {
    monitoring.stopMonitoring()
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
      autoSaveIntervalRef.current = null
    }
    
    // Save final progress
    saveVideoProgress(true)
  }, [monitoring, saveVideoProgress])

  // Pause video due to monitoring violation
  const pauseForViolation = useCallback(() => {
    monitoring.trackAutoPause()
    stopTracking()
    
    // Optionally restart after a delay
    setTimeout(() => {
      if (monitoring.isMonitoringValid) {
        startTracking()
      }
    }, 3000)
  }, [monitoring, startTracking, stopTracking])

  // Load progress on mount
  useEffect(() => {
    if (userId) {
      loadProgress()
    }
  }, [userId, loadProgress])

  // Update course progress when video completes
  useEffect(() => {
    if (progress.completed) {
      updateCourseProgress()
    }
  }, [progress.completed, updateCourseProgress])

  // Real-time course progress listener
  useEffect(() => {
    if (!userId) return

    const courseRef = ref(window.realtimeDb, getCoursePath())
    const unsubscribe = onValue(courseRef, (snapshot) => {
      if (snapshot.exists()) {
        setCourseProgress(snapshot.val())
      }
    })

    return () => unsubscribe()
  }, [userId, courseId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [stopTracking])

  return {
    progress,
    courseProgress,
    isLoading,
    monitoring,
    startTracking,
    stopTracking,
    pauseForViolation,
    saveVideoProgress,
    isVideoCompleted: progress.completed,
    completionPercentage: Math.round((progress.validWatchTime / progress.totalDuration) * 100),
    violations: monitoring.getViolationSummary(),
    canCompleteVideo: monitoring.canCompleteVideo()
  }
}