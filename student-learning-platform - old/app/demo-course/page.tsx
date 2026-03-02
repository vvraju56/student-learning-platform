"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import AIMonitoringComponent from "@/components/ai-monitoring-system"
import { Play, Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface CourseVideo {
  id: string
  title: string
  url: string
  duration: number
}

interface CourseData {
  id: string
  title: string
  description: string
  videos: CourseVideo[]
}

// Mock course data - replace with your actual course data
const mockCourse: CourseData = {
  id: "demo-course",
  title: "AI Monitoring Demo Course",
  description: "Demonstration of AI monitoring system",
  videos: [
    {
      id: "video-1",
      title: "Introduction to AI Monitoring",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 3600 // 1 hour in seconds
    }
  ]
}

export default function AIMonitoredCoursePage() {
  const router = useRouter()
  const videoRef = useRef<HTMLIFrameElement>(null)
  
  const [course] = useState<CourseData>(mockCourse)
  const [currentVideoIndex] = useState(0)
  const [validWatchTime, setValidWatchTime] = useState(0)
  const [courseCompleted, setCourseCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  const currentVideo = course.videos[currentVideoIndex]

  // Handle progress updates from AI monitoring
  const handleProgressUpdate = (time: number) => {
    setValidWatchTime(time)
    
    // Mark course as completed after 80% of duration
    const completionThreshold = currentVideo.duration * 0.8
    if (time >= completionThreshold && !courseCompleted) {
      setCourseCompleted(true)
      console.log('🎓 Course completed!')
    }
  }

  // Simulate loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Monitoring System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600">{course.description}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/courses')}
          >
            Back to Courses
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Video Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {currentVideo.title}
                  </span>
                  {courseCompleted && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video">
                  <iframe
                    ref={videoRef}
                    src={`${currentVideo.url}?autoplay=0&mute=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&controls=0&modestbranding=1&rel=0`}
                    className="w-full h-full rounded-t-lg"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; microphone; camera; fullscreen"
                    title={currentVideo.title}
                    style={{ border: 'none' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Progress Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Progress Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Valid Watch Time */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Valid Watch Time</span>
                      <span className="text-sm text-gray-600">
                        {Math.floor(validWatchTime / 60)}m {validWatchTime % 60}s
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((validWatchTime / currentVideo.duration) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Total Duration */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Duration</span>
                    <span className="text-sm text-gray-600">
                      {Math.floor(currentVideo.duration / 60)}m {currentVideo.duration % 60}s
                    </span>
                  </div>

                  {/* Completion Status */}
                  <div className="flex items-center gap-2">
                    {validWatchTime >= currentVideo.duration * 0.8 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Course Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {Math.floor((currentVideo.duration * 0.8 - validWatchTime) / 60)}m remaining to complete
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Monitoring Panel */}
          <div className="lg:col-span-1">
            <AIMonitoringComponent
              videoRef={videoRef}
              userId="demo-user" // Replace with actual user ID
              courseId={course.id}
              videoId={currentVideo.id}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4 mt-12">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-600">
          <p>🎯 AI Monitoring ensures authentic learning by tracking attention and preventing cheating.</p>
          <p className="mt-1">Your privacy is protected - all processing happens locally in your browser.</p>
        </div>
      </div>
    </div>
  )
}