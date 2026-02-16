"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  uid: string
  email: string
  displayName?: string
}

interface Profile {
  name?: string
  role?: string
}

interface SimpleStudentDashboardProps {
  user: User
  profile: Profile | null
  handleLogout: () => void
}

export function SimpleStudentDashboard({ user, profile, handleLogout }: SimpleStudentDashboardProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">Welcome back, {user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">View Courses</h3>
            <p className="text-gray-400 mb-4">Browse available courses</p>
            <button 
              onClick={() => router.push('/courses')}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Courses
            </button>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Profile</h3>
            <p className="text-gray-400 mb-4">View your profile and account details</p>
            <button 
              onClick={() => router.push('/profile')}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Profile
            </button>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Reports</h3>
            <p className="text-gray-400 mb-4">View your learning reports and analytics</p>
            <button 
              onClick={() => router.push('/reports')}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}