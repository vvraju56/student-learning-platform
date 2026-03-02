"use client"

import { ref, set, update, get } from "firebase/database"
import { realtimeDb } from "@/lib/firebase"

export interface OldCourseProgress {
  progress: number
  completedVideos: number
  totalVideos: number
}

export interface MigrationResult {
  success: boolean
  migratedCourses: number
  totalVideos: number
  completedVideos: number
  timestamp: number
}

export class DataMigrationService {
  /**
   * Migrate old localStorage and Firebase data to new sync format
   */
  async migrateOldData(
    userId: string,
    courseProgressMap: { [courseId: string]: OldCourseProgress }
  ): Promise<MigrationResult> {
    if (!realtimeDb) throw new Error("Firebase not initialized")

    try {
      let totalVideos = 0
      let completedVideos = 0
      let migratedCourses = 0

      // For each course, create video entries for completed videos
      for (const [courseId, courseData] of Object.entries(courseProgressMap)) {
        totalVideos += courseData.totalVideos
        completedVideos += courseData.completedVideos

        // Create video progress entries for this course
        for (let i = 0; i < courseData.totalVideos; i++) {
          const videoId = `video-${i + 1}`
          const isCompleted = i < courseData.completedVideos
          const videoKey = `${courseId}_${videoId}`

          const videoPath = `users/${userId}/videos/${videoKey}`
          const videoRef = ref(realtimeDb, videoPath)

          const videoData = {
            courseId,
            videoId,
            currentTime: isCompleted ? 1200 : 0, // Assume 20 min videos
            duration: 1200,
            isPlaying: false,
            watchTime: isCompleted ? 1200 : 0,
            violations: {
              tabSwitches: 0,
              faceMissingEvents: 0,
              autoPauses: 0,
              skipCount: 0
            },
            lastSyncTime: Date.now(),
            completed: isCompleted,
            migratedAt: new Date().toISOString()
          }

          await set(videoRef, videoData)
        }

        migratedCourses++
      }

      // Update course progress
      const coursePath = `users/${userId}/courses`
      const courseRef = ref(realtimeDb, coursePath)
      const coursesData: { [courseId: string]: any } = {}

      for (const [courseId, courseData] of Object.entries(courseProgressMap)) {
        coursesData[courseId] = {
          courseId,
          totalVideos: courseData.totalVideos,
          completedVideos: courseData.completedVideos,
          progress: courseData.progress,
          quizUnlocked: courseData.progress >= 80,
          lastUpdated: Date.now(),
          migratedAt: new Date().toISOString()
        }
      }

      await set(courseRef, coursesData)

      // Update overall progress
      const overallProgress = Math.round(
        totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0
      )

      const overallPath = `users/${userId}/overall`
      const overallRef = ref(realtimeDb, overallPath)

      await set(overallRef, {
        overallProgress,
        totalCourses: Object.keys(courseProgressMap).length,
        completedCourses: Object.values(courseProgressMap).filter(
          (c) => c.progress === 100
        ).length,
        totalVideos,
        completedVideos,
        lastUpdated: Date.now(),
        migratedAt: new Date().toISOString()
      })

      return {
        success: true,
        migratedCourses,
        totalVideos,
        completedVideos,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error("Error during migration:", error)
      return {
        success: false,
        migratedCourses: 0,
        totalVideos: 0,
        completedVideos: 0,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Get old data from localStorage
   */
  getOldLocalStorageData(courseIds: string[]): {
    [courseId: string]: OldCourseProgress
  } {
    const result: { [courseId: string]: OldCourseProgress } = {}

    for (const courseId of courseIds) {
      const localStorageKey = `course_progress_${courseId}`
      const localData = localStorage.getItem(localStorageKey)

      if (localData) {
        try {
          const parsed = JSON.parse(localData)
          const completedVideos = Array.isArray(parsed.completedVideos)
            ? parsed.completedVideos.length
            : parsed.completedVideos || 0
          const totalVideos = parsed.totalVideos || 10

          result[courseId] = {
            progress: (completedVideos / totalVideos) * 100,
            completedVideos,
            totalVideos
          }
        } catch (e) {
          console.error(`Error parsing localStorage for ${courseId}:`, e)
        }
      }
    }

    return result
  }

  /**
   * Check if migration is needed
   */
  isMigrationNeeded(userId: string): boolean {
    // Check if user has data in Firebase's new format
    // If not, check localStorage
    const hasLocalData = localStorage.getItem("course_progress_web-development") ||
      localStorage.getItem("course_progress_app-development") ||
      localStorage.getItem("course_progress_game-development")

    return !!hasLocalData
  }

  /**
   * Clear old localStorage data after successful migration
   */
  clearOldLocalStorageData(courseIds: string[]): void {
    for (const courseId of courseIds) {
      localStorage.removeItem(`course_progress_${courseId}`)
    }
    console.log("✅ Old localStorage data cleared")
  }
}

export const dataMigrationService = new DataMigrationService()
