"use client"

import { realtimeDb } from "@/lib/firebase"
import { ref, update, set, get } from "firebase/database"

export interface VideoSyncData {
  courseId: string
  videoId: string
  userId: string
  currentTime: number
  duration: number
  isPlaying: boolean
  lastSyncTime: number
  watchTime: number
  violations: {
    tabSwitches: number
    faceMissingEvents: number
    autoPauses: number
    skipCount: number
  }
}

// Local storage for dashboard without heavy Firebase reads
interface LocalAnalytics {
  videoId: string
  courseId: string
  progress: number
  watchTime: number
  duration: number
  violations: VideoSyncData['violations']
  lastSyncTime: number
}

export class VideoSyncService {
  private syncIntervalMs = 5 * 60 * 1000 // 5 minutes
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()
  private pendingData: Map<string, VideoSyncData> = new Map()
  private localAnalytics: Map<string, LocalAnalytics> = new Map()

  /**
   * Start syncing video progress at 5-minute intervals
   */
  startSync(
    videoKey: string,
    userId: string,
    courseId: string,
    videoId: string,
    onSync?: (data: VideoSyncData) => Promise<void>
  ): void {
    // Clear existing interval if any
    if (this.syncIntervals.has(videoKey)) {
      clearInterval(this.syncIntervals.get(videoKey))
    }

    // Set up periodic sync
    const interval = setInterval(async () => {
      const data = this.pendingData.get(videoKey)
      if (data) {
        try {
          await this.syncToFirebase(userId, videoKey, data)
          if (onSync) {
            await onSync(data)
          }
        } catch (error) {
          console.error(`Error syncing video ${videoKey}:`, error)
        }
      }
    }, this.syncIntervalMs)

    this.syncIntervals.set(videoKey, interval)
  }

  /**
   * Stop syncing for a specific video
   */
  stopSync(videoKey: string): void {
    if (this.syncIntervals.has(videoKey)) {
      clearInterval(this.syncIntervals.get(videoKey))
      this.syncIntervals.delete(videoKey)
    }
  }

  /**
   * Update pending sync data
   */
  updatePendingData(videoKey: string, data: Partial<VideoSyncData>): void {
    const existing = this.pendingData.get(videoKey) || {
      courseId: data.courseId || '',
      videoId: data.videoId || '',
      userId: data.userId || '',
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      lastSyncTime: 0,
      watchTime: 0,
      violations: {
        tabSwitches: 0,
        faceMissingEvents: 0,
        autoPauses: 0,
        skipCount: 0
      }
    }

    const updated = {
      ...existing,
      ...data,
      violations: {
        ...existing.violations,
        ...data.violations
      }
    }

    this.pendingData.set(videoKey, updated)
  }

  /**
   * Manually trigger sync immediately
   */
  async syncNow(userId: string, videoKey: string): Promise<boolean> {
    const data = this.pendingData.get(videoKey)
    if (!data) return false

    try {
      await this.syncToFirebase(userId, videoKey, data)
      return true
    } catch (error) {
      console.error(`Error syncing video ${videoKey}:`, error)
      return false
    }
  }

  /**
   * Sync data to Firebase Realtime Database (Optimized for free tier)
   * Only syncs essential data and uses batch writes
   */
  private async syncToFirebase(
    userId: string,
    videoKey: string,
    data: VideoSyncData
  ): Promise<void> {
    if (!realtimeDb) throw new Error('Firebase not initialized')

    const videoPath = `users/${userId}/videos/${videoKey}`
    const videoRef = ref(realtimeDb, videoPath)

    // Minimize data being sent - only essential fields
    const syncData = {
      currentTime: data.currentTime,
      duration: data.duration,
      watchTime: data.watchTime,
      violations: data.violations,
      lastSyncTime: Date.now()
      // Don't sync isPlaying, userId, courseId, videoId (already in path)
    }

    try {
      // Batch write - single operation instead of multiple
      await update(videoRef, syncData)

      // Store locally for dashboard
      this.localAnalytics.set(videoKey, {
        videoId: data.videoId,
        courseId: data.courseId,
        progress: (data.currentTime / data.duration) * 100,
        watchTime: data.watchTime,
        duration: data.duration,
        violations: data.violations,
        lastSyncTime: Date.now()
      })

      console.log(`✅ Video progress synced: ${videoKey}`)
    } catch (error) {
      console.error(`Error syncing to Firebase:`, error)
      // Don't throw - fail silently on free tier quota exceeded
    }
  }

  /**
   * Get current pending data for a video
   */
  getPendingData(videoKey: string): VideoSyncData | undefined {
    return this.pendingData.get(videoKey)
  }

  /**
   * Clear pending data for a video
   */
  clearPendingData(videoKey: string): void {
    this.pendingData.delete(videoKey)
  }

  /**
   * Stop all syncs and cleanup
   */
  cleanup(): void {
    this.syncIntervals.forEach((interval) => clearInterval(interval))
    this.syncIntervals.clear()
    this.pendingData.clear()
  }

  /**
   * Get local analytics for dashboard (no Firebase read)
   */
  getLocalAnalytics(): LocalAnalytics[] {
    return Array.from(this.localAnalytics.values())
  }

  /**
   * Get analytics for specific course (no Firebase read)
   */
  getCourseAnalytics(courseId: string): LocalAnalytics[] {
    return Array.from(this.localAnalytics.values()).filter(
      (a) => a.courseId === courseId
    )
  }

  /**
   * Get summary stats (no Firebase read)
   */
  getSummaryStats(): {
    totalVideosTracked: number
    averageProgress: number
    totalWatchTime: number
    lastSyncTime: number
  } {
    const analytics = Array.from(this.localAnalytics.values())
    
    return {
      totalVideosTracked: analytics.length,
      averageProgress:
        analytics.length > 0
          ? Math.round(
              analytics.reduce((sum, a) => sum + a.progress, 0) /
                analytics.length
            )
          : 0,
      totalWatchTime: analytics.reduce((sum, a) => sum + a.watchTime, 0),
      lastSyncTime: analytics.length > 0
        ? Math.max(...analytics.map(a => a.lastSyncTime))
        : 0
    }
  }

  /**
   * Get course progress from Firebase (reads from DB)
   * Returns course metadata and completion stats
   */
  async getCourseProgress(userId: string, courseId: string): Promise<{
    courseId: string
    totalVideos: number
    completedVideos: number
    progress: number
  } | null> {
    if (!realtimeDb) return null

    try {
      const courseRef = ref(realtimeDb, `users/${userId}/courses/${courseId}`)
      const snapshot = await get(courseRef)

      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.val()
      return {
        courseId,
        totalVideos: data.totalVideos || 0,
        completedVideos: data.completedVideos || 0,
        progress: data.progress || 0
      }
    } catch (error) {
      console.error(`Error reading course progress for ${courseId}:`, error)
      return null
    }
  }

  /**
   * Get all courses progress from Firebase
   */
  async getAllCoursesProgress(userId: string): Promise<Array<{
    courseId: string
    totalVideos: number
    completedVideos: number
    progress: number
  }>> {
    if (!realtimeDb) return []

    try {
      const coursesRef = ref(realtimeDb, `users/${userId}/courses`)
      const snapshot = await get(coursesRef)

      if (!snapshot.exists()) {
        return []
      }

      const data = snapshot.val()
      return Object.entries(data).map(([courseId, courseData]: [string, any]) => ({
        courseId,
        totalVideos: courseData.totalVideos || 0,
        completedVideos: courseData.completedVideos || 0,
        progress: courseData.progress || 0
      }))
    } catch (error) {
      console.error(`Error reading all courses progress:`, error)
      return []
    }
  }

  /**
   * Get overall progress from Firebase
   */
  async getOverallProgress(userId: string): Promise<number> {
    if (!realtimeDb) return 0

    try {
      const overallRef = ref(realtimeDb, `users/${userId}/overall`)
      const snapshot = await get(overallRef)

      if (!snapshot.exists()) {
        return 0
      }

      const data = snapshot.val()
      return data.progress || 0
    } catch (error) {
      console.error(`Error reading overall progress:`, error)
      return 0
    }
  }
}

export const videoSyncService = new VideoSyncService()
