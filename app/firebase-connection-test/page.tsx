// Simple Firebase Connection Test
"use client"

import { useState, useEffect } from 'react'
import { realtimeDb, testFirebaseConnection, getFirebaseConnectionStatus } from '@/lib/firebase'

export default function FirebaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...')
  const [testResults, setTestResults] = useState<string[]>([])

  const runConnectionTest = async () => {
    const results: string[] = []
    
    try {
      results.push('🔍 Testing Firebase connection...')
      
      // Test connection
      const isConnected = await testFirebaseConnection()
      const status = getFirebaseConnectionStatus()
      
      if (isConnected) {
        results.push('✅ Firebase Realtime Database connected successfully')
        results.push(`🔗 Connection status: ${status}`)
        
        // Test write operation
        try {
          const { ref, set } = await import('@/lib/firebase')
          const testRef = ref(realtimeDb, 'test/connection')
          await set(testRef, { test: 'connection_test', timestamp: Date.now() })
          results.push('✅ Write operation successful')
        } catch (writeError) {
          results.push(`❌ Write operation failed: ${writeError}`)
        }
        
      } else {
        results.push('❌ Firebase Realtime Database connection failed')
        results.push(`🔗 Connection status: ${status}`)
        results.push('⚠️ Using localStorage fallback mode')
      }
      
      results.push('')
      results.push('📊 Firebase Configuration:')
      results.push(`  - Project ID: student-learing-56`)
      results.push(`  - Database URL: https://student-learing-56-default-rtdb.firebaseio.com/`)
      results.push(`  - Realtime DB: ${realtimeDb ? 'Available' : 'Not Available'}`)
      
    } catch (error) {
      results.push(`❌ Connection test error: ${error}`)
    }
    
    setTestResults(results)
    setConnectionStatus(isConnected ? 'Connected' : 'Disconnected')
  }

  useEffect(() => {
    runConnectionTest()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔥 Firebase Connection Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Connection Status</h2>
            <div className={`text-center py-8 px-4 rounded-lg ${
              connectionStatus === 'Connected' 
                ? 'bg-green-100 border-green-300' 
                : 'bg-red-100 border-red-300'
            }`}>
              <div className={`text-2xl font-bold ${
                connectionStatus === 'Connected' ? 'text-green-800' : 'text-red-800'
              }`}>
                {connectionStatus === 'Connected' ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {connectionStatus === 'Connected' 
                  ? 'Firebase Realtime Database is working' 
                  : 'Using localStorage fallback mode'}
              </p>
            </div>
            <button 
              onClick={runConnectionTest}
              className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              🔄 Test Connection
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
            <div className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-gray-700">
                  {result}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">📝 Connection Information</h3>
          <div className="text-blue-700 space-y-2">
            <p><strong>Firebase Status:</strong> {connectionStatus}</p>
            <p><strong>Database Type:</strong> Realtime Database + Firestore</p>
            <p><strong>Fallback Mode:</strong> LocalStorage (always available)</p>
            <p><strong>Auto-Switch:</strong> Yes - if Firebase fails, automatically uses localStorage</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">✅ If Connected</h3>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                📊 View Dashboard
              </button>
              <button 
                onClick={() => window.location.href = '/lecture/web-development'}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                🎥 Start Learning
              </button>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ If Disconnected</h3>
            <div className="text-yellow-700 space-y-2">
              <p><strong>No Problem!</strong> App works offline</p>
              <p><strong>Features Available:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>All video progress saved locally</li>
                <li>Dashboard loads from localStorage</li>
                <li>Continue learning works</li>
                <li>Real-time updates (local)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}