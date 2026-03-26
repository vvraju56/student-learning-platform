import { ref, set, get, getDatabase } from 'firebase/database'
import { realtimeDb } from './firebase'

let warnedGetUserProgressPermission = false

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
  private firebaseSaveInterval = 30000 // 30 seconds throttle

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
      if (!this.userId?.trim() || this.userId === 'demo') {
        return null
      }
      const userRef = ref(this.db, `users/${this.userId}/learning`)
      const snapshot = await get(userRef)
      return snapshot.val()
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase()
      if (msg.includes('permission')) {
        if (!warnedGetUserProgressPermission) {
          warnedGetUserProgressPermission = true
          console.warn('Realtime DB read denied for getUserProgress. Falling back to local data.')
        }
        return null
      }
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
    } catch (error) {
      console.error('❌ Failed to update course progress:', error)
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
}

export { FirebaseProgressManager }
export type { ViolationCount }
