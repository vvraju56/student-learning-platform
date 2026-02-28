"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRealtimeAnalytics, type AnalyticsData, type CourseAnalytics } from "@/hooks/use-realtime-analytics"
import { useRealTimeCourseAnalytics, useRealTimeVideoAnalytics } from "@/hooks/use-real-time-analytics"
import { PerVideoProgressCard, VideoProgressGrid } from "@/components/per-video-progress-card"
import { courses } from "@/lib/courses-data"
import { 
  Clock, TrendingUp, Eye, AlertTriangle, Activity, 
  Monitor, Smartphone, Gamepad2, CheckCircle, XCircle,
  Play, Pause, Wifi, WifiOff, RefreshCw, Video, ChevronDown
} from "lucide-react"
import { auth } from "@/lib/firebase"

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0m"
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

function ProgressBar({ value, color = "blue" }: { value: number; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500"
  }
  
  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div 
        className={`${colorClasses[color] || colorClasses.blue} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

function LiveBadge({ isLive }: { isLive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isLive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
    }`}>
      <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
      {isLive ? "LIVE" : "OFFLINE"}
    </span>
  )
}

function CourseCard({ 
  title, 
  courseId, 
  data, 
  icon 
}: { 
  title: string
  courseId: string
  data: CourseAnalytics
  icon: React.ReactNode
}) {
  const progress = data?.progress || 0
  const completedVideos = data?.completedVideos || 0
  const totalVideos = data?.totalVideos || 10
  const timeSpent = data?.timeSpent || 0
  const quiz = data?.quiz
  
  const colorClass = progress >= 80 ? "green" : progress >= 50 ? "yellow" : progress >= 25 ? "blue" : "red"
  
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <span className="text-2xl font-bold">{Math.round(progress)}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Videos Completed</span>
            <span>{completedVideos} / {totalVideos}</span>
          </div>
          <ProgressBar value={(completedVideos / totalVideos) * 100} color={colorClass} />
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Time Spent</span>
          <span className="font-medium">{formatTime(timeSpent)}</span>
        </div>
        
        {quiz && (
          <div className="pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Quiz Status</span>
              {quiz.passed ? (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Passed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-yellow-400">
                  <XCircle className="w-4 h-4" />
                  {quiz.attempts > 0 ? "Needs Review" : "Not Attempted"}
                </span>
              )}
            </div>
            {quiz.attempts > 0 && (
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Score: {quiz.mcqScore + quiz.codingScore}/20</span>
                <span>Attempts: {quiz.attempts}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ExpandableCourseSection({ 
  courseTitle,
  courseId,
  icon,
  videoData 
}: { 
  courseTitle: string
  courseId: string
  icon: React.ReactNode
  videoData: Array<{
    videoId: string
    title: string
    progress: number
    watchTime: number
    duration: number
    violations: {
      tabSwitches: number
      faceMissingEvents: number
      autoPauses: number
      skipCount: number
    }
    lastSyncTime: number
  }>
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const completedCount = videoData.filter(v => v.progress >= 100).length
  const avgProgress = videoData.length > 0 
    ? Math.round(videoData.reduce((sum, v) => sum + v.progress, 0) / videoData.length)
    : 0
  
  return (
    <Card className="bg-gray-900/30 border-gray-800 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-900/50 transition-colors flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-100">{courseTitle}</h3>
            <p className="text-xs text-gray-500">
              {completedCount}/{videoData.length} videos completed • Avg {avgProgress}%
            </p>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-800 p-4 bg-gray-950/50">
          <VideoProgressGrid videos={videoData} />
        </div>
      )}
    </Card>
  )
}

function LiveStatusStrip({ live }: { live: AnalyticsData["live"] }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
      <LiveBadge isLive={live.monitoring} />
      
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${live.faceDetected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-gray-400">Camera:</span>
          <span className={live.faceDetected ? "text-green-400" : "text-red-400"}>
            {live.faceDetected ? "ON" : "OFF"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${live.faceDetected ? "bg-green-500" : "bg-yellow-500"}`} />
          <span className="text-gray-400">Face:</span>
          <span className={live.faceDetected ? "text-green-400" : "text-yellow-400"}>
            {live.faceDetected ? "Detected" : "Missing"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${live.tabActive ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-gray-400">Tab:</span>
          <span className={live.tabActive ? "text-green-400" : "text-red-400"}>
            {live.tabActive ? "Active" : "Inactive"}
          </span>
        </div>
        
        {live.currentCourse && (
          <div className="text-gray-400">
            Current: <span className="text-white font-medium">{live.currentCourse}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function FocusAnalyticsCard({ analytics }: { analytics: AnalyticsData["analytics"] }) {
  const focusPercent = analytics.focusScore || 0
  const focusedTime = analytics.focusTime || 0
  const totalTime = analytics.totalSessionTime || 1
  const distractedTime = totalTime - focusedTime
  
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-400" />
          Focus & Attention Analytics
        </CardTitle>
        <CardDescription>Real-time focus tracking metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#374151"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={focusPercent >= 80 ? "#22c55e" : focusPercent >= 50 ? "#eab308" : "#ef4444"}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(focusPercent / 100) * 440} 440`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{focusPercent}%</span>
              <span className="text-xs text-gray-400">Focus Score</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-lg font-bold text-green-400">{formatTime(focusedTime)}</div>
            <div className="text-xs text-gray-400">Focused Time</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-lg font-bold text-red-400">{formatTime(distractedTime)}</div>
            <div className="text-xs text-gray-400">Distracted Time</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Face Lost Count</span>
            <span className="font-medium text-yellow-400">{analytics.faceLostCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Tab Switches</span>
            <span className="font-medium text-red-400">{analytics.tabSwitchCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Auto-Pauses</span>
            <span className="font-medium text-orange-400">{analytics.autoPauseCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionTimeline({ events }: { events: AnalyticsData["sessionTimeline"] }) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "video_start":
      case "play":
        return <Play className="w-4 h-4 text-green-400" />
      case "video_pause":
      case "pause":
        return <Pause className="w-4 h-4 text-yellow-400" />
      case "face_lost":
        return <Eye className="w-4 h-4 text-red-400" />
      case "face_detected":
        return <Eye className="w-4 h-4 text-green-400" />
      case "tab_switch":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "quiz_start":
      case "quiz":
        return <Activity className="w-4 h-4 text-blue-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }
  
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Session Timeline
        </CardTitle>
        <CardDescription>Recent learning activities</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.slice(0, 10).map((event, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg text-sm"
              >
                {getEventIcon(event.type)}
                <div className="flex-1">
                  <span className="text-gray-300 capitalize">{event.type.replace(/_/g, " ")}</span>
                  {event.details && (
                    <span className="text-gray-500 ml-2">- {event.details}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const { 
    data, 
    isLoading, 
    isConnected, 
    error, 
    overallProgress,
    totalStudyTime,
    focusScore,
    totalViolations 
  } = useRealtimeAnalytics()

  const [userName, setUserName] = useState("Student")
  const [userId, setUserId] = useState<string | undefined>()
  
  // Real-time video analytics
  const { videoAnalytics, isLoading: videosLoading } = useRealTimeVideoAnalytics(userId)

  useEffect(() => {
    const user = auth.currentUser
    if (user?.displayName) {
      setUserName(user.displayName)
    } else if (user?.email) {
      setUserName(user.email.split("@")[0])
    }
    if (user?.uid) {
      setUserId(user.uid)
    }
  }, [])
  
  // Group video analytics by course
  const videosByCoarse = videoAnalytics.reduce((acc, video) => {
    if (!acc[video.courseId]) {
      acc[video.courseId] = []
    }
    acc[video.courseId].push({
      videoId: video.videoId,
      title: courses
        .find(c => c.id === video.courseId)
        ?.modules[0]?.videos.find(v => v.id === video.videoId)?.title || `Video ${video.videoId}`,
      progress: video.progress,
      watchTime: video.watchTime,
      duration: video.duration,
      violations: video.violations,
      lastSyncTime: video.lastSyncTime
    })
    return acc
  }, {} as Record<string, Array<{
    videoId: string
    title: string
    progress: number
    watchTime: number
    duration: number
    violations: {
      tabSwitches: number
      faceMissingEvents: number
      autoPauses: number
      skipCount: number
    }
    lastSyncTime: number
  }>>)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const displayData = data || {
    courses: {
      "web-development": { progress: 0, completedVideos: 0, totalVideos: 10, timeSpent: 0 },
      "app-development": { progress: 0, completedVideos: 0, totalVideos: 10, timeSpent: 0 },
      "game-development": { progress: 0, completedVideos: 0, totalVideos: 10, timeSpent: 0 }
    },
    analytics: { totalSessionTime: 0, focusTime: 0, faceLostCount: 0, tabSwitchCount: 0, autoPauseCount: 0, focusScore: 0 },
    live: { faceDetected: false, tabActive: true, currentCourse: "", currentVideo: "", monitoring: false },
    sessionTimeline: [],
    lastUpdated: Date.now()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400" />
              Reports & Analytics
            </h1>
            <p className="text-gray-400 mt-1">
              Real-time learning insights for {userName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <LiveBadge isLive={isConnected} />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Live Status Strip */}
        <div className="mb-6">
          <LiveStatusStrip live={displayData.live} />
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Study Time</p>
                  <p className="text-2xl font-bold">{formatTime(totalStudyTime)}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overall Progress</p>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <ProgressBar value={overallProgress} color="green" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Focus Score</p>
                  <p className="text-2xl font-bold">{focusScore}%</p>
                </div>
                <Eye className="w-8 h-8 text-purple-400" />
              </div>
              <ProgressBar value={focusScore} color="purple" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Violations</p>
                  <p className="text-2xl font-bold">{totalViolations}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Face Monitoring</p>
                  <p className="text-2xl font-bold">
                    {displayData.live.monitoring ? "Active" : "Inactive"}
                  </p>
                </div>
                <Activity className={`w-8 h-8 ${displayData.live.monitoring ? "text-green-400" : "text-gray-400"}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course-Wise Progress */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            Course-Wise Progress
            <span className="text-xs text-gray-500 font-normal">(Real-time)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CourseCard 
              title="Web Development" 
              courseId="web-development"
              data={displayData.courses["web-development"]}
              icon={<Monitor className="w-5 h-5 text-blue-400" />}
            />
            <CourseCard 
              title="App Development" 
              courseId="app-development"
              data={displayData.courses["app-development"]}
              icon={<Smartphone className="w-5 h-5 text-purple-400" />}
            />
            <CourseCard 
              title="Game Development" 
              courseId="game-development"
              data={displayData.courses["game-development"]}
              icon={<Gamepad2 className="w-5 h-5 text-green-400" />}
            />
          </div>
        </div>

        {/* Per-Video Progress */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" />
            Video-by-Video Progress
            <span className="text-xs text-gray-500 font-normal">(Click to expand)</span>
          </h2>
          
          {videosLoading ? (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-sm">Loading video analytics...</p>
            </div>
          ) : videoAnalytics.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="py-8 text-center">
                <p className="text-gray-400">No video progress data yet. Start watching videos to see detailed analytics here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(videosByCoarse).map(([courseId, videos]) => {
                const courseData = courses.find(c => c.id === courseId)
                const courseTitle = courseData?.title || courseId
                
                const iconMap: Record<string, React.ReactNode> = {
                  "web-development": <Monitor className="w-5 h-5 text-blue-400" />,
                  "app-development": <Smartphone className="w-5 h-5 text-purple-400" />,
                  "game-development": <Gamepad2 className="w-5 h-5 text-green-400" />
                }
                
                return (
                  <ExpandableCourseSection
                    key={courseId}
                    courseTitle={courseTitle}
                    courseId={courseId}
                    icon={iconMap[courseId] || <Video className="w-5 h-5 text-gray-400" />}
                    videoData={videos}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Focus Analytics & Session Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FocusAnalyticsCard analytics={displayData.analytics} />
          <SessionTimeline events={displayData.sessionTimeline} />
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Last updated: {new Date(displayData.lastUpdated).toLocaleString()}
        </div>

        {/* Debug Section */}
        <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Debug Info (click to expand)</h3>
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">View localStorage data</summary>
            <pre className="mt-2 p-2 bg-gray-800 rounded overflow-auto max-h-40">
              {typeof window !== 'undefined' ? JSON.stringify({
                course_progress_web: localStorage.getItem('course_progress_web-development'),
                course_progress_app: localStorage.getItem('course_progress_app-development'),
                course_progress_game: localStorage.getItem('course_progress_game-development'),
                videoKeys: Object.keys(localStorage).filter(k => k.startsWith('video_progress_')).slice(0, 5)
              }, null, 2) : 'Loading...'}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
