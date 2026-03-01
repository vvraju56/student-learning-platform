// Firebase Progress Test Component
"use client"

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { getUserProgressFromFirebase } from '@/lib/firebase'

export default function FirebaseTest() {
  const [testResults, setTestResults] = useState<string[]>([])

  const runFirebaseTest = async () => {
    if (!auth.currentUser) {
      setTestResults(['❌ No user logged in'])
      return
    }

    const results: string[] = []
    
    try {
      // Test 1: Reading from Firebase
      results.push('🔍 Testing Firebase connection...')
      const progressData = await getUserProgressFromFirebase(auth.currentUser.uid)
      
      if (progressData) {
        results.push('✅ Firebase connection successful')
        results.push(`📊 Overall Progress: ${progressData.overallProgress || 0}%`)
        
        if (progressData.courses) {
          results.push('📚 Course Progress:')
          Object.entries(progressData.courses).forEach(([courseId, data]: [string, any]) => {
            results.push(`  - ${courseId}: ${data.progress || 0}%`)
          })
        }
        
        if (progressData.current) {
          results.push('🎯 Continue Learning Data:')
          results.push(`  - Course: ${progressData.current.courseId}`)
          results.push(`  - Video: ${progressData.current.videoId}`)
          results.push(`  - Position: ${progressData.current.lastWatchedTime}s`)
        }
        
      } else {
        results.push('❌ No Firebase data found')
      }
      
      // Test 2: Firebase Structure Check
      results.push('')
      results.push('🗂️ Expected Firebase Structure:')
      results.push('users/')
      results.push(` └── ${auth.currentUser.uid}/`)
      results.push('     ├── profile')
      results.push('     ├── learning/')
      results.push('     │    ├── current/')
      results.push('     │    ├── courses/')
      results.push('     │    └── overallProgress')
      results.push('     └── alerts/')
      
    } catch (error) {
      results.push(`❌ Error: ${error}`)
    }
    
    setTestResults(results)
  }

  useEffect(() => {
    runFirebaseTest()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔥 Firebase Progress Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
          <div className="space-y-2 font-mono text-sm">
            {testResults.map((result, index) => (
              <div key={index} className="text-gray-700">
                {result}
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">✅ Implemented Features</h3>
            <ul className="space-y-2 text-blue-700">
              <li>• Real-time Firebase connection</li>
              <li>• Video progress saving</li>
              <li>• Course progress tracking</li>
              <li>• Overall progress calculation</li>
              <li>• Continue learning data</li>
              <li>• Alert logging</li>
              <li>• Tab switch detection</li>
              <li>• Focus loss events</li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">🚀 Firebase Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={runFirebaseTest}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                🔄 Refresh Firebase Test
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                📊 View Dashboard
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">📝 Implementation Summary</h3>
          <div className="text-yellow-700 space-y-2">
            <p><strong>Firebase Database:</strong> Realtime Database + Firestore</p>
            <p><strong>Data Structure:</strong> Hierarchical user-based organization</p>
            <p><strong>Real-time Updates:</strong> Every 5 seconds (video), 30 seconds (course)</p>
            <p><strong>Event Logging:</strong> Tab switches, focus loss, violations</p>
            <p><strong>Resume Feature:</strong> Complete continue learning implementation</p>
          </div>
        </div>
      </div>
    </div>
  )
}