"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Lazy loading wrapper for Bootstrap components
const LazyVideoPlayerContent = dynamic(() => import('./video-player-content'), {
  loading: () => (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ backgroundColor: '#0f0f0f' }}>
      <div className="text-center">
        <Loader2 className="animate-spin text-primary mb-3" size={32} />
        <p className="text-white">Loading video player...</p>
      </div>
    </div>
  ),
  ssr: false
})

interface VideoPlayerPageProps {
  user: any
  courseId: string
  videoId: string
}

export default function VideoPlayerPage({ user, courseId, videoId }: VideoPlayerPageProps) {
  return (
    <Suspense fallback={
      <div className="min-vh-100 d-flex align-items-center justify-content-center" 
           style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mb-3" size={32} />
          <p className="text-white">Initializing video player...</p>
        </div>
      </div>
    }>
      <LazyVideoPlayerContent 
        user={user} 
        courseId={courseId} 
        videoId={videoId} 
      />
    </Suspense>
  )
}