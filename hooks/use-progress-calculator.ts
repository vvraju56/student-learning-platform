"use client"

import { useState, useEffect } from "react"
import { getDatabase, ref, onValue, set, update, get } from "firebase/database"
import { realtimeDb, saveCourseProgressToFirebase, saveOverallProgressToFirebase } from "../lib/firebase"

export interface CourseProgress {
  progress: number
  completedVideos: number
  totalVideos: number
  lastUpdated: number
}

export interface OverallProgress {
  webDevelopment: number
  appDevelopment: number
  gameDevelopment: number
  overall: number
  lastUpdated: number
}

export function useProgressCalculator(userId: string) {
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({})
  const [overallProgress, setOverallProgress] = useState<OverallProgress>({
    webDevelopment: 0,
    appDevelopment: 0,
    gameDevelopment: 0,
    overall: 0,
    lastUpdated: Date.now()
  })

  // Listen to course progress changes
  useEffect(() => {
    if (!userId || !realtimeDb) return

    const progressRef = ref(realtimeDb, `users/${userId}/learning/courses`)
    const unsubscribe = onValue(progressRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setCourseProgress(data)
        calculateOverallProgress(data)
      }
    })

    return unsubscribe
  }, [userId])

  const calculateOverallProgress = (courses: Record<string, CourseProgress>) => {
    const courseIds = Object.keys(courses)
    if (courseIds.length === 0) return

    let totalProgress = 0
    let webProgress = 0
    let appProgress = 0
    let gameProgress = 0

    courseIds.forEach(courseId => {
      const course = courses[courseId]
      totalProgress += course.progress || 0

      if (courseId === 'webDevelopment') webProgress = course.progress || 0
      if (courseId === 'appDevelopment') appProgress = course.progress || 0
      if (courseId === 'gameDevelopment') gameProgress = course.progress || 0
    })

    const averageProgress = totalProgress / courseIds.length

    const newOverallProgress: OverallProgress = {
      webDevelopment: webProgress,
      appDevelopment: appProgress,
      gameDevelopment: gameProgress,
      overall: averageProgress,
      lastUpdated: Date.now()
    }

    setOverallProgress(newOverallProgress)
    saveOverallProgressToFirebase(userId, averageProgress, courses)
  }

  const updateVideoProgress = async (courseId: string, videoId: string, progress: number, duration: number) => {
    if (!userId || !realtimeDb) return

    try {
      const videoRef = ref(realtimeDb, `users/${userId}/learning/courses/${courseId}/videos/${videoId}`)
      
      // Update video progress
      await set(videoRef, {
        progress: progress,
        lastWatchedTime: Math.floor((progress / 100) * duration),
        duration: duration,
        completed: progress >= 90, // Require 90% for completion
        lastUpdated: Date.now(),
        validWatchTime: Math.floor((progress / 100) * duration),
        violations: 0 // This would be updated by monitoring system
      })

      // Recalculate course progress
      await recalculateCourseProgress(courseId)
    } catch (error) {
      console.error('Error updating video progress:', error)
    }
  }

  const recalculateCourseProgress = async (courseId: string) => {
    if (!userId || !realtimeDb) return

    try {
      const courseRef = ref(realtimeDb, `users/${userId}/learning/courses/${courseId}`)
      const videosRef = ref(realtimeDb, `users/${userId}/learning/courses/${courseId}/videos`)
      
      const videosSnapshot = await get(videosRef)
      const videos = videosSnapshot.val()
      
      if (!videos) return

      const videoIds = Object.keys(videos)
      const totalVideos = 10 // Expected total videos per course
      let completedVideos = 0
      let totalProgress = 0

      videoIds.forEach(videoId => {
        const video = videos[videoId]
        if (video.completed) {
          completedVideos++
        }
        totalProgress += video.progress || 0
      })

      const courseProgressValue = totalVideos > 0 ? (totalProgress / totalVideos) : 0

      await set(courseRef, {
        progress: courseProgressValue,
        completedVideos: completedVideos,
        totalVideos: totalVideos,
        lastUpdated: Date.now(),
        videos: videos
      })

    } catch (error) {
      console.error('Error recalculating course progress:', error)
    }
  }

  const getContinueLearningData = async () => {
    if (!userId || !realtimeDb) return null

    try {
      const currentRef = ref(realtimeDb, `users/${userId}/learning/current`)
      const snapshot = await get(currentRef)
      return snapshot.val()
    } catch (error) {
      console.error('Error getting continue learning data:', error)
      return null
    }
  }

  // ✅ THROTTLED PROGRESS SAVER (30-second intervals)
  let lastProgressSave = 0
  const progressSaveInterval = 30000 // 30 seconds

  const saveContinueLearningData = async (courseId: string, videoId: string, lastWatchedTime: number) => {
    if (!userId || !realtimeDb) return

    const now = Date.now()
    
    // ✅ THROTTLE: Save only every 30 seconds
    if (now - lastProgressSave < progressSaveInterval) {
      console.log('⏸️ Progress save throttled (30-sec interval)')
      return
    }

    try {
      await set(ref(realtimeDb, `users/${userId}/learning/current`), {
        courseId,
        videoId,
        lastWatchedTime,
        timestamp: now
      })
      
      console.log('💾 Continue learning saved to Firebase')
      lastProgressSave = now
    } catch (error) {
      console.error('Error saving continue learning data:', error)
    }
  }

  // ✅ FORCE SAVE (for video completion)
  const forceSaveContinueLearning = async (courseId: string, videoId: string, lastWatchedTime: number) => {
    if (!userId || !realtimeDb) return

    try {
      await set(ref(realtimeDb, `users/${userId}/learning/current`), {
        courseId,
        videoId,
        lastWatchedTime,
        timestamp: Date.now(),
        forceSave: true
      })
      
      console.log('💪 Continue learning force saved to Firebase')
      lastProgressSave = Date.now() // Reset throttle
    } catch (error) {
      console.error('Error force saving continue learning data:', error)
    }
  }

  return {
    getUserProgress,
    saveContinueLearningData,
    forceSaveContinueLearning,
    getContinueLearningData,
    clearContinueLearningData
  }
}