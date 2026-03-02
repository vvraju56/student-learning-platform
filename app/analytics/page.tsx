"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { VideoAnalyticsDashboard } from "@/components/video-analytics-dashboard"
import { useMigrateOldData } from "@/hooks/use-migrate-old-data"
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react"

export default function AnalyticsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showMigrationStatus, setShowMigrationStatus] = useState(false)
  
  const migrationStatus = useMigrateOldData(user?.uid || "")

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/login")
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (isLoading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: "#0f0f0f" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f0f0f" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "#1a1a1a",
          borderBottom: "1px solid #2a2a2a"
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Learning Analytics
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Track your learning progress and performance
                </p>
              </div>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-gray-300 text-sm">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Migration Status Banner */}
      {migrationStatus.status !== "idle" && (
        <div className={`${
          migrationStatus.status === "completed"
            ? "bg-green-900 border-green-700"
            : migrationStatus.status === "error"
              ? "bg-red-900 border-red-700"
              : "bg-blue-900 border-blue-700"
        } border-t border-b p-4`}>
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-3">
            {migrationStatus.status === "migrating" && (
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            )}
            <span className={`text-sm ${
              migrationStatus.status === "completed"
                ? "text-green-200"
                : migrationStatus.status === "error"
                  ? "text-red-200"
                  : "text-blue-200"
            }`}>
              {migrationStatus.message}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <VideoAnalyticsDashboard userId={user?.uid} />

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* How it Works */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">
              How It Works
            </h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Watch videos and your progress is automatically tracked</li>
              <li>• Data syncs to Firebase every 5 minutes</li>
              <li>• Dashboard updates every 10 seconds locally</li>
              <li>• No manual saves required</li>
            </ul>
          </div>

          {/* Key Features */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">
              Key Features
            </h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>✓ Real-time progress tracking</li>
              <li>✓ Watch time analytics</li>
              <li>✓ Performance insights</li>
              <li>✓ Firebase cloud sync</li>
            </ul>
          </div>

          {/* Firebase Optimization */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">
              Free Tier Optimized
            </h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>✓ Minimal Firebase reads</li>
              <li>✓ Batched writes every 5 min</li>
              <li>✓ Local data caching</li>
              <li>✓ Efficient sync strategy</li>
            </ul>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">
            💡 Optimization Tips
          </h3>
          <p className="text-blue-200 text-sm mb-4">
            This analytics system is optimized for Firebase's free tier:
          </p>
          <ul className="text-blue-200 text-sm space-y-2">
            <li>
              • Dashboard data is stored locally and updated every 10 seconds
            </li>
            <li>
              • Firebase syncs happen every 5 minutes with only essential data
            </li>
            <li>
              • Multiple videos can be tracked simultaneously without overload
            </li>
            <li>
              • Local storage ensures dashboard works offline until next sync
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
