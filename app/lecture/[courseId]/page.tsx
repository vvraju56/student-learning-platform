"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { courses } from "@/lib/courses-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Clock, CheckCircle, AlertCircle, Wifi, Activity, BellRing } from "lucide-react"
import { auth, saveVideoProgressToFirestore } from "@/lib/firebase"
import { ProgressStorage } from "@/lib/progress-storage"
import { useHardwareMonitoring } from "@/hooks/use-hardware-monitoring"
import FaceMonitoringComponent from "@/components/face-monitoring-system"

export default function LecturePage() {
  const params = useParams(); const router = useRouter(); const courseId = params.courseId as string
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => auth.onAuthStateChanged(u => setUserId(u?.uid || null)), [])

  const [sessionTime, setSessionTime] = useState(0)
  const [timeLimitReached, setTimeLimitReached] = useState(false)
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [completedVideos, setCompletedVideos] = useState<Set<number>>(new Set())
  const [videoPlaying, setVideoPlaying] = useState(false)

  const videoIframeRef = useRef<HTMLIFrameElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const monitoringActionsRef = useRef<{ setVideoPlaying: (p: boolean) => void } | null>(null)

  const { hardwareStatus, isOnline: hardwareOnline, isMotionDetected, motionDuration, motionViolation, isMotionSensorStale, hardwareError } = useHardwareMonitoring({ userId: userId || "", motionThresholdMs: 5000 })

  useEffect(() => {
    if (courseId && userId) {
      const saved = ProgressStorage.getRawCourseProgress(userId, courseId)
      if (saved?.completedVideos) setCompletedVideos(new Set(saved.completedVideos))
      const savedTime = ProgressStorage.getSessionTime(userId, courseId, currentVideoIndex.toString())
      if (savedTime > 0) setSessionTime(savedTime)
    }
  }, [courseId, userId, currentVideoIndex])

  useEffect(() => {
    if (courseId && course && userId) {
      const total = course.modules[0]?.videos?.length || 0
      ProgressStorage.saveCourseProgress(userId, courseId, { completedVideos: [...completedVideos], totalVideos: total, progress: total > 0 ? Math.round((completedVideos.size / total) * 100) : 0 })
    }
  }, [courseId, userId, completedVideos, course])

  useEffect(() => {
    const selected = courses.find(c => c.id === courseId)
    if (selected) setCourse(selected)
    setLoading(false); setSessionTime(0); setTimeLimitReached(false)
  }, [courseId, currentVideoIndex])

  // Sync YouTube state
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === 'string' && e.data.includes('infoDelivery')) {
        try {
          const data = JSON.parse(e.data)
          if (data.event === 'infoDelivery' && data.info?.playerState !== undefined) {
            const isPlaying = data.info.playerState === 1
            setVideoPlaying(isPlaying)
            monitoringActionsRef.current?.setVideoPlaying(isPlaying)
          }
        } catch {}
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])


  const handleProgressUpdate = useCallback((validTime: number) => {
    setSessionTime(validTime)
    const total = course?.modules?.[0]?.videos?.[currentVideoIndex]?.duration || 1800
    if (validTime >= total && !timeLimitReached) {
      setTimeLimitReached(true); setCompletedVideos(prev => new Set(prev).add(currentVideoIndex))
      if (currentVideoIndex < (course?.modules?.[0]?.videos?.length || 0) - 1) setTimeout(() => setCurrentVideoIndex(p => p + 1), 2000)
    }
  }, [course, currentVideoIndex, timeLimitReached])

  const currentVideo = course?.modules?.[0]?.videos?.[currentVideoIndex]
  const isYouTube = currentVideo?.url?.includes('youtube.com') || currentVideo?.url?.includes('youtu.be')
  const isGoogleDrive = currentVideo?.url?.includes('drive.google.com')

  const pauseCurrentVideo = useCallback(() => {
    console.log('pauseCurrentVideo called')
    if (isYouTube && videoIframeRef.current) {
      videoIframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    }
    if (!isYouTube && !isGoogleDrive && localVideoRef.current) {
      localVideoRef.current.pause()
    }
    setVideoPlaying(false)
    monitoringActionsRef.current?.setVideoPlaying(false)
  }, [isYouTube, isGoogleDrive])

  const resumeCurrentVideo = useCallback(() => {
    if (isYouTube && videoIframeRef.current) {
      videoIframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
    }
    if (!isYouTube && !isGoogleDrive && localVideoRef.current) {
      void localVideoRef.current.play()
    }
    setVideoPlaying(true); monitoringActionsRef.current?.setVideoPlaying(true)
  }, [isYouTube, isGoogleDrive])

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><Monitor className="h-12 w-12 animate-pulse" /></div>
  if (!course) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><Button onClick={() => router.push('/courses')}>Back</Button></div>

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-xl font-bold">{course.title}</h1><p className="text-gray-400 text-sm">{currentVideo?.title}</p></div>
        <Badge variant={hardwareOnline ? "default" : "destructive"}>ESP32 {hardwareOnline ? "Online" : "Offline"}</Badge>
      </header>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        <div className="flex-1 p-6">
          <div className="video-container relative bg-black aspect-video rounded-lg overflow-hidden mb-4">
            {isYouTube ? (
              <iframe ref={videoIframeRef} src={`${currentVideo.url}${currentVideo.url.includes('?') ? '&' : '?'}enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`} className="absolute inset-0 w-full h-full" allowFullScreen />
            ) : isGoogleDrive ? (
              <iframe ref={videoIframeRef} src={currentVideo.url} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
            ) : (
              <video ref={localVideoRef} src={currentVideo.url} className="w-full h-full" controls onPlay={() => { setVideoPlaying(true); monitoringActionsRef.current?.setVideoPlaying(true) }} onPause={() => { setVideoPlaying(false); monitoringActionsRef.current?.setVideoPlaying(false) }} />
            )}
          </div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400">
              Video {currentVideoIndex + 1} of {course.modules[0]?.videos?.length || 0}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))} disabled={currentVideoIndex === 0}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentVideoIndex(Math.min(course.modules[0]?.videos?.length - 1 || 0, currentVideoIndex + 1))} disabled={currentVideoIndex >= (course.modules[0]?.videos?.length || 1) - 1}>
                Next
              </Button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 text-sm text-gray-400">
            <Clock className="h-4 w-4" /><span>{Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')} / {Math.floor((currentVideo?.duration || 0) / 60)}:{(currentVideo?.duration || 0) % 60}</span>
            <CheckCircle className={`h-4 w-4 ${completedVideos.has(currentVideoIndex) ? "text-green-500" : "text-gray-500"}`} /><span>{completedVideos.has(currentVideoIndex) ? "Completed" : "In Progress"}</span>
          </div>
        </div>
        <div className="w-full lg:w-96 bg-gray-800 p-4 border-l border-gray-700">
          <FaceMonitoringComponent
            videoRef={videoIframeRef} userId={userId || ""} courseId={courseId} videoId={`video-${currentVideoIndex}`}
            onProgressUpdate={handleProgressUpdate}
            externalPauseCondition={!hardwareOnline || motionViolation}
            onPauseRequest={pauseCurrentVideo} onResumeRequest={resumeCurrentVideo}
            onActionsReady={a => { monitoringActionsRef.current = a; a.setVideoPlaying(videoPlaying) }}
          />
          <div className={`mt-4 p-3 rounded-lg border ${hardwareOnline && !motionViolation ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-2"><Wifi className={`h-4 w-4 ${hardwareOnline ? "text-green-600" : "text-red-600"}`} /><span className="font-medium text-sm text-gray-900">ESP32 {hardwareOnline ? "Online" : "Offline"}</span></div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600"><Activity className={`h-3 w-3 ${isMotionDetected ? "text-blue-600" : "text-gray-400"}`} /><span>{isMotionDetected ? `Motion active` : "No motion"}</span></div>
            {motionViolation && <p className="text-xs text-red-600 mt-1 font-bold">Excessive movement!</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
