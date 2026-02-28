"use client"

import { ref, get } from "firebase/database"
import { realtimeDb } from "@/lib/firebase"

export interface VideoProgressReport {
  videoId: string
  videoTitle: string
  courseId: string
  courseName: string
  progress: number // 0-100
  watchTime: number // in seconds
  totalDuration: number // in seconds
  completionPercentage: number
  isCompleted: boolean
  violations: {
    tabSwitches: number
    faceMissingEvents: number
    autoPauses: number
    skipCount: number
  }
  lastWatchedTime: number // timestamp
  lastWatchedAt: string // ISO string
  estimatedTimeRemaining: number // in seconds
}

export interface CourseReport {
  courseId: string
  courseName: string
  totalVideos: number
  completedVideos: number
  overallProgress: number // 0-100
  totalWatchTime: number // in seconds
  averageWatchTimePerVideo: number
  averageCompletionPercentage: number
  totalViolations: number
  estimatedTimeRemaining: number
  videos: VideoProgressReport[]
  generatedAt: string
  estimatedCompletionDate?: string
}

export interface UserAnalytics {
  userId: string
  totalCourses: number
  completedCourses: number
  totalVideos: number
  completedVideos: number
  overallProgress: number
  totalWatchTime: number // in seconds
  totalFocusTime: number // in seconds
  focusScore: number // 0-100
  averageTabSwitches: number
  averageFaceMissingEvents: number
  averageAutoPauses: number
  generatedAt: string
}

export class ReportService {
  /**
   * Generate a detailed report for a single course
   */
  async generateCourseReport(
    userId: string,
    courseId: string,
    courseName: string
  ): Promise<CourseReport> {
    if (!realtimeDb) throw new Error("Firebase not initialized")

    try {
      // Fetch course videos progress
      const videosRef = ref(realtimeDb, `users/${userId}/videos`)
      const videosSnapshot = await get(videosRef)
      const allVideos = videosSnapshot.exists() ? videosSnapshot.val() : {}

      // Filter videos for this course
      const courseVideos = Object.entries(allVideos)
        .filter(([_, video]: any) => video.courseId === courseId)
        .map(([key, video]: any) => ({
          ...video,
          key
        }))

      // Generate individual video reports
      const videoReports: VideoProgressReport[] = courseVideos.map(
        (video: any) => {
          const completion = Math.round(
            ((video.currentTime || video.watchTime || 0) / video.duration) * 100
          )
          const estimatedRemaining = Math.max(
            0,
            (video.duration || 0) - (video.currentTime || video.watchTime || 0)
          )

          return {
            videoId: video.videoId,
            videoTitle: `Video ${video.videoId}`,
            courseId: video.courseId,
            courseName,
            progress: video.currentTime || video.watchTime || 0,
            watchTime: video.watchTime || 0,
            totalDuration: video.duration || 0,
            completionPercentage: completion,
            isCompleted: completion >= 80, // 80% watched = completed
            violations: video.violations || {
              tabSwitches: 0,
              faceMissingEvents: 0,
              autoPauses: 0,
              skipCount: 0
            },
            lastWatchedTime: video.lastSyncTime || video.lastUpdated || 0,
            lastWatchedAt: new Date(
              video.lastSyncTime || video.lastUpdated || 0
            ).toISOString(),
            estimatedTimeRemaining: estimatedRemaining
          }
        }
      )

      // Calculate aggregated metrics
      const totalVideos = videoReports.length
      const completedVideos = videoReports.filter(
        (v) => v.isCompleted
      ).length
      const overallProgress = Math.round(
        (completedVideos / Math.max(1, totalVideos)) * 100
      )
      const totalWatchTime = videoReports.reduce(
        (sum, v) => sum + (v.watchTime || 0),
        0
      )
      const averageWatchTimePerVideo =
        totalVideos > 0 ? totalWatchTime / totalVideos : 0
      const averageCompletionPercentage =
        videoReports.length > 0
          ? Math.round(
              videoReports.reduce((sum, v) => sum + v.completionPercentage, 0) /
                videoReports.length
            )
          : 0

      const totalViolations = videoReports.reduce(
        (sum, v) =>
          sum +
          v.violations.tabSwitches +
          v.violations.faceMissingEvents +
          v.violations.autoPauses +
          v.violations.skipCount,
        0
      )

      const estimatedTimeRemaining = videoReports.reduce(
        (sum, v) => sum + v.estimatedTimeRemaining,
        0
      )

      // Estimate completion date
      const avgTimePerVideo =
        totalVideos > 0 ? totalWatchTime / totalVideos : 0
      const avgSecondsPerDay = 3600 // Assume 1 hour per day
      const remainingVideos = totalVideos - completedVideos
      const estimatedDays = Math.ceil(
        (remainingVideos * avgTimePerVideo) / avgSecondsPerDay
      )
      const estimatedCompletionDate = new Date()
      estimatedCompletionDate.setDate(
        estimatedCompletionDate.getDate() + estimatedDays
      )

      return {
        courseId,
        courseName,
        totalVideos,
        completedVideos,
        overallProgress,
        totalWatchTime,
        averageWatchTimePerVideo,
        averageCompletionPercentage,
        totalViolations,
        estimatedTimeRemaining,
        videos: videoReports,
        generatedAt: new Date().toISOString(),
        estimatedCompletionDate: estimatedCompletionDate.toISOString()
      }
    } catch (error) {
      console.error(`Error generating course report for ${courseId}:`, error)
      throw error
    }
  }

  /**
   * Generate reports for all courses
   */
  async generateAllCourseReports(
    userId: string,
    courseNames: { [courseId: string]: string }
  ): Promise<CourseReport[]> {
    try {
      const courseIds = Object.keys(courseNames)
      const reports = await Promise.all(
        courseIds.map((courseId) =>
          this.generateCourseReport(userId, courseId, courseNames[courseId])
        )
      )

      return reports
    } catch (error) {
      console.error("Error generating course reports:", error)
      throw error
    }
  }

  /**
   * Generate user-wide analytics report
   */
  async generateUserAnalytics(userId: string): Promise<UserAnalytics> {
    if (!realtimeDb) throw new Error("Firebase not initialized")

    try {
      const videosRef = ref(realtimeDb, `users/${userId}/videos`)
      const videosSnapshot = await get(videosRef)
      const allVideos = videosSnapshot.exists() ? videosSnapshot.val() : {}

      const analyticsRef = ref(realtimeDb, `users/${userId}/analytics`)
      const analyticsSnapshot = await get(analyticsRef)
      const analytics = analyticsSnapshot.exists()
        ? analyticsSnapshot.val()
        : {}

      // Group videos by course
      const videosByCourse: { [courseId: string]: any[] } = {}
      Object.values(allVideos).forEach((video: any) => {
        if (!videosByCourse[video.courseId]) {
          videosByCourse[video.courseId] = []
        }
        videosByCourse[video.courseId].push(video)
      })

      // Calculate metrics
      const totalCourses = Object.keys(videosByCourse).length
      const totalVideos = Object.keys(allVideos).length
      const completedVideos = Object.values(allVideos).filter(
        (v: any) =>
          ((v.currentTime || v.watchTime || 0) / v.duration) * 100 >= 80
      ).length

      const totalWatchTime = (Object.values(allVideos) as any[]).reduce(
        (sum, v: any) => sum + (v.watchTime || 0),
        0
      )

      const totalViolations: any = {
        tabSwitches: 0,
        faceMissingEvents: 0,
        autoPauses: 0,
        skipCount: 0
      }

      Object.values(allVideos).forEach((v: any) => {
        if (v.violations) {
          totalViolations.tabSwitches += v.violations.tabSwitches || 0
          totalViolations.faceMissingEvents +=
            v.violations.faceMissingEvents || 0
          totalViolations.autoPauses += v.violations.autoPauses || 0
          totalViolations.skipCount += v.violations.skipCount || 0
        }
      })

      const overallProgress = Math.round(
        (completedVideos / Math.max(1, totalVideos)) * 100
      )

      return {
        userId,
        totalCourses,
        completedCourses: 0, // To be calculated separately
        totalVideos,
        completedVideos,
        overallProgress,
        totalWatchTime,
        totalFocusTime: (analytics.focusTime as number) || 0,
        focusScore: (analytics.focusScore as number) || 0,
        averageTabSwitches: Math.round(
          totalVideos > 0
            ? totalViolations.tabSwitches / totalVideos
            : 0
        ),
        averageFaceMissingEvents: Math.round(
          totalVideos > 0
            ? totalViolations.faceMissingEvents / totalVideos
            : 0
        ),
        averageAutoPauses: Math.round(
          totalVideos > 0 ? totalViolations.autoPauses / totalVideos : 0
        ),
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error("Error generating user analytics:", error)
      throw error
    }
  }

  /**
   * Format time in seconds to human readable string
   */
  formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
  }

  /**
   * Export report to JSON
   */
  exportReportToJSON(report: CourseReport | UserAnalytics): string {
    return JSON.stringify(report, null, 2)
  }

  /**
   * Export report to CSV format
   */
  exportReportToCSV(report: CourseReport): string {
    if (!("videos" in report)) return ""

    const headers = [
      "Video ID",
      "Video Title",
      "Progress %",
      "Watch Time (min)",
      "Total Duration (min)",
      "Tab Switches",
      "Face Missing Events",
      "Auto Pauses",
      "Skip Count",
      "Last Watched"
    ]

    const rows = report.videos.map((video) => [
      video.videoId,
      video.videoTitle,
      video.completionPercentage,
      Math.round(video.watchTime / 60),
      Math.round(video.totalDuration / 60),
      video.violations.tabSwitches,
      video.violations.faceMissingEvents,
      video.violations.autoPauses,
      video.violations.skipCount,
      video.lastWatchedAt
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n")

    return csv
  }
}

export const reportService = new ReportService()
