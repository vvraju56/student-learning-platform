import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase, ref, set, get, onValue, push, update } from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const realtimeDb = getDatabase(app)

// Make realtimeDb available globally for our services
if (typeof window !== 'undefined') {
  window.realtimeDb = realtimeDb
}

// Rate limiting for Firebase writes
let lastFirebaseWrite = 0;
const MIN_WRITE_INTERVAL = 500; // 2 writes per second max

function safeFirebaseWrite<T>(writeFunction: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (now - lastFirebaseWrite < MIN_WRITE_INTERVAL) {
    console.log('🚫 Firebase write rate limited');
    return Promise.reject(new Error('Rate limited'));
  }
  lastFirebaseWrite = now;
  return writeFunction();
}

// Firebase Progress Saving Functions
export const saveVideoProgressToFirebase = async (userId: string, courseId: string, videoId: string, data: any) => {
  try {
    if (!realtimeDb) {
      console.warn('Firebase Realtime Database not available for saving')
      return false
    }
    
    return await safeFirebaseWrite(async () => {
      await set(ref(realtimeDb, `users/${userId}/learning/courses/${courseId}/videos/${videoId}`), {
        lastWatchedTime: data.lastWatchedTime || 0,
        validWatchTime: data.validWatchTime || 0,
        totalDuration: data.totalDuration || 0,
        completed: data.completed || false,
        tabSwitchCount: data.tabSwitchCount || 0,
        faceMissingCount: data.faceMissingCount || 0,
        autoPauseCount: data.autoPauseCount || 0,
        lastWatchTime: Date.now(),
        courseId: courseId,
        videoId: videoId
      })
      return true;
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Rate limited') {
      return false; // Silently handle rate limit
    }
    console.warn('Firebase video progress save failed:', error)
    return false
  }
}

export const saveCourseProgressToFirebase = async (userId: string, courseId: string, progress: number, completedVideos: number, totalVideos: number) => {
  try {
    await set(ref(realtimeDb, `users/${userId}/learning/courses/${courseId}`), {
      progress: progress,
      completedVideos: completedVideos,
      totalVideos: totalVideos,
      lastUpdated: Date.now()
    })
  } catch (error) {
    console.error('Error saving course progress to Firebase:', error)
  }
}

export const saveOverallProgressToFirebase = async (userId: string, overallProgress: number, courseProgress: any) => {
  try {
    await set(ref(realtimeDb, `users/${userId}/learning/overallProgress`), overallProgress)
    await update(ref(realtimeDb, `users/${userId}/learning`), {
      courses: courseProgress,
      lastUpdated: Date.now()
    })
  } catch (error) {
    console.error('Error saving overall progress to Firebase:', error)
  }
}

export const saveContinueLearningDataToFirebase = async (userId: string, courseId: string, videoId: string, lastWatchedTime: number) => {
  try {
    await set(ref(realtimeDb, `users/${userId}/learning/current`), {
      courseId: courseId,
      videoId: videoId,
      lastWatchedTime: lastWatchedTime,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error saving continue learning data to Firebase:', error)
  }
}

export const saveAlertToFirebase = async (userId: string, alertData: any) => {
  try {
    await push(ref(realtimeDb, `users/${userId}/alerts`), {
      type: alertData.type,
      message: alertData.message,
      courseId: alertData.courseId || '',
      videoId: alertData.videoId || '',
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error saving alert to Firebase:', error)
  }
}

export const listenToUserProgress = (userId: string, callback: (data: any) => void) => {
  if (!realtimeDb) {
    console.warn('Firebase Realtime Database not available for listening')
    return () => {} // Return empty function as fallback
  }

  const progressRef = ref(realtimeDb, `users/${userId}/learning`)
  const alertsRef = ref(realtimeDb, `users/${userId}/alerts`)
  
  const unsubscribeProgress = onValue(progressRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      callback(data)
    }
  }, (error) => {
    console.warn('Firebase progress listener error:', error)
  })

  return () => {
    unsubscribeProgress()
  }
}

export const getUserProgressFromFirebase = async (userId: string) => {
  try {
    if (!realtimeDb) {
      console.warn('Firebase Realtime Database not available')
      return null
    }
    
    const progressRef = ref(realtimeDb, `users/${userId}/learning`)
    const snapshot = await get(progressRef)
    return snapshot.val()
  } catch (error) {
    console.warn('Error getting user progress from Firebase:', error)
    return null
  }
}

// Firebase connection status
let firebaseConnectionStatus = 'checking'
let firebaseAvailable = false

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    if (!realtimeDb) {
      throw new Error('Realtime Database not initialized')
    }
    
    // Test with a simple write/read operation
    const testRef = ref(realtimeDb, 'connection-test')
    await set(testRef, { timestamp: Date.now() })
    const snapshot = await get(testRef)
    const data = snapshot.val()
    
    if (data && data.timestamp) {
      firebaseConnectionStatus = 'connected'
      firebaseAvailable = true
      console.log('Firebase Realtime Database connected successfully')
      return true
    } else {
      firebaseConnectionStatus = 'disconnected'
      firebaseAvailable = false
      console.warn('Firebase Realtime Database not connected')
      return false
    }
  } catch (error) {
    firebaseConnectionStatus = 'error'
    firebaseAvailable = false
    console.error('Firebase connection test failed:', error)
    return false
  }
}

export const isFirebaseAvailable = () => firebaseAvailable
export const getFirebaseConnectionStatus = () => firebaseConnectionStatus

// Initialize connection test
setTimeout(() => {
  testFirebaseConnection()
}, 1000)

export default app