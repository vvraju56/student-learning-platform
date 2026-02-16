"use client"

import { useState, useEffect, useCallback } from "react"
import { courses } from "@/lib/courses-data"
import { firebaseProgressService, UserCourseData, UserOverallData } from "@/services/firebase-progress-service"
import { auth } from "@/lib/firebase"

interface CourseProgress extends UserCourseData {
  courseTitle: string
  courseDescription: string
  category: string
  nextVideoId?: string
  currentVideoProgress?: number
  estimatedTimeRemaining?: number
}

interface OverallStats {
  overallProgress: number
  totalCourses: number
  completedCourses: number
  totalVideos: number
  completedVideos: number
  quizAvailableCourses: number
  completedQuizzes: number
  averageScore: number
  streakDays: number
}

export function useCourseProgress() {
  const [coursesProgress, setCoursesProgress] = useState<{ [courseId: string]: CourseProgress }>({})
  const [overallStats, setOverallStats] = useState<OverallStats>({
    overallProgress: 0,
    totalCourses: 0,
    completedCourses: 0,
    totalVideos: 0,
    completedVideos: 0,
    quizAvailableCourses: 0,
    completedQuizzes: 0,
    averageScore: 0,
    streakDays: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize progress data for user
  const initializeProgress = useCallback(async () => {
    if (!auth.currentUser) {
      setError('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const courseIds = courses.map(course => course.id)
      await firebaseProgressService.initializeUserProgress(courseIds)
      
      console.log('✅ Course progress initialized')
    } catch (error) {
      console.error('Error initializing progress:', error)
      setError('Failed to initialize progress tracking')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Calculate course progress with additional metadata
  const calculateCourseProgress = useCallback(async (courseId: string): Promise<CourseProgress | null> => {
    try {
      const courseData = await firebaseProgressService.getCourseProgress(courseId)
      const courseInfo = courses.find(c => c.id === courseId)
      
      if (!courseData || !courseInfo) return null

      // Calculate next video and progress details
      const completedVideos = courseData.completedVideos || 0
      const totalVideos = courseInfo.modules[0].videos.length
      const nextVideoIndex = completedVideos < totalVideos ? completedVideos : -1
      
      const nextVideoId = nextVideoIndex >= 0 ? courseInfo.modules[0].videos[nextVideoIndex].id : undefined
      
      // Estimate time remaining (average 5 minutes per video)
      const remainingVideos = totalVideos - completedVideos
      const estimatedTimeRemaining = remainingVideos * 5 * 60 // seconds

      return {
        ...courseData,
        courseTitle: courseInfo.title,
        courseDescription: courseInfo.description,
        category: courseInfo.category,
        nextVideoId,
        estimatedTimeRemaining,
        totalVideos, // Update with actual course data
        progress: Math.round((completedVideos / totalVideos) * 100)
      }
    } catch (error) {
      console.error('Error calculating course progress:', error)
      return null
    }
  }, [])

  // Update all courses progress
  const updateAllCoursesProgress = useCallback(async () => {
    if (!auth.currentUser) return

    try {
      setIsLoading(true)
      
      const coursesData: { [courseId: string]: CourseProgress } = {}
      
      // Calculate progress for each course
      for (const course of courses) {
        const progress = await calculateCourseProgress(course.id)
        if (progress) {
          coursesData[course.id] = progress
        }
      }
      
      setCoursesProgress(coursesData)
      
      // Update overall stats
      await updateOverallStats(coursesData)
      
    } catch (error) {
      console.error('Error updating courses progress:', error)
      setError('Failed to update progress')
    } finally {
      setIsLoading(false)
    }
  }, [calculateCourseProgress])

  // Update overall statistics
  const updateOverallStats = useCallback(async (coursesData: { [courseId: string]: CourseProgress }) => {
    try {
      const overall = await firebaseProgressService.getOverallProgress()
      const summary = await firebaseProgressService.getUserCompletionSummary()
      
      // Calculate average quiz score
      const completedQuizzes = Object.values(coursesData).filter(course => course.quizCompleted)
      const averageScore = completedQuizzes.length > 0
        ? Math.round(completedQuizzes.reduce((sum, course) => sum + (course.quizScore || 0), 0) / completedQuizzes.length)
        : 0

      setOverallStats({
        overallProgress: summary.overallProgress,
        totalCourses: summary.totalCourses,
        completedCourses: summary.completedCourses,
        totalVideos: summary.totalVideos,
        completedVideos: summary.completedVideos,
        quizAvailableCourses: summary.quizAvailableCourses,
        completedQuizzes: summary.completedQuizzes,
        averageScore,
        streakDays: 0 // TODO: Implement streak calculation
      })
      
    } catch (error) {
      console.error('Error updating overall stats:', error)
    }
  }, [])

  // Check if quiz is unlocked for a course
  const isQuizUnlocked = useCallback(async (courseId: string): Promise<boolean> => {
    try {
      return await firebaseProgressService.isQuizUnlocked(courseId)
    } catch (error) {
      console.error('Error checking quiz unlock status:', error)
      return false
    }
  }, [])

  // Get specific course progress
  const getCourseProgress = useCallback((courseId: string): CourseProgress | null => {
    return coursesProgress[courseId] || null
  }, [coursesProgress])

  // Get courses by status
  const getCoursesByStatus = useCallback(() => {
    const notStarted: CourseProgress[] = []
    const inProgress: CourseProgress[] = []
    const completed: CourseProgress[] = []
    const quizAvailable: CourseProgress[] = []

    Object.values(coursesProgress).forEach(course => {
      if (course.progress === 0) {
        notStarted.push(course)
      } else if (course.progress === 100) {
        completed.push(course)
        if (course.quizUnlocked) {
          quizAvailable.push(course)
        }
      } else {
        inProgress.push(course)
        if (course.quizUnlocked) {
          quizAvailable.push(course)
        }
      }
    })

    return {
      notStarted,
      inProgress,
      completed,
      quizAvailable
    }
  }, [coursesProgress])

  // Get progress percentage for a course
  const getProgressPercentage = useCallback((courseId: string): number => {
    const course = coursesProgress[courseId]
    return course ? course.progress : 0
  }, [coursesProgress])

  // Get next video for a course
  const getNextVideo = useCallback((courseId: string) => {
    const course = coursesProgress[courseId]
    if (!course) return null

    const courseInfo = courses.find(c => c.id === courseId)
    if (!courseInfo) return null

    const nextVideoId = course.nextVideoId
    return nextVideoId 
      ? courseInfo.modules[0].videos.find(v => v.id === nextVideoId)
      : null
  }, [coursesProgress])

  // Mark course as started
  const markCourseStarted = useCallback(async (courseId: string): Promise<boolean> => {
    try {
      const courseInfo = courses.find(c => c.id === courseId)
      if (!courseInfo) return false

      const courseData: Partial<UserCourseData> = {
        courseId,
        totalVideos: courseInfo.modules[0].videos.length,
        startedAt: Date.now()
      }

      return await firebaseProgressService.updateCourseProgress(courseId)
    } catch (error) {
      console.error('Error marking course as started:', error)
      return false
    }
  }, [])

  // Calculate learning insights
  const getLearningInsights = useCallback(() => {
    const insights = {
      strongestCategory: '',
      averageCompletionTime: 0,
      recommendedNextCourse: '',
      learningPace: 'normal' as 'slow' | 'normal' | 'fast',
      totalLearningTime: 0
    }

    // Calculate category performance
    const categoryStats: { [category: string]: { completed: number; total: number; avgScore: number } } = {}
    
    Object.values(coursesProgress).forEach(course => {
      if (!categoryStats[course.category]) {
        categoryStats[course.category] = { completed: 0, total: 1, avgScore: 0 }
      }
      
      if (course.progress === 100) {
        categoryStats[course.category].completed++
      }
      
      if (course.quizScore) {
        categoryStats[course.category].avgScore += course.quizScore
      }
    })

    // Find strongest category
    let maxScore = 0
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const avgScore = stats.completed > 0 ? stats.avgScore / stats.completed : 0
      if (avgScore > maxScore) {
        maxScore = avgScore
        insights.strongestCategory = category
      }
    })

    // Calculate learning pace
    const completedCourses = Object.values(coursesProgress).filter(c => c.progress === 100).length
    const totalCourses = Object.keys(coursesProgress).length
    
    if (totalCourses > 0) {
      const completionRate = completedCourses / totalCourses
      if (completionRate > 0.7) {
        insights.learningPace = 'fast'
      } else if (completionRate < 0.3) {
        insights.learningPace = 'slow'
      }
    }

    return insights
  }, [coursesProgress])

  // Initialize on mount
  useEffect(() => {
    if (auth.currentUser) {
      initializeProgress()
    }
  }, [initializeProgress])

  // Set up real-time listeners
  useEffect(() => {
    if (!auth.currentUser) return

    const unsubscribeCourses = firebaseProgressService.onCoursesProgressChange(async (courses) => {
      const enrichedCourses: { [courseId: string]: CourseProgress } = {}
      
      for (const [courseId, courseData] of Object.entries(courses)) {
        const enriched = await calculateCourseProgress(courseId)
        if (enriched) {
          enrichedCourses[courseId] = enriched
        }
      }
      
      setCoursesProgress(enrichedCourses)
      updateOverallStats(enrichedCourses)
    })

    const unsubscribeOverall = firebaseProgressService.onOverallProgressChange((overall) => {
      setOverallStats(prev => ({
        ...prev,
        overallProgress: overall?.overallProgress || 0,
        totalCourses: overall?.totalCourses || 0,
        completedCourses: overall?.completedCourses || 0,
        totalVideos: overall?.totalVideos || 0,
        completedVideos: overall?.completedVideos || 0
      }))
    })

    return () => {
      unsubscribeCourses()
      unsubscribeOverall()
    }
  }, [calculateCourseProgress, updateOverallStats])

  return {
    coursesProgress,
    overallStats,
    isLoading,
    error,
    initializeProgress,
    updateAllCoursesProgress,
    isQuizUnlocked,
    getCourseProgress,
    getCoursesByStatus,
    getProgressPercentage,
    getNextVideo,
    markCourseStarted,
    getLearningInsights
  }
}