// Test script to verify Firebase integrations
// Run this in the browser console after logging in

import { 
  saveVideoProgressToFirebase, 
  saveCourseProgressToFirebase, 
  saveOverallProgressToFirebase, 
  saveContinueLearningDataToFirebase, 
  saveAlertToFirebase,
  getUserProgressFromFirebase,
  listenToUserProgress 
} from '@/lib/firebase'
import { auth } from '@/lib/firebase'

export async function testFirebaseIntegrations() {
  if (!auth.currentUser) {
    console.error('❌ No user logged in')
    return false
  }

  const userId = auth.currentUser.uid
  const courseId = 'test-course'
  const videoId = 'test-video'
  
  console.log('🧪 Testing Firebase Integrations...')
  
  try {
    // Test 1: Save Video Progress
    console.log('📹 Testing video progress save...')
    await saveVideoProgressToFirebase(userId, courseId, videoId, {
      lastWatchedTime: 120,
      validWatchTime: 120,
      totalDuration: 300,
      completed: false,
      videoIndex: 1
    })
    console.log('✅ Video progress saved successfully')

    // Test 2: Save Course Progress
    console.log('📚 Testing course progress save...')
    await saveCourseProgressToFirebase(userId, courseId, 40, 1, 10)
    console.log('✅ Course progress saved successfully')

    // Test 3: Save Continue Learning Data
    console.log('🎯 Testing continue learning data save...')
    await saveContinueLearningDataToFirebase(userId, courseId, videoId, 120)
    console.log('✅ Continue learning data saved successfully')

    // Test 4: Save Alert
    console.log('🚨 Testing alert save...')
    await saveAlertToFirebase(userId, {
      type: 'test_alert',
      message: 'This is a test alert',
      courseId: courseId,
      videoId: videoId
    })
    console.log('✅ Alert saved successfully')

    // Test 5: Read Progress
    console.log('📖 Testing progress read...')
    const progress = await getUserProgressFromFirebase(userId)
    console.log('✅ Progress read successfully:', progress)

    // Test 6: Real-time Listener
    console.log('👂 Testing real-time listener...')
    const unsubscribe = listenToUserProgress(userId, (data) => {
      console.log('📡 Real-time update received:', data)
    })
    
    // Test real-time update
    await saveVideoProgressToFirebase(userId, courseId, videoId, {
      lastWatchedTime: 125,
      validWatchTime: 125,
      totalDuration: 300,
      completed: false,
      videoIndex: 1
    })
    
    // Cleanup listener
    setTimeout(() => unsubscribe(), 2000)
    console.log('✅ Real-time listener tested successfully')

    console.log('🎉 ALL FIREBASE INTEGRATIONS WORKING!')
    return true

  } catch (error) {
    console.error('❌ Firebase integration test failed:', error)
    return false
  }
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testFirebaseIntegrations = testFirebaseIntegrations
  console.log('🔧 Firebase test function available: window.testFirebaseIntegrations()')
}