"use client"

import { useState, useEffect } from "react"
import { videoSyncService } from "@/services/video-sync-service"

export function useVideoAnalytics() {
  const [stats, setStats] = useState({
    totalVideosTracked: 0,
    averageProgress: 0,
    totalWatchTime: 0,
    lastSyncTime: 0
  })

  const [courseAnalytics, setCourseAnalytics] = useState<any[]>([])

  useEffect(() => {
    // Update immediately
    const newStats = videoSyncService.getSummaryStats()
    setStats(newStats)
    const analytics = videoSyncService.getLocalAnalytics()
    setCourseAnalytics(analytics)

    // Then update every 10 seconds
    const interval = setInterval(() => {
      const newStats = videoSyncService.getSummaryStats()
      setStats(newStats)
      const analytics = videoSyncService.getLocalAnalytics()
      setCourseAnalytics(analytics)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return {
    stats,
    courseAnalytics,
    getCourseAnalytics: (courseId: string) => courseAnalytics.filter(a => a.courseId === courseId)
  }
}
