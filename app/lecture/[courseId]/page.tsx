"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { courses } from "@/lib/courses-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Monitor, Camera, Clock, CheckCircle, AlertCircle,
  Eye, Play, X, Wifi, Activity, BellRing
} from "lucide-react"
import { useFaceDetection } from "@/hooks/use-face-detection"
import { auth, saveAlertToFirebase, saveVideoProgressToFirestore } from "@/lib/firebase"
import { ProgressStorage } from "@/lib/progress-storage"
import { useHardwareMonitoring } from "@/hooks/use-hardware-monitoring"
import { FaceMonitoringStatus } from "@/components/face-monitoring-status"

export default function LecturePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  // User state
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        setUserId(null)
        // Optionally redirect to login if not authenticated
      }
    })
    return () => unsubscribe()
  }, [])

  // Core monitoring states
  const [monitoringActive, setMonitoringActive] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [timeLimitReached, setTimeLimitReached] = useState(false)
  const [courseBlocked, setCourseBlocked] = useState(false)
  const [faceNotDetectedCountdown, setFaceNotDetectedCountdown] = useState<number | null>(null)
  
  // Course data
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [watchTime, setWatchTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(1800)
  const [completedVideos, setCompletedVideos] = useState<Set<number>>(new Set())

  // Load saved progress from localStorage
  useEffect(() => {
    if (courseId && userId) {
      // Load completed videos
      const saved = ProgressStorage.getRawCourseProgress(userId, courseId)
      if (saved) {
        try {
          if (saved.completedVideos && Array.isArray(saved.completedVideos)) {
            setCompletedVideos(new Set(saved.completedVideos))
          }
        } catch (e) {
          console.error("Failed to load progress:", e)
        }
      }

      // Load saved session time for current video
      const savedTime = ProgressStorage.getSessionTime(userId, courseId, currentVideoIndex.toString())
      if (savedTime > 0) {
        setSessionTime(savedTime)
        console.log(`📺 Resuming from saved time: ${savedTime}s`)
      }
    }
  }, [courseId, userId, currentVideoIndex])

  // Save progress to localStorage when completedVideos changes
  useEffect(() => {
    if (courseId && course && userId) {
      const totalVideos = course.modules[0]?.videos?.length || 0
      const progressPercent = totalVideos > 0 ? Math.round((completedVideos.size / totalVideos) * 100) : 0
      
      const progressData = {
        completedVideos: [...completedVideos],
        totalVideos: totalVideos,
        progress: progressPercent
      }
      
      // Save in format expected by courses page
      ProgressStorage.saveCourseProgress(userId, courseId, progressData)
      console.log("💾 Progress saved:", progressData)
      
      // Save to Firestore for profile stats
      completedVideos.forEach(async (videoIdx) => {
        const video = course.modules?.[0]?.videos?.[videoIdx]
        if (video) {
          await saveVideoProgressToFirestore(userId, {
            videoId: `video-${videoIdx}`,
            courseId: courseId,
            videoTitle: video.title || `Video ${videoIdx + 1}`,
            completed: true,
            watchTime: video.duration || 0,
            totalDuration: video.duration || 0
          })
        }
      })
    }
  }, [courseId, userId, completedVideos, course])

  // Save session time periodically
  useEffect(() => {
    if (courseId && userId && sessionTime > 0) {
      const saveInterval = setInterval(() => {
        ProgressStorage.saveSessionTime(userId, courseId, currentVideoIndex.toString(), sessionTime)
      }, 5000)
      return () => clearInterval(saveInterval)
    }
  }, [courseId, userId, currentVideoIndex, sessionTime])

  // Clear saved session time when video is completed
  useEffect(() => {
    if (timeLimitReached && courseId && userId) {
      ProgressStorage.deleteSessionTime(userId, courseId, currentVideoIndex.toString())
    }
  }, [timeLimitReached, courseId, userId, currentVideoIndex])

  // Face detection hook
  const { 
    isFaceDetected, 
    isWebcamActive: cameraActive, 
    startWebcam, 
    stopWebcam, 
    faceDetectionError,
    videoStream
  } = useFaceDetection()
  
  const previewVideoRef = useRef<HTMLVideoElement>(null)

  const videoRef = useRef<HTMLIFrameElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastAlertReasonRef = useRef<string>("")

  const {
    hardwareStatus,
    isOnline: hardwareOnline,
    isMotionDetected,
    motionDuration,
    motionViolation,
    isMotionSensorStale,
    connectionAgeMs,
    hardwareError,
    triggerAlert: triggerHardwareAlert,
    clearAlert: clearHardwareAlert
  } = useHardwareMonitoring({
    userId: userId || "",
    motionThresholdMs: 5000,
    heartbeatTimeoutMs: 7000,
    sensorTimeoutMs: 15000
  })

  const motionSeconds = Math.floor(motionDuration / 1000)

  // Load course data
  useEffect(() => {
    const selectedCourse = courses.find((c) => c.id === courseId)
    if (selectedCourse) {
      setCourse(selectedCourse)
      if (selectedCourse.modules[0]?.videos[currentVideoIndex]) {
        setTotalDuration(selectedCourse.modules[0].videos[currentVideoIndex].duration)
      }
    }
    setLoading(false)
    setSessionTime(0)
    setTimeLimitReached(false)
  }, [courseId, currentVideoIndex])

  // Tab visibility detection (avoid iframe blur false-positives).
  useEffect(() => {
    const syncVisibility = () => {
      const isVisible = !document.hidden
      const hasFocus = typeof document.hasFocus === "function" ? document.hasFocus() : true
      const visible = isVisible && hasFocus
      setTabVisible(visible)
      console.log("👁️ Tab visibility:", visible ? "VISIBLE" : "HIDDEN")
    }

    syncVisibility()
    document.addEventListener("visibilitychange", syncVisibility)
    window.addEventListener("focus", syncVisibility)
    const poll = setInterval(syncVisibility, 1000)

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility)
      window.removeEventListener("focus", syncVisibility)
      clearInterval(poll)
    }
  }, [])

  // Attach video stream to preview element
  useEffect(() => {
    if (videoStream && previewVideoRef.current) {
      previewVideoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  // Face countdown timer - 5 seconds before pausing learning
  useEffect(() => {
    if (!monitoringActive || !cameraActive) {
      setFaceNotDetectedCountdown(null)
      return
    }

    if (!isFaceDetected) {
      if (faceNotDetectedCountdown === null) {
        setFaceNotDetectedCountdown(5)
      }
    } else {
      if (faceNotDetectedCountdown !== null) {
        setFaceNotDetectedCountdown(null)
      }
    }
  }, [monitoringActive, cameraActive, isFaceDetected, faceNotDetectedCountdown])

  useEffect(() => {
    if (faceNotDetectedCountdown !== null && faceNotDetectedCountdown > 0) {
      const timer = setTimeout(() => {
        setFaceNotDetectedCountdown(faceNotDetectedCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [faceNotDetectedCountdown])

  // Only show blocked overlay after we've tried to start camera and failed
  const showBlockedOverlay = courseBlocked && faceDetectionError && faceDetectionError.includes("denied")

  // MASTER ENFORCEMENT FLAG - Source of Truth
  const isFaceReallyMissing = isFaceDetected === false && faceNotDetectedCountdown === 0
  const hardwareReady = hardwareOnline && !motionViolation && !isMotionSensorStale
  const canCountSession =
    monitoringActive &&
    cameraActive &&
    !isFaceReallyMissing &&
    tabVisible &&
    hardwareReady &&
    videoPlaying &&
    !timeLimitReached

  const pushHardwareAlert = useCallback(async (reason: string, options?: { led?: boolean; buzzer?: boolean }) => {
    if (!userId || !monitoringActive) return
    if (lastAlertReasonRef.current === reason) return

    lastAlertReasonRef.current = reason

    const reasonMessageMap: Record<string, string> = {
      offline: "ESP32 connection lost. Monitoring paused.",
      sensor_stale: "Motion sensor data is stale.",
      excessive_movement: "Excessive movement detected for 5+ seconds.",
      tab_switch: "Tab switch detected during monitored lecture.",
      face_lost: "Face missing for 5+ seconds during monitored lecture."
    }

    try {
      await triggerHardwareAlert(reason, options)
      await saveAlertToFirebase(userId, {
        type: `hardware_${reason}`,
        message: reasonMessageMap[reason] || reason,
        courseId,
        videoId: `video-${currentVideoIndex}`
      })
    } catch (error) {
      console.error("Failed to push hardware alert:", error)
    }
  }, [userId, monitoringActive, triggerHardwareAlert, courseId, currentVideoIndex])

  useEffect(() => {
    if (!monitoringActive) return

    if (!hardwareOnline) {
      void pushHardwareAlert("offline", { led: true, buzzer: true })
      return
    }

    if (isMotionSensorStale) {
      void pushHardwareAlert("sensor_stale", { led: true, buzzer: false })
      return
    }

    if (motionViolation) {
      void pushHardwareAlert("excessive_movement", { led: true, buzzer: true })
      return
    }

    if (!tabVisible) {
      void pushHardwareAlert("tab_switch", { led: false, buzzer: true })
      return
    }

    if (isFaceReallyMissing) {
      void pushHardwareAlert("face_lost", { led: true, buzzer: true })
      return
    }

    if (lastAlertReasonRef.current) {
      lastAlertReasonRef.current = ""
      void clearHardwareAlert()
    }
  }, [
    monitoringActive,
    hardwareOnline,
    isMotionSensorStale,
    motionViolation,
    tabVisible,
    isFaceReallyMissing,
    pushHardwareAlert,
    clearHardwareAlert
  ])

  // SESSION TIMER - Only increments when ALL conditions are met
  useEffect(() => {
    if (canCountSession) {
      console.log("⏱️ Timer running - all conditions met")
      
      timerIntervalRef.current = setInterval(() => {
        setSessionTime((prev) => {
          if (prev >= totalDuration) {
            setTimeLimitReached(true)
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current)
              timerIntervalRef.current = null
            }
            console.log(`⏱️ TIME LIMIT REACHED - ${totalDuration} seconds`)
            
            // Mark current video as completed
            setCompletedVideos((prev) => {
              const newSet = new Set(prev)
              newSet.add(currentVideoIndex)
              return newSet
            })
            
            // Auto-advance to next video if available
            const totalVideos = course?.modules?.[0]?.videos?.length || 0
            if (currentVideoIndex < totalVideos - 1) {
              setTimeout(() => {
                setCurrentVideoIndex((prev) => prev + 1)
              }, 1500)
            }
            
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
        console.log("⏱️ Timer paused - conditions not met")
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [canCountSession, totalDuration, currentVideoIndex, course])

  // Auto-pause video when conditions fail
  useEffect(() => {
    if (!canCountSession && videoPlaying) {
      console.log("🚫 Pausing video - conditions not met")
      pauseVideo()
    }
  }, [canCountSession, videoPlaying])

  // Start monitoring with camera
  const startMonitoring = async () => {
    console.log("🚀 START MONITORING clicked")
    setMonitoringActive(true)
    setCourseBlocked(false)
    setFaceNotDetectedCountdown(null)
    lastAlertReasonRef.current = ""
    void clearHardwareAlert()
    void startWebcam()
    console.log("✅ Face monitoring started")
  }

  // Stop monitoring
  const stopMonitoring = () => {
    console.log("🛑 STOP MONITORING")
    setMonitoringActive(false)
    setFaceNotDetectedCountdown(null)
    stopWebcam()
    lastAlertReasonRef.current = ""
    void clearHardwareAlert()

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }

  // Video helpers
  const pauseVideo = useCallback(() => {
    // YouTube iframe
    if (videoRef.current) {
      try {
        videoRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}', 
          '*'
        )
      } catch {
        // Ignore postMessage failures for non-YouTube embeds.
      }
    }
    // Local video
    if (localVideoRef.current) {
      localVideoRef.current.pause()
    }
    setVideoPlaying(false)
  }, [])

  const playVideo = useCallback(() => {
    // YouTube iframe
    if (videoRef.current) {
      try {
        videoRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"playVideo","args":""}', 
          '*'
        )
      } catch {
        // Ignore postMessage failures for non-YouTube embeds.
      }
    }
    // Local video
    if (localVideoRef.current) {
      localVideoRef.current.play()
    }
    setVideoPlaying(true)
  }, [])

  // Get current video
  const currentVideo = course?.modules?.[0]?.videos?.[currentVideoIndex]
  const isYouTube = currentVideo?.url?.includes('youtube.com') || currentVideo?.url?.includes('youtu.be')
  const isGoogleDrive = currentVideo?.url?.includes('drive.google.com')

  // Get attention status message
  const getAttentionStatus = () => {
    if (!monitoringActive) return "Monitoring not started"
    if (!cameraActive) return "Camera not active"
    if (!hardwareOnline) return "ESP32 offline - Timer paused"
    if (isMotionSensorStale) return "Motion sensor not responding - Timer paused"
    if (motionViolation) return "Excessive movement (5s) - Timer paused"
    if (!isFaceDetected && faceNotDetectedCountdown !== null && faceNotDetectedCountdown > 0) return `Face not detected - Learning pauses in ${faceNotDetectedCountdown}s`
    if (!isFaceDetected) return "Face not detected - Timer paused"
    if (!tabVisible) return "Tab switched - Timer paused"
    if (!videoPlaying) return "Video paused"
    if (timeLimitReached) return "Time limit reached"
    return "Focused - Learning in progress"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading lecture...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">Course not found</p>
          <Button onClick={() => router.push('/courses')} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-3 py-3 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{course.title}</h1>
            <p className="text-gray-400 text-sm">Module 1: {currentVideo?.title || 'Loading...'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
            <div className="text-xs sm:text-sm text-gray-400">
              Video {currentVideoIndex + 1} of {course.modules[0]?.videos?.length || 0}
            </div>
            <Badge variant={monitoringActive ? "default" : "secondary"} className="whitespace-nowrap">
              {monitoringActive ? "Monitoring Active" : "Monitoring Off"}
            </Badge>
            <Badge
              variant={hardwareOnline ? "default" : "destructive"}
              className={`whitespace-nowrap ${hardwareOnline ? "bg-emerald-600 hover:bg-emerald-600" : "bg-red-600 hover:bg-red-600"}`}
            >
              ESP32 {hardwareOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Blocked Overlay */}
      {showBlockedOverlay && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Camera Required</h2>
            <p className="text-gray-400 mb-4">
              Camera access is required to monitor your learning progress. 
              Please enable camera to continue.
            </p>
            <Button onClick={startMonitoring} className="mr-2">
              <Camera className="mr-2 h-4 w-4" />
              Enable Camera
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        {/* Main Video Area */}
        <div className="order-1 flex-1 p-3 sm:p-4 lg:p-6">
          <div className="video-container relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
            {currentVideo?.url ? (
              isYouTube ? (
                <iframe
                  ref={videoRef}
                  src={`${currentVideo.url}${currentVideo.url.includes('?') ? '&' : '?'}enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isGoogleDrive ? (
                <iframe
                  src={currentVideo.url}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={localVideoRef}
                  src={currentVideo.url}
                  className="w-full h-full"
                  controls
                  onLoadedMetadata={(e) => {
                    setTotalDuration(e.currentTarget.duration)
                    if (userId) {
                      const savedTime = ProgressStorage.getSessionTime(userId, courseId, currentVideoIndex.toString())
                      if (savedTime > 0 && savedTime < e.currentTarget.duration) {
                        e.currentTarget.currentTime = savedTime
                        console.log(`📺 Seeked to saved time: ${savedTime}s`)
                      }
                    }
                  }}
                  onTimeUpdate={(e) => setWatchTime(e.currentTarget.currentTime)}
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No video available
              </div>
            )}

            {/* Fullscreen overlay when conditions fail */}
            {!canCountSession && monitoringActive && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <p className="text-xl mb-2">Learning Paused</p>
                  <p className="text-gray-400 mb-4">{getAttentionStatus()}</p>
                  {isFaceDetected && tabVisible && hardwareReady && !videoPlaying && (
                    <Button onClick={playVideo}>
                      <Play className="mr-2 h-4 w-4" />
                      Resume Learning
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-gray-800 rounded-lg p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
                disabled={currentVideoIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentVideoIndex(Math.min(course.modules[0]?.videos?.length - 1 || 0, currentVideoIndex + 1))}
                disabled={currentVideoIndex >= (course.modules[0]?.videos?.length || 1) - 1}
              >
                Next
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
              {monitoringActive ? (
                <Button variant="destructive" onClick={stopMonitoring}>
                  <X className="mr-2 h-4 w-4" />
                  Stop Monitoring
                </Button>
              ) : (
                <Button onClick={startMonitoring}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Monitoring
                </Button>
              )}
            </div>
          </div>

          {/* Video Info */}
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">{currentVideo?.title}</h2>
            <p className="text-gray-400 text-sm">{currentVideo?.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')} / {Math.floor(totalDuration / 60)}:{(Math.floor(totalDuration / 60) % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className={`h-4 w-4 ${completedVideos.has(currentVideoIndex) ? 'text-green-500' : 'text-gray-500'}`} />
                <span className={completedVideos.has(currentVideoIndex) ? 'text-green-500' : ''}>
                  {completedVideos.has(currentVideoIndex) ? 'Completed' : `${completedVideos.size}/${course?.modules?.[0]?.videos?.length || 0} total`}
                </span>
              </div>
              {timeLimitReached && (
                <Badge variant="destructive">Time Limit Reached</Badge>
              )}
            </div>
          </div>
        </div>

      {/* Sidebar - Face Monitoring Panel */}
        <div className="order-2 w-full lg:w-80 xl:w-96 bg-gray-800 border-b lg:border-b-0 lg:border-l border-gray-700 p-3 sm:p-4">
          <h3 className="font-semibold mb-4">Camera Tracking</h3>
          
          {/* Camera Preview */}
          <div className="mb-4">
            <div className="bg-gray-900 rounded-lg aspect-video relative overflow-hidden">
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 mb-3">Click to enable camera</p>
                    <Button size="sm" onClick={startMonitoring}>
                      <Camera className="mr-2 h-4 w-4" />
                      Enable Camera
                    </Button>
                  </div>
                </div>
              )}
              {cameraActive && isFaceDetected && (
                <div className="absolute top-2 right-2 bg-green-500/80 px-2 py-1 rounded text-xs">
                  Face Detected
                </div>
              )}
              {cameraActive && !isFaceDetected && (
                <div className="absolute top-2 right-2 max-w-[90%] bg-red-500/80 px-2 py-1 rounded text-xs">
                  No Face
                </div>
              )}
            </div>
            {faceDetectionError && (
              <p className="text-xs text-red-500 mt-1">{faceDetectionError}</p>
            )}
          </div>

          {/* Status Cards */}
          <div className="space-y-3">
            {/* Attention Status */}
            <div className={`p-3 rounded-lg border ${!canCountSession && monitoringActive ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2">
                {!canCountSession && monitoringActive ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Eye className="h-4 w-4 text-green-600" />
                )}
                <span className="font-medium text-sm">Attention</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{getAttentionStatus()}</p>
            </div>

            <FaceMonitoringStatus
              cameraActive={cameraActive}
              isFaceDetected={isFaceDetected}
              faceNotDetectedCountdown={faceNotDetectedCountdown}
            />

            {/* Tab Visibility Status */}
            <div className={`p-3 rounded-lg border ${tabVisible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {tabVisible ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                <span className="font-medium text-sm">Tab Status</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{tabVisible ? 'Focused on learning' : 'Tab switched!'}</p>
            </div>

            {/* Hardware Status */}
            <div className={`p-3 rounded-lg border ${hardwareReady ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <Wifi className={`h-4 w-4 ${hardwareOnline ? 'text-green-600' : 'text-red-600'}`} />
                <span className="font-medium text-sm">ESP32 Hardware</span>
                <span className={`ml-auto text-xs font-semibold ${hardwareOnline ? 'text-green-700' : 'text-red-700'}`}>
                  {hardwareOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <Activity className={`h-3 w-3 ${isMotionDetected ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{isMotionDetected ? `Motion active ${motionSeconds}s / 5s` : 'No motion detected'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last heartbeat: {Number.isFinite(connectionAgeMs) ? `${Math.round(connectionAgeMs / 1000)}s ago` : 'N/A'}
              </p>
              {motionViolation && (
                <p className="text-xs text-red-600 mt-1">Violation: movement exceeded 5 seconds.</p>
              )}
              {hardwareError && (
                <p className="text-xs text-red-600 mt-1">{hardwareError}</p>
              )}
              {hardwareStatus?.alert?.reason && hardwareStatus.alert.reason !== 'ok' && (
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                  <BellRing className="h-3 w-3" />
                  Alert: {hardwareStatus.alert.reason}
                </p>
              )}
            </div>

            {/* Session Time */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Valid Session Time</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')} / 30:00
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Only counts when: Camera ON + Face Detected + Tab Visible + ESP32 Online + No Motion Violation + Video Playing
              </p>
            </div>

            {/* Progress */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Video Progress</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {Math.round((watchTime / totalDuration) * 100)}% watched
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

