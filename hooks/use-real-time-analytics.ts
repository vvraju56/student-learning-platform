"use client"

import { useEffect, useState } from "react"
import { realtimeDb } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"

export interface RealTimeAnalytics {
  courseId: string
  totalVideos: number
  completedVideos: number
  progress: number
  lastSyncTime: number
}

export interface RealTimeOverallProgress {
  progress: number
  lastSyncTime: number
}

/**
 * Hook to listen to real-time Firebase updates for course progress
 * Automatically updates dashboard when data syncs
 */
export function useRealTimeCourseAnalytics(userId: string | undefined) {
  const [courseProgress, setCourseProgress] = useState<RealTimeAnalytics[]>([])
  const [overallProgress, setOverallProgress] = useState<RealTimeOverallProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId || !realtimeDb) {
      setIsLoading(false)
      return
    }

    // Listen to all courses progress
    const coursesRef = ref(realtimeDb, `users/${userId}/courses`)
    const coursesUnsubscribe = onValue(
      coursesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const courses: RealTimeAnalytics[] = Object.entries(data).map(
            ([courseId, courseData]: [string, any]) => ({
              courseId,
              totalVideos: courseData.totalVideos || 0,
              completedVideos: courseData.completedVideos || 0,
              progress: courseData.progress || 0,
              lastSyncTime: courseData.lastSyncTime || 0
            })
          )
          setCourseProgress(courses)
        } else {
          setCourseProgress([])
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("Error listening to courses progress:", error)
        setIsLoading(false)
      }
    )

    // Listen to overall progress
    const overallRef = ref(realtimeDb, `users/${userId}/overall`)
    const overallUnsubscribe = onValue(
      overallRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          setOverallProgress({
            progress: data.progress || 0,
            lastSyncTime: data.lastSyncTime || 0
          })
        } else {
          setOverallProgress(null)
        }
      },
      (error) => {
        console.error("Error listening to overall progress:", error)
      }
    )

    // Cleanup listeners on unmount
    return () => {
      off(coursesRef)
      off(overallRef)
    }
  }, [userId])

  return { courseProgress, overallProgress, isLoading }
}

/**
 * Hook to listen to real-time Firebase updates for video analytics
 * Automatically updates dashboard when video data syncs
 */
export function useRealTimeVideoAnalytics(userId: string | undefined) {
  const [videoAnalytics, setVideoAnalytics] = useState<
    Array<{
      videoId: string
      courseId: string
      progress: number
      watchTime: number
      duration: number
      violations: {
        tabSwitches: number
        faceMissingEvents: number
        autoPauses: number
        skipCount: number
      }
      lastSyncTime: number
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId || !realtimeDb) {
      setIsLoading(false)
      return
    }

    // Listen to all videos progress
    const videosRef = ref(realtimeDb, `users/${userId}/videos`)
    const unsubscribe = onValue(
      videosRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const videos: any[] = Object.entries(data).map(([videoKey, videoData]: [string, any]) => {
            const [courseId, videoId] = videoKey.split('_')
            return {
              videoId,
              courseId,
              progress: (videoData.currentTime / (videoData.duration || 1)) * 100,
              watchTime: videoData.watchTime || 0,
              duration: videoData.duration || 0,
              violations: videoData.violations || {
                tabSwitches: 0,
                faceMissingEvents: 0,
                autoPauses: 0,
                skipCount: 0
              },
              lastSyncTime: videoData.lastSyncTime || 0
            }
          })
          setVideoAnalytics(videos)
        } else {
          setVideoAnalytics([])
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("Error listening to video analytics:", error)
        setIsLoading(false)
      }
    )

    // Cleanup listener on unmount
    return () => {
      off(videosRef)
    }
  }, [userId])

  return { videoAnalytics, isLoading }
}
