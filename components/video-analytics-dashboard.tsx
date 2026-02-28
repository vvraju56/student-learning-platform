"use client"

import { useState, useEffect } from "react"
import { videoSyncService } from "@/services/video-sync-service"
import { useRealTimeCourseAnalytics, useRealTimeVideoAnalytics } from "@/hooks/use-real-time-analytics"
import { TrendingUp, Clock, Activity, CheckCircle, BookOpen, Zap } from "lucide-react"

interface CourseProgress {
  courseId: string
  courseName: string
  totalVideos: number
  completedVideos: number
  progress: number
}

interface DashboardStats {
  totalVideosTracked: number
  averageProgress: number
  totalWatchTime: number
  lastSyncTime: number
}

interface VideoAnalyticsDashboardProps {
  userId?: string
}

export function VideoAnalyticsDashboard({ userId }: VideoAnalyticsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideosTracked: 0,
    averageProgress: 0,
    totalWatchTime: 0,
    lastSyncTime: 0
  })

  const [courseAnalytics, setCourseAnalytics] = useState<
    Array<{
      videoId: string
      courseId: string
      progress: number
      watchTime: number
      duration: number
    }>
  >([])

  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)

  // Real-time Firebase listeners
  const { courseProgress: realTimeCourses, overallProgress: realTimeOverall, isLoading: isLoadingRealTime } = useRealTimeCourseAnalytics(userId)
  const { videoAnalytics: realTimeVideos } = useRealTimeVideoAnalytics(userId)

  // Update course progress from real-time data
  useEffect(() => {
    if (realTimeCourses.length > 0) {
      setCourseProgress(
        realTimeCourses.map((course) => ({
          courseId: course.courseId,
          courseName: formatCourseName(course.courseId),
          totalVideos: course.totalVideos,
          completedVideos: course.completedVideos,
          progress: course.progress
        }))
      )
    }
  }, [realTimeCourses])

  // Update overall progress from real-time data
  useEffect(() => {
    if (realTimeOverall) {
      setOverallProgress(realTimeOverall.progress)
    }
  }, [realTimeOverall])

  // Update video analytics from real-time data
  useEffect(() => {
    if (realTimeVideos.length > 0) {
      setCourseAnalytics(realTimeVideos)
    }
  }, [realTimeVideos])

  // Fallback: Fetch course progress from Firebase on mount if no real-time data
  useEffect(() => {
    if (!userId || realTimeCourses.length > 0) return

    const fetchCourseProgress = async () => {
      setIsLoadingCourses(true)
      try {
        const courses = await videoSyncService.getAllCoursesProgress(userId)
        if (courses.length > 0) {
          setCourseProgress(
            courses.map((course) => ({
              courseId: course.courseId,
              courseName: formatCourseName(course.courseId),
              totalVideos: course.totalVideos,
              completedVideos: course.completedVideos,
              progress: course.progress
            }))
          )
        }

        const overall = await videoSyncService.getOverallProgress(userId)
        setOverallProgress(overall)
      } catch (error) {
        console.error("Error fetching course progress:", error)
      } finally {
        setIsLoadingCourses(false)
      }
    }

    fetchCourseProgress()
  }, [userId, realTimeCourses.length])

  // Update dashboard every 10 seconds (lightweight local updates)
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const newStats = videoSyncService.getSummaryStats()
      setStats(newStats)

      const analytics = videoSyncService.getLocalAnalytics()
      setCourseAnalytics(analytics)
    }, 10000)

    return () => clearInterval(updateInterval)
  }, [])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const formatCourseName = (courseId: string): string => {
    const names: { [key: string]: string } = {
      "web-development": "Web Development",
      "app-development": "App Development",
      "game-development": "Game Development"
    }
    return names[courseId] || courseId
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Learning Analytics Dashboard
            </h2>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              {!isLoadingRealTime && userId ? (
                <>
                  <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                  Real-time sync active
                </>
              ) : (
                <>Real-time sync • Last update: {formatLastSync(stats.lastSyncTime)}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Videos Tracked Card */}
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Videos Tracked</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.totalVideosTracked}
          </div>
          <p className="text-gray-500 text-xs mt-2">Active sessions</p>
        </div>

        {/* Average Progress Card */}
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-green-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Progress</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.averageProgress}%
          </div>
          <div className="w-full bg-gray-600 rounded-full h-1 mt-2">
            <div
              className="bg-green-500 h-1 rounded-full transition-all"
              style={{ width: `${stats.averageProgress}%` }}
            />
          </div>
        </div>

        {/* Total Watch Time Card */}
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-purple-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Watch Time</span>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-white">
            {formatTime(stats.totalWatchTime)}
          </div>
          <p className="text-gray-500 text-xs mt-2">Total learning time</p>
        </div>

        {/* Sync Status Card */}
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-orange-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Sync Status</span>
            <CheckCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-lg font-bold text-orange-400">Active</div>
          <p className="text-gray-500 text-xs mt-2">5-min intervals</p>
        </div>
      </div>

      {/* Overall Progress Card */}
      <div className="mb-8 bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-lg border border-purple-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Overall Course Progress
        </h3>
        <div className="text-4xl font-bold text-white mb-2">{overallProgress}%</div>
        <p className="text-purple-200 text-sm mb-4">
          Complete
        </p>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Course-wise Progress */}
      {courseProgress.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course-wise Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseProgress.map((course) => (
              <div
                key={course.courseId}
                className="bg-gray-700 p-6 rounded-lg border border-gray-600 hover:border-indigo-500 transition"
              >
                <h4 className="text-white font-semibold mb-3">
                  {course.courseName}
                </h4>
                <div className="mb-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300 text-sm">
                      {course.completedVideos} / {course.totalVideos} videos
                    </span>
                    <span className="text-indigo-400 font-semibold">
                      {Math.round(course.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                {course.progress >= 100 && (
                  <div className="text-xs text-green-400 font-semibold">
                    ✓ Completed
                  </div>
                )}
                {course.progress > 0 && course.progress < 100 && (
                  <div className="text-xs text-yellow-400">
                    In Progress
                  </div>
                )}
                {course.progress === 0 && (
                  <div className="text-xs text-gray-400">
                    Not Started
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Analytics Table */}
      {courseAnalytics.length > 0 && (
        <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-600">
            <h3 className="text-lg font-semibold text-white">
              Video Progress Details
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-600 border-b border-gray-600">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Video ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Watch Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {courseAnalytics.map((analytics, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-600 hover:bg-gray-600 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {analytics.videoId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {analytics.courseId}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-500 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${analytics.progress}%` }}
                          />
                        </div>
                        <span className="text-gray-300 font-semibold w-12">
                          {Math.round(analytics.progress)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatTime(analytics.watchTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatTime(analytics.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {courseAnalytics.length === 0 && (
        <div className="bg-gray-700 p-8 rounded-lg border border-gray-600 text-center">
          <p className="text-gray-400">
            No video data yet. Start watching videos to see analytics here.
          </p>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-gray-600 rounded-lg border border-gray-600">
        <p className="text-gray-300 text-xs">
          📊 This dashboard uses local storage to minimize Firebase usage. Data
          syncs to Firebase every 5 minutes in the background, optimized for
          free tier quotas.
        </p>
      </div>
    </div>
  )
}
