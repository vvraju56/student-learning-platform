"use client"

import { ref, set, update, push, get } from "firebase/database"
import { auth, realtimeDb } from "@/lib/firebase"

interface AnalyticsUpdate {
  totalSessionTime?: number
  focusTime?: number
  faceLostCount?: number
  tabSwitchCount?: number
  autoPauseCount?: number
  focusScore?: number
}

interface LiveStatusUpdate {
  faceDetected?: boolean
  tabActive?: boolean
  currentCourse?: string
  currentVideo?: string
  monitoring?: boolean
}

interface SessionEvent {
  type: string
  courseId?: string
  videoId?: string
  details?: string
}

export class AnalyticsService {
  private static instance: AnalyticsService
  private userId: string | null = null
  private sessionStartTime: number = 0
  private focusStartTime: number = 0
  private lastUpdateTime: number = 0
  private updateThrottleMs: number = 500

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  private constructor() {
    this.initUser()
  }

  private initUser() {
    const user = auth.currentUser
    if (user) {
      this.userId = user.uid
    }
    
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.userId = user.uid
      } else {
        this.userId = null
      }
    })
  }

  private canUpdate(): boolean {
    const now = Date.now()
    if (now - this.lastUpdateTime < this.updateThrottleMs) {
      return false
    }
    this.lastUpdateTime = now
    return true
  }

  async startSession(courseId?: string): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    this.sessionStartTime = Date.now()
    this.focusStartTime = Date.now()
    
    await this.logEvent({
      type: "session_start",
      courseId,
      details: "Learning session started"
    })
    
    await this.updateLiveStatus({
      monitoring: true,
      currentCourse: courseId,
      tabActive: true
    })
  }

  async endSession(): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000)
    
    await this.logEvent({
      type: "session_end",
      details: `Session duration: ${sessionDuration}s`
    })
    
    await this.updateLiveStatus({
      monitoring: false,
      currentCourse: "",
      currentVideo: ""
    })
    
    await this.incrementAnalytics({
      totalSessionTime: sessionDuration
    })
  }

  async updateLiveStatus(status: LiveStatusUpdate): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    try {
      const liveRef = ref(realtimeDb, `users/${this.userId}/live`)
      await update(liveRef, {
        ...status,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error("Error updating live status:", error)
    }
  }

  async updateAnalytics(analytics: AnalyticsUpdate): Promise<void> {
    if (!this.userId || !realtimeDb || !this.canUpdate()) return
    
    try {
      const analyticsRef = ref(realtimeDb, `users/${this.userId}/analytics`)
      await update(analyticsRef, analytics)
    } catch (error) {
      console.error("Error updating analytics:", error)
    }
  }

  async incrementAnalytics(increments: AnalyticsUpdate): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    try {
      const analyticsRef = ref(realtimeDb, `users/${this.userId}/analytics`)
      const snapshot = await get(analyticsRef)
      const current = snapshot.val() || {}
      
      const updated: AnalyticsUpdate = {
        totalSessionTime: (current.totalSessionTime || 0) + (increments.totalSessionTime || 0),
        focusTime: (current.focusTime || 0) + (increments.focusTime || 0),
        faceLostCount: (current.faceLostCount || 0) + (increments.faceLostCount || 0),
        tabSwitchCount: (current.tabSwitchCount || 0) + (increments.tabSwitchCount || 0),
        autoPauseCount: (current.autoPauseCount || 0) + (increments.autoPauseCount || 0)
      }
      
      const totalTime = updated.totalSessionTime || 1
      const focusTime = updated.focusTime || 0
      updated.focusScore = Math.round((focusTime / totalTime) * 100)
      
      await set(analyticsRef, {
        ...updated,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error("Error incrementing analytics:", error)
    }
  }

  async trackFocusGained(): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    this.focusStartTime = Date.now()
    
    await this.updateLiveStatus({ faceDetected: true })
    await this.logEvent({ type: "face_detected" })
  }

  async trackFocusLost(): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    const focusDuration = Math.floor((Date.now() - this.focusStartTime) / 1000)
    
    await this.updateLiveStatus({ faceDetected: false })
    await this.incrementAnalytics({
      focusTime: focusDuration,
      faceLostCount: 1
    })
    await this.logEvent({ type: "face_lost" })
  }

  async trackTabSwitch(): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    await this.updateLiveStatus({ tabActive: false })
    await this.incrementAnalytics({ tabSwitchCount: 1 })
    await this.logEvent({ type: "tab_switch" })
    
    setTimeout(() => {
      this.updateLiveStatus({ tabActive: true })
    }, 1000)
  }

  async trackAutoPause(): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    await this.incrementAnalytics({ autoPauseCount: 1 })
    await this.logEvent({ type: "auto_pause" })
  }

  async trackVideoStart(courseId: string, videoId: string): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    await this.updateLiveStatus({ currentCourse: courseId, currentVideo: videoId })
    await this.logEvent({ type: "video_start", courseId, videoId })
  }

  async trackVideoPause(courseId: string, videoId: string): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    await this.logEvent({ type: "video_pause", courseId, videoId })
  }

  async trackVideoComplete(courseId: string, videoId: string): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    await this.logEvent({ type: "video_complete", courseId, videoId })
    
    const courseRef = ref(realtimeDb, `users/${this.userId}/learning/courses/${courseId}`)
    const snapshot = await get(courseRef)
    const current = snapshot.val() || {}
    
    await set(courseRef, {
      ...current,
      completedVideos: (current.completedVideos || 0) + 1,
      totalVideos: current.totalVideos || 10,
      progress: Math.round(((current.completedVideos || 0) + 1) / (current.totalVideos || 10) * 100),
      lastUpdated: Date.now()
    })
  }

  async trackQuizStart(courseId: string): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    await this.logEvent({ type: "quiz_start", courseId })
  }

  async trackQuizComplete(courseId: string, score: number, passed: boolean): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    await this.logEvent({ 
      type: "quiz_complete", 
      courseId, 
      details: `Score: ${score}, ${passed ? "Passed" : "Failed"}` 
    })
    
    const quizRef = ref(realtimeDb, `users/${this.userId}/learning/courses/${courseId}/quiz`)
    const snapshot = await get(quizRef)
    const current = snapshot.val() || {}
    
    await set(quizRef, {
      ...current,
      attempts: (current.attempts || 0) + 1,
      passed,
      lastScore: score,
      lastUpdated: Date.now()
    })
  }

  async logEvent(event: SessionEvent): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    try {
      const alertsRef = ref(realtimeDb, `users/${this.userId}/alerts`)
      await push(alertsRef, {
        ...event,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error("Error logging event:", error)
    }
  }

  async updateCourseTimeSpent(courseId: string, additionalSeconds: number): Promise<void> {
    if (!this.userId || !realtimeDb) return
    
    try {
      const courseRef = ref(realtimeDb, `users/${this.userId}/learning/courses/${courseId}`)
      const snapshot = await get(courseRef)
      const current = snapshot.val() || {}
      
      await set(courseRef, {
        ...current,
        timeSpent: (current.timeSpent || 0) + additionalSeconds,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error("Error updating course time spent:", error)
    }
  }

  async updateVideoProgress(courseId: string, videoId: string, progressData: {
    validWatchTime: number
    totalDuration: number
    completed: boolean
    lastWatchedTime: number
  }): Promise<void> {
    if (!this.userId || !realtimeDb || !this.canUpdate()) return
    
    try {
      const videoRef = ref(realtimeDb, `users/${this.userId}/learning/courses/${courseId}/videos/${videoId}`)
      await set(videoRef, {
        ...progressData,
        lastUpdated: Date.now()
      })
    } catch (error) {
      console.error("Error updating video progress:", error)
    }
  }
}

export const analyticsService = AnalyticsService.getInstance()
