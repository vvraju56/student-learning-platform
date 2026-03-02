"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { courses } from "@/lib/courses-data"
import { FirebaseProgressManager } from "@/lib/firebase-progress"
import { Play, Monitor, Smartphone, Target, ArrowLeft, Clock, Video } from "lucide-react"

const courseIcons: { [key: string]: { icon: JSX.Element; color: string } } = {
  'web-development': { icon: <Monitor className="w-8 h-8" />, color: 'text-blue-500' },
  'app-development': { icon: <Smartphone className="w-8 h-8" />, color: 'text-green-500' },
  'game-development': { icon: <Target className="w-8 h-8" />, color: 'text-red-500' },
}

export default function CourseSelectPage() {
  const router = useRouter()
  const [courseProgress, setCourseProgress] = useState<{[key: string]: {progress: number, completedVideos: number, totalVideos: number}}>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const localCourseProgress: {[key: string]: {progress: number, completedVideos: number, totalVideos: number}} = {}
        
        for (const course of courses) {
          const courseId = course.id
          const totalVideosInCourse = course.modules[0]?.videos?.length || 0
          const localData = localStorage.getItem(`course_progress_${courseId}`)
          
          let completedVideos = 0
          if (localData) {
            try {
              const parsed = JSON.parse(localData)
              completedVideos = Array.isArray(parsed.completedVideos) ? parsed.completedVideos.length : (parsed.completedVideos || 0)
            } catch (e) {
              completedVideos = 0
            }
          }
          
          const progress = totalVideosInCourse > 0 ? (completedVideos / totalVideosInCourse) * 100 : 0
          
          localCourseProgress[courseId] = {
            progress,
            completedVideos,
            totalVideos: totalVideosInCourse
          }
        }
        
        setCourseProgress(localCourseProgress)
      } catch (error) {
        console.error('Error loading progress:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProgress()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Select a Course</h1>
          <p className="text-gray-400">Choose a course to start or continue your learning journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progressData = courseProgress[course.id] || { progress: 0, completedVideos: 0, totalVideos: 0 }
            const iconData = courseIcons[course.id] || { icon: <Video className="w-8 h-8" />, color: 'text-blue-500' }
            const totalVideos = course.modules[0]?.videos?.length || 0
            
            return (
              <Card 
                key={course.id} 
                className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
                onClick={() => router.push(`/lecture/${course.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-3 rounded-lg bg-gray-800 ${iconData.color}`}>
                      {iconData.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white">{course.title}</CardTitle>
                      <CardDescription className="text-gray-400">{course.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">{course.description}</p>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <Video className="w-4 h-4" />
                    <span>{totalVideos} video lessons</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4" />
                    <span>{Math.round(totalVideos * 30)} min total</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">{Math.round(progressData.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressData.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {progressData.completedVideos} of {progressData.totalVideos} videos completed
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/lecture/${course.id}`)
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {progressData.progress > 0 ? 'Continue Learning' : 'Start Course'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
