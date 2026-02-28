import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore'
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

export const saveVideoProgressToFirestore = async (userId: string, data: {
  videoId: string
  courseId: string
  videoTitle: string
  completed: boolean
  watchTime: number
  totalDuration: number
}) => {
  try {
    const docRef = doc(collection(db, 'video_progress'))
    await setDoc(docRef, {
      user_id: userId,
      video_id: data.videoId,
      course_id: data.courseId,
      video_title: data.videoTitle,
      completed: data.completed,
      watch_time: data.watchTime,
      total_duration: data.totalDuration,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    console.log('✅ Video progress saved to Firestore')
    return true
  } catch (error) {
    console.error('❌ Failed to save video progress to Firestore:', error)
    return false
  }
}

export const saveQuizAttemptToFirestore = async (userId: string, data: {
  courseId: string
  courseName: string
  moduleNumber: number
  mcqScore: number
  codingScore: number
  totalScore: number
  totalMarks: number
  passed: boolean
}) => {
  try {
    const docRef = await addDoc(collection(db, 'quiz_attempts'), {
      user_id: userId,
      course_id: data.courseId,
      course_name: data.courseName,
      module_number: data.moduleNumber,
      mcq_score: data.mcqScore,
      coding_score: data.codingScore,
      total_score: data.totalScore,
      total_marks: data.totalMarks,
      passed: data.passed,
      created_at: serverTimestamp()
    })
    console.log('✅ Quiz attempt saved to Firestore')
    return docRef.id
  } catch (error) {
    console.error('❌ Failed to save quiz attempt to Firestore:', error)
    return null
  }
}

export const saveFocusAnalyticsToFirestore = async (userId: string, data: {
  courseId: string
  attentionScore: number
  sessionDuration: number
  violations: { tabSwitch: number; faceMissing: number; postureIssues: number }
}) => {
  try {
    const docRef = await addDoc(collection(db, 'focus_analytics'), {
      user_id: userId,
      course_id: data.courseId,
      attention_score: data.attentionScore,
      session_duration: data.sessionDuration,
      tab_switch_count: data.violations.tabSwitch,
      face_missing_count: data.violations.faceMissing,
      posture_issues_count: data.violations.postureIssues,
      created_at: serverTimestamp()
    })
    console.log('✅ Focus analytics saved to Firestore')
    return docRef.id
  } catch (error) {
    console.error('❌ Failed to save focus analytics to Firestore:', error)
    return null
  }
}

setTimeout(() => {
  testFirebaseConnection()
}, 1000)

export default app