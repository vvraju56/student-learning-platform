"use client"

import { useState, useEffect } from 'react'
import { ProgressStorage } from '@/lib/progress-storage'

export default function TestProgressPage() {
  const [userId] = useState('test-user-123')
  const [progressData, setProgressData] = useState<any>(null)
  const [courseData, setCourseData] = useState<any>(null)
  const [continueData, setContinueData] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    // Load and display all progress data
    const allProgress = ProgressStorage.getAllVideoProgress(userId)
    const webDevCourse = ProgressStorage.getCourseProgress(userId, 'web-dev')
    const continueLearning = ProgressStorage.getContinueLearningData(userId)

    setProgressData(allProgress)
    setCourseData(webDevCourse)
    setContinueData(continueLearning)

    ProgressStorage.debugStorage(userId)
  }, [userId, isClient])

  const generateTestData = () => {
    if (!isClient) return
    
    // Generate test progress data
    ProgressStorage.saveVideoProgress(userId, 'web-dev', 'web-dev-1', {
      videoId: 'web-dev-1',
      videoTitle: 'Introduction to HTML',
      courseId: 'web-dev',
      lastWatchedTime: Date.now(),
      lastPosition: 1200,
      totalDuration: 1800,
      completed: true,
      validWatchTime: 1800,
      videoIndex: 0,
      moduleNumber: 1
    })

    ProgressStorage.saveVideoProgress(userId, 'web-dev', 'web-dev-2', {
      videoId: 'web-dev-2',
      videoTitle: 'CSS Fundamentals',
      courseId: 'web-dev',
      lastWatchedTime: Date.now() - 60000,
      lastPosition: 900,
      totalDuration: 1800,
      completed: false,
      validWatchTime: 900,
      videoIndex: 1,
      moduleNumber: 1
    })

    ProgressStorage.saveVideoProgress(userId, 'android-dev', 'android-dev-1', {
      videoId: 'android-dev-1',
      videoTitle: 'Android Studio Setup',
      courseId: 'android-dev',
      lastWatchedTime: Date.now() - 120000,
      lastPosition: 600,
      totalDuration: 1200,
      completed: false,
      validWatchTime: 600,
      videoIndex: 0,
      moduleNumber: 1
    })

    // Refresh the data
    window.location.reload()
  }

  const clearData = () => {
    if (!isClient) return
    ProgressStorage.clearAllProgress(userId)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Progress Storage Test</h1>
        
        <div className="flex gap-4 mb-8">
          <button
            onClick={generateTestData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Generate Test Data
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Clear All Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">All Progress Data</h2>
            <pre className="text-xs text-gray-300 overflow-auto">
              {JSON.stringify(progressData, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Web Dev Course</h2>
            <pre className="text-xs text-gray-300 overflow-auto">
              {JSON.stringify(courseData, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
            <pre className="text-xs text-gray-300 overflow-auto">
              {JSON.stringify(continueData, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">localStorage Content</h2>
            <div className="text-xs text-gray-300 overflow-auto max-h-96">
              {isClient && Object.keys(localStorage)
                .filter(key => key.includes(userId))
                .map(key => (
                  <div key={key} className="mb-2">
                    <div className="font-mono text-blue-400">{key}</div>
                    <div className="text-gray-400 ml-4">
                      {localStorage.getItem(key)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}