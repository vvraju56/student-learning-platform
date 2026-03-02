"use client"

import { useState, useEffect, useCallback } from "react"
import { auth, realtimeDb } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { ref, onValue, off } from "firebase/database"
import { ProgressStorage } from "@/lib/progress-storage"

export interface LiveStatus {
  faceDetected: boolean
  tabActive: boolean
  currentCourse: string
  currentVideo: string
  monitoring: boolean
}

export interface CourseAnalytics {
  progress: number
  completedVideos: number
  totalVideos: number
  timeSpent: number
  quiz?: {
    mcqScore: number
    codingScore: number
    passed: boolean
    attempts: number
    timeTaken: number
  }
}

export interface FocusAnalytics {
  totalSessionTime: number
  focusTime: number
  faceLostCount: number
  tabSwitchCount: number
  autoPauseCount: number
  focusScore: number
}

export interface SessionEvent {
  type: string
  timestamp: number
  courseId?: string
  videoId?: string
  details?: string
}

export interface AnalyticsData {
  courses: Record<string, CourseAnalytics>
  analytics: FocusAnalytics
  live: LiveStatus
  sessionTimeline: SessionEvent[]
  lastUpdated: number
}

const COURSE_ID_MAPPINGS: Record<string, string[]> = {
  "web-development": ["web-development", "webDevelopment", "webDev", "web_dev"],
  "app-development": ["app-development", "appDevelopment", "appDev", "app_dev"],
  "game-development": ["game-development", "gameDevelopment", "gameDev", "game_dev"]
}

function findCourseData(coursesData: any, courseId: string): any {
  const possibleKeys = COURSE_ID_MAPPINGS[courseId] || [courseId]
  for (const key of possibleKeys) {
    if (coursesData[key]) {
      return coursesData[key]
    }
  }
  return null
}

function countCompletedVideosFromVideos(videosData: any): number {
  if (!videosData || typeof videosData !== 'object') return 0
  let completed = 0
  for (const videoId in videosData) {
    const video = videosData[videoId]
    if (video && (video.completed === true || video.progress >= 90)) {
      completed++
    }
  }
  return completed
}

function getLocalCourseProgress(userId: string, courseId: string): { completedVideos: number; progress: number; totalVideos: number; timeSpent: number } {
  let result = { completedVideos: 0, progress: 0, totalVideos: 10, timeSpent: 0 }
  
  if (typeof window === 'undefined') {
    return result
  }
  
  try {
    const courseProgress = ProgressStorage.getCourseProgress(userId, courseId)
    result = {
      completedVideos: courseProgress.completedVideos || 0,
      progress: courseProgress.overallProgress || 0,
      totalVideos: courseProgress.totalVideos || 10,
      timeSpent: courseProgress.totalWatchTime || 0
    }
    console.log(`📊 ProgressStorage(${courseId}):`, result)
  } catch (e) {
    console.error("Error reading ProgressStorage:", e)
  }
  
  try {
    const saved = localStorage.getItem(`course_progress_${courseId}`)
    console.log(`📊 localStorage[course_progress_${courseId}]:`, saved)
    
    if (saved) {
      const parsed = JSON.parse(saved)
      console.log(`📊 Parsed course_progress_${courseId}:`, parsed)
      
      const completedFromCourse = Array.isArray(parsed.completedVideos) 
        ? parsed.completedVideos.length 
        : (parsed.completedVideos || 0)
      
      console.log(`📊 completedFromCourse: ${completedFromCourse} vs result.completedVideos: ${result.completedVideos}`)
      
      if (completedFromCourse > result.completedVideos) {
        result.completedVideos = completedFromCourse
        result.progress = parsed.progress || Math.round((completedFromCourse / 10) * 100)
        result.totalVideos = parsed.totalVideos || 10
        console.log(`📊 Using course_progress for ${courseId}:`, result)
      }
    }
  } catch (e) {
    console.error("Error reading course_progress:", e)
  }
  
  return result
}

function createDefaultData(): AnalyticsData {
  return {
    courses: {
      "web-development": { progress: 0, completedVideos: 0, totalVideos: 10, timeSpent: 0 },
      "app-development": { progress: 0, completedVideos: 0, totalVideos: 10, timeSpent: 0 },
      "game-development": { progress: 0, completedVideos: 0, totalVideos: 10, timeSpent: 0 }
    },
    analytics: {
      totalSessionTime: 0,
      focusTime: 0,
      faceLostCount: 0,
      tabSwitchCount: 0,
      autoPauseCount: 0,
      focusScore: 0
    },
    live: {
      faceDetected: false,
      tabActive: true,
      currentCourse: "",
      currentVideo: "",
      monitoring: false
    },
    sessionTimeline: [],
    lastUpdated: Date.now()
  }
}

export function useRealtimeAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let isMounted = true

    const processAllData = (firebaseData: any, uid: string): AnalyticsData => {
      const learning = firebaseData?.learning || {}
      const coursesData = learning.courses || {}
      
      console.log("📊 Analytics: Processing data for user:", uid)
      
      const processCourse = (courseId: string): CourseAnalytics => {
        const courseData = findCourseData(coursesData, courseId)
        
        let completedVideos = courseData?.completedVideos || 0
        let progress = courseData?.progress || 0
        let timeSpent = courseData?.timeSpent || 0
        const totalVideos = courseData?.totalVideos || 10
        
        if (courseData?.videos && Object.keys(courseData.videos).length > 0) {
          const videosCompleted = countCompletedVideosFromVideos(courseData.videos)
          if (videosCompleted > completedVideos) {
            completedVideos = videosCompleted
          }
        }
        
        const localProgress = getLocalCourseProgress(uid, courseId)
        console.log(`📊 ${courseId}: Firebase=${completedVideos}, Local=${localProgress.completedVideos}`)
        
        if (localProgress.completedVideos > completedVideos) {
          completedVideos = localProgress.completedVideos
          timeSpent = localProgress.timeSpent
        }
        
        if (progress === 0 && completedVideos > 0) {
          progress = Math.round((completedVideos / totalVideos) * 100)
        }
        
        if (progress === 0 && localProgress.progress > 0) {
          progress = localProgress.progress
        }
        
        return {
          progress: Math.round(progress),
          completedVideos,
          totalVideos,
          timeSpent,
          quiz: courseData?.quiz
        }
      }
      
      const coursesResult: Record<string, CourseAnalytics> = {
        "web-development": processCourse("web-development"),
        "app-development": processCourse("app-development"),
        "game-development": processCourse("game-development")
      }
      
      console.log("📊 Analytics: Processed courses:", coursesResult)
      
      const rawAnalytics = firebaseData?.analytics || {}
      const totalTime = rawAnalytics.totalSessionTime || 1
      const focusTime = rawAnalytics.focusTime || 0
      
      return {
        courses: coursesResult,
        analytics: {
          totalSessionTime: rawAnalytics.totalSessionTime || 0,
          focusTime: focusTime,
          faceLostCount: rawAnalytics.faceLostCount || 0,
          tabSwitchCount: rawAnalytics.tabSwitchCount || 0,
          autoPauseCount: rawAnalytics.autoPauseCount || 0,
          focusScore: Math.round((focusTime / totalTime) * 100)
        },
        live: {
          faceDetected: firebaseData?.live?.faceDetected || false,
          tabActive: firebaseData?.live?.tabActive !== false,
          currentCourse: firebaseData?.live?.currentCourse || "",
          currentVideo: firebaseData?.live?.currentVideo || "",
          monitoring: firebaseData?.live?.monitoring || false
        },
        sessionTimeline: Object.entries(firebaseData?.alerts || {})
          .map(([key, value]: [string, any]) => ({
            type: value?.type || "event",
            timestamp: value?.timestamp || Date.now(),
            courseId: value?.courseId,
            videoId: value?.videoId,
            details: value?.message
          }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20),
        lastUpdated: Date.now()
      }
    }

    const setupListener = (uid: string) => {
      console.log("📊 Analytics: setupListener called with uid:", uid)
      
      const db = realtimeDb || (typeof window !== 'undefined' ? (window as any).realtimeDb : null)
      
      // First, process local data immediately
      const localData = processAllData({}, uid)
      console.log("📊 Analytics: Local data processed:", localData.courses)
      if (isMounted) {
        setData(localData)
        setIsLoading(false)
      }
      
      if (!db) {
        console.log("📊 Analytics: No Firebase DB, using local data only")
        return
      }

      console.log("📊 Analytics: Setting up Firebase listener for:", uid)
      
      const userRef = ref(db, `users/${uid}`)
      
      unsubscribe = onValue(userRef, (snapshot) => {
        if (!isMounted) return
        try {
          const rawData = snapshot.val()
          console.log("📊 Analytics: Firebase data received:", rawData)
          setData(processAllData(rawData, uid))
          setIsConnected(true)
          setIsLoading(false)
          setError(null)
        } catch (err) {
          console.error("📊 Analytics: Processing error:", err)
          setError("Failed to process data")
          setIsLoading(false)
        }
      }, (err) => {
        if (!isMounted) return
        console.error("📊 Analytics: Connection error:", err)
        setIsConnected(false)
        setError("Connection lost")
        setIsLoading(false)
      })
    }

    const currentUser = auth.currentUser
    if (currentUser) {
      setupListener(currentUser.uid)
    } else {
      const authUnsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && isMounted) {
          setupListener(user.uid)
        } else if (isMounted) {
          setData(createDefaultData())
          setIsLoading(false)
        }
        authUnsubscribe()
      })
    }

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const overallProgress = data?.courses 
    ? Math.round(
        (data.courses["web-development"].progress + 
         data.courses["app-development"].progress + 
         data.courses["game-development"].progress) / 3
      )
    : 0

  return {
    data,
    isLoading,
    isConnected,
    error,
    overallProgress,
    totalStudyTime: data?.analytics.totalSessionTime || 0,
    focusScore: data?.analytics.focusScore || 0,
    totalViolations: data 
      ? data.analytics.tabSwitchCount + data.analytics.autoPauseCount 
      : 0
  }
}
