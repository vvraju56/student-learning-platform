import { ref, set, get, getDatabase } from 'firebase/database'
import { realtimeDb } from './firebase'

// Firebase configuration for FREE PLAN usage
interface ViolationCount {
  tabSwitch: number
  faceMissing: number
  postureIssues: number
}

interface LocalProgressState {
  violations: ViolationCount
  sessions: any[]
  currentSession: any
}

interface SaveVideoProgress {
  totalSeconds: number
  validSeconds: number
  completed: boolean
  violations: ViolationCount
  courseId?: string
  videoId?: string
}

// Firebase configuration for FREE PLAN usage
const TOTAL_WEB_VIDEOS = 10 // 10 videos = 100% web completion
const TOTAL_ALL_VIDEOS = 30 // 3 courses x 10 videos each
const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

class FirebaseProgressManager {
  private userId: string
  private db: ReturnType<typeof getDatabase>
  private localProgress: LocalProgressState = {
    violations: {
      tabSwitch: 0,
      faceMissing: 0,
      postureIssues: 0
    },
    sessions: [],
    currentSession: null
  }
  private lastFirebaseSave = 0
  private firebaseSaveInterval = SYNC_INTERVAL_MS // 5 minutes throttle (FREE TIER SAFE)

  constructor(userId: string) {
    this.userId = userId
    this.db = realtimeDb
    if (!this.db) {
      console.warn('Firebase Realtime Database not available')
    }
    this.loadLocalProgress()
  }

  private loadLocalProgress() {
    // Load from localStorage for demonstration
    console.log('📚 Loading local progress for user:', this.userId)
  }

  // ✅ SAFE: Save video progress with rate limiting
  async saveVideoProgress(videoId: string, courseId: string, progress: SaveVideoProgress) {
    try {
      if (!this.db) {
        console.warn('Firebase not available, skipping save')
        return false
      }
      const videoRef = ref(this.db, `users/${this.userId}/learning/courses/${courseId}/videos/${videoId}`)
      
      // SINGLE WRITE per video completion/progress update
      await set(videoRef, {
        totalSeconds: progress.totalSeconds,
        validSeconds: progress.validSeconds,
        completed: progress.completed,
        tabSwitchCount: progress.violations.tabSwitch,
        faceMissingCount: progress.violations.faceMissing,
        autoPauseCount: progress.violations.postureIssues,
        lastUpdated: Date.now(),
        courseId: courseId,
        videoId: videoId
      })
      
      console.log('✅ Video progress saved safely')
      return true
    } catch (error) {
      console.error('❌ Failed to save video progress:', error)
      return false
    }
  }

  // ✅ FREE PLAN SAFE: Get user progress (efficient reads)
  async getUserProgress() {
    try {
      if (!this.db) {
        console.warn('Firebase not available, returning null')
        return null
      }
      const userRef = ref(this.db, `users/${this.userId}/learning`)
      const snapshot = await get(userRef)
      return snapshot.val()
    } catch (error) {
      console.error('❌ Failed to get user progress:', error)
      return null
    }
  }

  // ✅ FREE PLAN SAFE: Update course progress occasionally
  async updateCourseProgress(courseId: string, progress: number, completedVideos: number) {
    try {
      if (!this.db) {
        console.warn('Firebase not available, skipping course update')
        return
      }
      const courseRef = ref(this.db, `users/${this.userId}/learning/courses/${courseId}`)
      
      // SINGLE WRITE per course update
      await set(courseRef, {
        progress,
        completedVideos,
        lastUpdated: Date.now()
      })
      
      console.log('✅ Course progress updated')
      
      // Auto-update overall progress after course update
      await this.updateOverallProgress()
    } catch (error) {
      console.error('❌ Failed to update course progress:', error)
    }
  }

  // ✅ SAVE OVERALL PROGRESS (web completion + overall percentage)
  async updateOverallProgress() {
    try {
      if (!this.db) {
        console.warn('Firebase not available, skipping overall progress')
        return
      }

      // Get all completed videos from all courses
      const coursesRef = ref(this.db, `users/${this.userId}/learning/courses`)
      const snapshot = await get(coursesRef)
      
      let totalCompletedVideos = 0
      
      if (snapshot.exists()) {
        const courses = snapshot.val()
        Object.values(courses).forEach((course: any) => {
          totalCompletedVideos += course.completedVideos || 0
        })
      }

      // Web completion: 10 videos = 100%
      const webCompleted = totalCompletedVideos
      const webPercentage = Math.min((webCompleted / TOTAL_WEB_VIDEOS) * 100, 100)
      
      // Overall progress: based on all 30 videos
      const overallPercentage = Math.min((totalCompletedVideos / TOTAL_ALL_VIDEOS) * 100, 100)

      // Save overall progress
      const overallRef = ref(this.db, `users/${this.userId}/learning/overall`)
      await set(overallRef, {
        completedVideos: totalCompletedVideos,
        webCompleted: webCompleted,
        webPercentage: Math.round(webPercentage),
        overallPercentage: Math.round(overallPercentage),
        lastUpdated: Date.now(),
        syncInterval: SYNC_INTERVAL_MS / 1000 + ' seconds'
      })

      console.log(`📊 Progress synced: ${totalCompletedVideos} videos | Web: ${webPercentage}% | Overall: ${overallPercentage}%`)
    } catch (error) {
      console.error('❌ Failed to update overall progress:', error)
    }
  }

  // ✅ GET PROGRESS SUMMARY (for display)
  async getProgressSummary() {
    try {
      if (!this.db) return null
      
      const overallRef = ref(this.db, `users/${this.userId}/learning/overall`)
      const snapshot = await get(overallRef)
      
      if (snapshot.exists()) {
        return snapshot.val()
      }
      
      return {
        completedVideos: 0,
        webCompleted: 0,
        webPercentage: 0,
        overallPercentage: 0
      }
    } catch (error) {
      console.error('❌ Failed to get progress summary:', error)
      return null
    }
  }

  // ✅ FREE PLAN SAFE: Record violation locally with throttled Firebase sync
  recordViolation(type: keyof ViolationCount, increment: number = 1) {
    // Update local state immediately (no Firebase)
    this.localProgress.violations[type] += increment
    console.log(`📊 Local violation recorded: ${type} (${this.localProgress.violations[type]})`)
    
    // Throttled Firebase save (every 30 seconds max)
    this.throttledFirebaseSave()
  }

  // ✅ THROTTLED FIREBASE SAVE (30-second intervals)
  private async throttledFirebaseSave() {
    const now = Date.now()
    if (now - this.lastFirebaseSave < this.firebaseSaveInterval) {
      return // Skip - too soon since last save
    }

    this.lastFirebaseSave = now
    
    try {
      if (!this.db) {
        console.warn('Firebase not available, skipping batch save')
        return
      }
      
      // Batch save all violations at once
      const violationsRef = ref(this.db, `users/${this.userId}/violations`)
      await set(violationsRef, {
        ...this.localProgress.violations,
        lastUpdated: now,
        batchSave: true
      })
      
      console.log('💾 Batch violations saved to Firebase (30-sec throttle)')
    } catch (error) {
      console.error('❌ Failed to batch save violations:', error)
    }
  }

  // ✅ FORCE SAVE (for important events like video completion)
  async forceSaveViolations() {
    try {
      if (!this.db) {
        console.warn('Firebase not available, skipping force save')
        return
      }
      
      const violationsRef = ref(this.db, `users/${this.userId}/violations`)
      await set(violationsRef, {
        ...this.localProgress.violations,
        lastUpdated: Date.now(),
        forceSave: true
      })
      
      console.log('💪 Violations force saved to Firebase')
      this.lastFirebaseSave = Date.now() // Reset throttle timer
    } catch (error) {
      console.error('❌ Failed to force save violations:', error)
    }
  }

  // ✅ GET LOCAL VIOLATIONS (no Firebase read)
  getLocalViolations(): ViolationCount {
    return { ...this.localProgress.violations }
  }

  // ✅ RESET ALL PROGRESS
  async resetAllProgress() {
    try {
      if (!this.db) {
        console.warn('Firebase not available')
        return false
      }

      const userPath = `users/${this.userId}`
      
      await set(ref(this.db, `${userPath}/learning`), {
        resetAt: Date.now(),
        message: 'Progress reset'
      })
      await set(ref(this.db, `${userPath}/courses`), null)
      await set(ref(this.db, `${userPath}/videos`), null)
      await set(ref(this.db, `${userPath}/overall`), null)
      await set(ref(this.db, `${userPath}/violations`), null)

      // Reset local state
      this.localProgress = {
        violations: { tabSwitch: 0, faceMissing: 0, postureIssues: 0 },
        sessions: [],
        currentSession: null
      }
      this.lastFirebaseSave = 0

      console.log('🗑️ All progress reset for user:', this.userId)
      return true
    } catch (error) {
      console.error('❌ Failed to reset progress:', error)
      return false
    }
  }
}

export { FirebaseProgressManager }
export type { ViolationCount }