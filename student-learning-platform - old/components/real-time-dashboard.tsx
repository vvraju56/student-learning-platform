"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCourseProgress } from "@/hooks/use-course-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  Target, 
  Award, 
  Lock,
  TrendingUp,
  Calendar,
  BarChart3,
  Video,
  Trophy
} from "lucide-react"

export function RealTimeDashboard() {
  const router = useRouter()
  const {
    coursesProgress,
    overallStats,
    isLoading,
    error,
    getCoursesByStatus,
    getNextVideo,
    isQuizUnlocked
  } = useCourseProgress()

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  
  const courseStatus = getCoursesByStatus()

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getStatusColor = (progress: number): string => {
    if (progress === 0) return "bg-gray-100 text-gray-700"
    if (progress === 100) return "bg-green-100 text-green-700"
    return "bg-blue-100 text-blue-700"
  }

  const getStatusIcon = (progress: number, quizUnlocked: boolean) => {
    if (progress === 100) {
      return quizUnlocked ? <Award className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />
    }
    if (progress > 0) {
      return <PlayCircle className="h-4 w-4" />
    }
    return <BookOpen className="h-4 w-4" />
  }

  const getStatusText = (progress: number, quizUnlocked: boolean): string => {
    if (progress === 100) {
      return quizUnlocked ? "Quiz Available" : "Completed"
    }
    if (progress > 0) {
      return "In Progress"
    }
    return "Not Started"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Dashboard Error</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Dashboard</h1>
          <p className="text-gray-600">Track your progress and unlock quizzes</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.overallProgress}%</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Progress value={overallStats.overallProgress} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Courses Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.completedCourses}/{overallStats.totalCourses}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <Progress 
                value={overallStats.totalCourses > 0 ? (overallStats.completedCourses / overallStats.totalCourses) * 100 : 0} 
                className="mt-3" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quiz Available</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.quizAvailableCourses}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <Badge variant="secondary" className="mt-3">
                {overallStats.completedQuizzes} completed
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Videos Watched</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.completedVideos}/{overallStats.totalVideos}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Video className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <Progress 
                value={overallStats.totalVideos > 0 ? (overallStats.completedVideos / overallStats.totalVideos) * 100 : 0} 
                className="mt-3" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Course Progress Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* In Progress Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                In Progress ({courseStatus.inProgress.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseStatus.inProgress.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No courses in progress</p>
                ) : (
                  courseStatus.inProgress.map((course) => {
                    const nextVideo = getNextVideo(course.courseId)
                    const isQuizUnlockedForCourse = course.quizUnlocked
                    
                    return (
                      <div key={course.courseId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{course.courseTitle}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getStatusColor(course.progress)}>
                                {getStatusIcon(course.progress, course.quizUnlocked)}
                                <span className="ml-1">{getStatusText(course.progress, course.quizUnlocked)}</span>
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {course.completedVideos}/{course.totalVideos} videos
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{course.progress}%</div>
                          </div>
                        </div>
                        
                        <Progress value={course.progress} className="mb-3" />
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {nextVideo && (
                              <span>Next: {nextVideo.title}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {nextVideo && (
                              <Button size="sm" variant="outline">
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Continue
                              </Button>
                            )}
                            {isQuizUnlockedForCourse && (
                              <Button size="sm">
                                <Target className="h-3 w-3 mr-1" />
                                Take Quiz
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Available Quizzes ({courseStatus.quizAvailable.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseStatus.quizAvailable.length === 0 ? (
                  <div className="text-center py-8">
                    <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">Complete all videos to unlock quizzes</p>
                    <p className="text-sm text-gray-400">20 MCQ + 2 Coding Questions per course</p>
                  </div>
                ) : (
                  courseStatus.quizAvailable.map((course) => (
                    <div key={course.courseId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{course.courseTitle}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Quiz Unlocked
                            </Badge>
                            {course.quizCompleted && (
                              <Badge className="bg-blue-100 text-blue-700">
                                Score: {course.quizScore}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Trophy className="h-8 w-8 text-yellow-500" />
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <div className="flex justify-between">
                          <span>20 MCQ Questions</span>
                          <span>2 Coding Questions</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => router.push(`/content/${course.id}/quiz`)}
                        >
                          {course.quizCompleted ? 'Retake Quiz' : 'Start Quiz'}
                        </Button>
                        {!course.quizCompleted && (
                          <Button variant="outline" size="sm">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Courses Grid */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(coursesProgress).map((course) => {
                const isQuizAvailable = course.quizUnlocked
                
                return (
                  <div key={course.courseId} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{course.courseTitle}</h3>
                      <Badge className={getStatusColor(course.progress)}>
                        {getStatusIcon(course.progress, course.quizUnlocked)}
                        <span className="ml-1 text-xs">{getStatusText(course.progress, course.quizUnlocked)}</span>
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.courseDescription}</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Videos</span>
                        <span className="font-medium">{course.completedVideos}/{course.totalVideos}</span>
                      </div>
                      
                      {course.estimatedTimeRemaining && course.progress < 100 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Est. Time</span>
                          <span className="font-medium">{formatTime(course.estimatedTimeRemaining)}</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-3">
                        {course.progress === 0 ? (
                          <Button size="sm" className="flex-1">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Start Course
                          </Button>
                        ) : course.progress < 100 ? (
                          <Button size="sm" className="flex-1">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Continue
                          </Button>
                        ) : (
                          <Button size="sm" className="flex-1" variant="outline">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        )}
                        
                        {isQuizAvailable && (
                          <Button size="sm" variant={course.quizCompleted ? "outline" : "default"}>
                            {course.quizCompleted ? (
                              <>
                                <Trophy className="h-3 w-3 mr-1" />
                                {course.quizScore}%
                              </>
                            ) : (
                              <>
                                <Target className="h-3 w-3 mr-1" />
                                Quiz
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}