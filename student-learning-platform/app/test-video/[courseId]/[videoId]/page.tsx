"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TestVideoPlayer } from "../../../../components/test-video-player"

export default function TestVideoPage({ params }: { params: { courseId: string, videoId: string } }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { courseId, videoId } = params

  useEffect(() => {
    // Mock user for testing
    setUser({
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User'
    })
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" 
           style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading test...</span>
          </div>
          <p className="mt-3 text-white">Loading test environment...</p>
        </div>
      </div>
    )
  }

  return <TestVideoPlayer user={user} courseId={courseId} videoId={videoId} />
}