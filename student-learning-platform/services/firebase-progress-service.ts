"use client"

import { auth } from "@/lib/firebase"
import { ref, set, get, update, onValue, remove } from "firebase/database"

// Firebase Data Structure Types
export interface UserVideoData {
  courseId: string
  videoId: string
  completed: boolean
  validWatchTime: number
  totalDuration: number
  lastWatchedTime: number
  completedAt?: number
  violations: {
    tabSwitch: number
    faceMissing: number
    autoPause: number
  }
  skippedSegments?: Array<{
    start: number
    end: number
    duration: number
  }>
  completionData?: {
    completionPercentage: number
    finalViolations: any
    completedAt: string
  }
  lastFailureAt?: number
  retryAfterMinutes?: number
  lastUpdated: number
}

export interface UserCourseData {
  courseId: string
  totalVideos: number
  completedVideos: number
  progress: number // 0-100
  quizUnlocked: boolean
  quizCompleted?: boolean
  quizScore?: number
  lastUpdated: number
  startedAt?: number
  completedAt?: number
}

export interface UserOverallData {
  overallProgress: number
  totalCourses: number
  completedCourses: number
  totalVideos: number
  completedVideos: number
  webCompleted: number      // Videos completed (for web: 10 = 100%)
  webPercentage: number     // Web completion percentage
  overallPercentage: number // Overall from 30 videos
  lastUpdated: number
}

export interface UserProgressData {
  uid: string
  courses: { [courseId: string]: UserCourseData }
  videos: { [videoKey: string]: UserVideoData }
  overall: UserOverallData
  createdAt: number
  lastUpdated: number
}

export class FirebaseProgressService {
  private userId: string | null = null

  constructor() {
    this.userId = auth.currentUser?.uid || null
  }

  // Initialize user data structure
  async initializeUserProgress(courseIds: string[]): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const userPath = `users/${this.userId}`
    const userRef = ref(window.realtimeDb, userPath)
    
    try {
      const snapshot = await get(userRef)
      
      if (!snapshot.exists()) {
        // Create initial user structure
        const initialData: UserProgressData = {
          uid: this.userId,
          courses: {},
          videos: {},
          overall: {
            overallProgress: 0,
            totalCourses: courseIds.length,
            completedCourses: 0,
            totalVideos: 0,
            completedVideos: 0,
            lastUpdated: Date.now()
          },
          createdAt: Date.now(),
          lastUpdated: Date.now()
        }

        // Initialize course data
        courseIds.forEach(courseId => {
          initialData.courses[courseId] = {
            courseId,
            totalVideos: 10, // Default, will be updated per course
            completedVideos: 0,
            progress: 0,
            quizUnlocked: false,
            lastUpdated: Date.now(),
            startedAt: Date.now()
          }
        })

        await set(userRef, initialData)
        console.log('✅ User progress initialized')
      }
    } catch (error) {
      console.error('Error initializing user progress:', error)
      throw error
    }
  }

  // Update video progress
  async updateVideoProgress(videoData: Partial<UserVideoData>): Promise<boolean> {
    if (!this.userId) return false

    const videoKey = `${videoData.courseId}_${videoData.videoId}`
    const videoPath = `users/${this.userId}/videos/${videoKey}`
    const videoRef = ref(window.realtimeDb, videoPath)

    try {
      const updateData = {
        ...videoData,
        lastUpdated: Date.now()
      }

      await update(videoRef, updateData)
      console.log('✅ Video progress updated:', videoKey)
      
      // Update course progress after video update
      await this.updateCourseProgress(videoData.courseId!)
      
      return true
    } catch (error) {
      console.error('Error updating video progress:', error)
      return false
    }
  }

  // Update course progress
  async updateCourseProgress(courseId: string): Promise<boolean> {
    if (!this.userId) return false

    try {
      // Get all videos for this course
      const videosRef = ref(window.realtimeDb, `users/${this.userId}/videos`)
      const snapshot = await get(videosRef)
      
      let completedVideos = 0
      let totalVideos = 0
      
      if (snapshot.exists()) {
        const videos = snapshot.val()
        Object.entries(videos).forEach(([key, video]: [string, any]) => {
          if (video.courseId === courseId) {
            totalVideos++
            if (video.completed) {
              completedVideos++
            }
          }
        })
      }

      const courseProgress = Math.round((completedVideos / totalVideos) * 100)
      const quizUnlocked = completedVideos === totalVideos && totalVideos > 0

      const coursePath = `users/${this.userId}/courses/${courseId}`
      const courseRef = ref(window.realtimeDb, coursePath)
      
      await update(courseRef, {
        totalVideos,
        completedVideos,
        progress: courseProgress,
        quizUnlocked,
        lastUpdated: Date.now(),
        ...(quizUnlocked && !quizUnlocked ? { completedAt: Date.now() } : {})
      })

      // Update overall progress
      await this.updateOverallProgress()
      
      console.log('✅ Course progress updated:', courseId, courseProgress + '%')
      return true
      
    } catch (error) {
      console.error('Error updating course progress:', error)
      return false
    }
  }

  // Update overall progress (web completion + overall percentage)
  async updateOverallProgress(): Promise<boolean> {
    if (!this.userId) return false

    try {
      const coursesRef = ref(window.realtimeDb, `users/${this.userId}/courses`)
      const snapshot = await get(coursesRef)
      
      let totalCourses = 0
      let completedCourses = 0
      let totalVideos = 0
      let completedVideos = 0
      let totalProgress = 0
      
      if (snapshot.exists()) {
        const courses = snapshot.val()
        Object.values(courses).forEach((course: any) => {
          totalCourses++
          totalProgress += course.progress || 0
          totalVideos += course.totalVideos || 0
          completedVideos += course.completedVideos || 0
          
          if (course.progress === 100) {
            completedCourses++
          }
        })
      }

      const TOTAL_WEB_VIDEOS = 10
      const TOTAL_ALL_VIDEOS = 30
      
      const overallProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0
      const webCompleted = completedVideos
      const webPercentage = Math.min((webCompleted / TOTAL_WEB_VIDEOS) * 100, 100)
      const overallPercentage = Math.min((completedVideos / TOTAL_ALL_VIDEOS) * 100, 100)
      
      const overallPath = `users/${this.userId}/overall`
      const overallRef = ref(window.realtimeDb, overallPath)
      
      await update(overallRef, {
        overallProgress,
        totalCourses,
        completedCourses,
        totalVideos,
        completedVideos,
        webCompleted,
        webPercentage: Math.round(webPercentage),
        overallPercentage: Math.round(overallPercentage),
        lastUpdated: Date.now(),
        syncInterval: '5 minutes'
      })

      console.log(`📊 Overall progress: ${completedVideos}/30 | Web: ${webPercentage}% | Overall: ${overallPercentage}%`)
      return true
      
    } catch (error) {
      console.error('Error updating overall progress:', error)
      return false
    }
  }

  // Get user course progress
  async getCourseProgress(courseId: string): Promise<UserCourseData | null> {
    if (!this.userId) return null

    try {
      const coursePath = `users/${this.userId}/courses/${courseId}`
      const courseRef = ref(window.realtimeDb, coursePath)
      const snapshot = await get(courseRef)
      
      return snapshot.exists() ? snapshot.val() : null
    } catch (error) {
      console.error('Error getting course progress:', error)
      return null
    }
  }

  // Get all courses progress
  async getAllCoursesProgress(): Promise<{ [courseId: string]: UserCourseData }> {
    if (!this.userId) return {}

    try {
      const coursesPath = `users/${this.userId}/courses`
      const coursesRef = ref(window.realtimeDb, coursesPath)
      const snapshot = await get(coursesRef)
      
      return snapshot.exists() ? snapshot.val() : {}
    } catch (error) {
      console.error('Error getting all courses progress:', error)
      return {}
    }
  }

  // Get overall progress
  async getOverallProgress(): Promise<UserOverallData | null> {
    if (!this.userId) return null

    try {
      const overallPath = `users/${this.userId}/overall`
      const overallRef = ref(window.realtimeDb, overallPath)
      const snapshot = await get(overallRef)
      
      return snapshot.exists() ? snapshot.val() : null
    } catch (error) {
      console.error('Error getting overall progress:', error)
      return null
    }
  }

  // Check if quiz is unlocked for a course
  async isQuizUnlocked(courseId: string): Promise<boolean> {
    const courseProgress = await this.getCourseProgress(courseId)
    return courseProgress?.quizUnlocked || false
  }

  // Mark quiz as completed
  async markQuizCompleted(courseId: string, score: number): Promise<boolean> {
    if (!this.userId) return false

    try {
      const coursePath = `users/${this.userId}/courses/${courseId}`
      const courseRef = ref(window.realtimeDb, coursePath)
      
      await update(courseRef, {
        quizCompleted: true,
        quizScore: score,
        lastUpdated: Date.now()
      })

      // Update overall progress
      await this.updateOverallProgress()
      
      console.log('✅ Quiz marked as completed:', courseId, score + '%')
      return true
      
    } catch (error) {
      console.error('Error marking quiz as completed:', error)
      return false
    }
  }

  // Real-time listener for courses progress
  onCoursesProgressChange(callback: (courses: { [courseId: string]: UserCourseData }) => void): () => void {
    if (!this.userId) return () => {}

    const coursesPath = `users/${this.userId}/courses`
    const coursesRef = ref(window.realtimeDb, coursesPath)
    
    return onValue(coursesRef, (snapshot) => {
      const courses = snapshot.exists() ? snapshot.val() : {}
      callback(courses)
    })
  }

  // Real-time listener for overall progress
  onOverallProgressChange(callback: (overall: UserOverallData) => void): () => void {
    if (!this.userId) return () => {}

    const overallPath = `users/${this.userId}/overall`
    const overallRef = ref(window.realtimeDb, overallPath)
    
    return onValue(overallRef, (snapshot) => {
      const overall = snapshot.exists() ? snapshot.val() : null
      callback(overall)
    })
  }

  // Get user completion summary
  async getUserCompletionSummary(): Promise<{
    totalCourses: number
    completedCourses: number
    totalVideos: number
    completedVideos: number
    overallProgress: number
    quizAvailableCourses: number
    completedQuizzes: number
  }> {
    const overall = await this.getOverallProgress()
    const courses = await this.getAllCoursesProgress()
    
    const quizAvailableCourses = Object.values(courses).filter(course => course.quizUnlocked).length
    const completedQuizzes = Object.values(courses).filter(course => course.quizCompleted).length

    return {
      totalCourses: overall?.totalCourses || 0,
      completedCourses: overall?.completedCourses || 0,
      totalVideos: overall?.totalVideos || 0,
      completedVideos: overall?.completedVideos || 0,
      overallProgress: overall?.overallProgress || 0,
      quizAvailableCourses,
      completedQuizzes
    }
  }

  // Clean up old data (optional maintenance)
  async cleanupOldData(daysOld: number = 90): Promise<boolean> {
    if (!this.userId) return false

    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
      const videosRef = ref(window.realtimeDb, `users/${this.userId}/videos`)
      const snapshot = await get(videosRef)
      
      if (snapshot.exists()) {
        const videos = snapshot.val()
        const videosToDelete: string[] = []
        
        Object.entries(videos).forEach(([key, video]: [string, any]) => {
          if (video.lastUpdated && video.lastUpdated < cutoffTime && !video.completed) {
            videosToDelete.push(key)
          }
        })

        // Delete old incomplete video progress
        for (const videoKey of videosToDelete) {
          const videoRef = ref(window.realtimeDb, `users/${this.userId}/videos/${videoKey}`)
          await remove(videoRef)
        }

        console.log(`🧹 Cleaned up ${videosToDelete.length} old incomplete video records`)
      }

      return true
    } catch (error) {
      console.error('Error cleaning up old data:', error)
      return false
    }
  }
}

// Export singleton instance
export const firebaseProgressService = new FirebaseProgressService()