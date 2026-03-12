"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  CameraOff, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Pause, 
  MonitorOff,
  Wifi,
  Activity
} from "lucide-react"
import { auth } from "@/lib/firebase"
import { 
  saveVideoProgressToFirebase, 
  saveCourseProgressToFirebase, 
  saveOverallProgressToFirebase, 
  saveContinueLearningDataToFirebase, 
  saveAlertToFirebase,
  triggerHardwareAlert,
  clearHardwareAlert
} from "@/lib/firebase"
import * as blazeface from "@tensorflow-models/blazeface"
import { ProgressStorage } from "@/lib/progress-storage"
import "@/styles/fullscreen-overlay.css"
import { useHardwareMonitoring } from "@/hooks/use-hardware-monitoring"

interface VideoPlayerWithHardwareProps {
  videoUrl: string
  videoId: string
  videoIndex: number
  courseId: string
  moduleNumber: number
  userId: string
  totalDuration: number
  onVideoComplete?: () => void
}

export function VideoPlayerWithHardware({
  videoUrl,
  videoId,
  videoIndex,
  courseId,
  moduleNumber,
  userId,
  totalDuration,
  onVideoComplete,
}: VideoPlayerWithHardwareProps) {
  const router = useRouter()
  
  // Hardware monitoring hook
  const {
    hardwareStatus,
    isOnline: hardwareOnline,
    isMotionDetected,
    motionDuration,
    motionViolation,
    triggerAlert: triggerHardwareAlertFn,
    clearAlert: clearHardwareAlertFn
  } = useHardwareMonitoring({ userId, motionThresholdMs: 5000 })
  
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending")
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [postureStatus, setPostureStatus] = useState<"good" | "warning">("good")
  const [attentionStatus, setAttentionStatus] = useState<"focused" | "distracted">("focused")
  const [watchTime, setWatchTime] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [eyesDetected, setEyesDetected] = useState(true)
  const [noEyesDuration, setNoEyesDuration] = useState(0)
  const [showEyeAlert, setShowEyeAlert] = useState(false)
  const [videoPausedByEyeTracking, setVideoPausedByEyeTracking] = useState(false)
  const [videoPausedByHardware, setVideoPausedByHardware] = useState(false)
  const [initialProgressLoaded, setInitialProgressLoaded] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [faceDetector, setFaceDetector] = useState<any>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [overlayMessage, setOverlayMessage] = useState("")
  const [motionSeconds, setMotionSeconds] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionIdRef = useRef(`${Date.now()}-${Math.random()}`)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const eyeTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenOverlayRef = useRef<HTMLDivElement | null>(null)
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null)
  
  // Update motion seconds counter
  useEffect(() => {
    if (isMotionDetected) {
      const interval = setInterval(() => {
        setMotionSeconds(Math.floor(motionDuration / 1000))
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setMotionSeconds(0)
    }
  }, [isMotionDetected, motionDuration])

  // Auto-pause video if hardware violation detected
  useEffect(() => {
    if (motionViolation && isVideoPlaying && !videoPausedByHardware) {
      console.log('🚫 Hardware motion violation detected - Auto-pausing video')
      setVideoPausedByHardware(true)
      if (youtubePlayer) {
        youtubePlayer.pauseVideo()
      }
      if (isFullscreen) {
        showFullscreenOverlay("Excessive movement detected. Video paused.")
      }
      // Trigger hardware alert
      triggerHardwareAlertFn('excessive_movement')
      if (auth.currentUser) {
        saveAlertToFirebase(userId, {
          type: "hardware_motion_violation",
          message: "Excessive movement detected for 5+ seconds",
          courseId: courseId,
          videoId: videoId
        })
      }
    }
  }, [motionViolation, isVideoPlaying, videoPausedByHardware, youtubePlayer, isFullscreen])

  // Auto-pause if hardware goes offline
  useEffect(() => {
    if (!hardwareOnline && isVideoPlaying) {
      console.log('🚫 Hardware offline detected - Auto-pausing video')
      if (youtubePlayer) {
        youtubePlayer.pauseVideo()
      }
      if (isFullscreen) {
        showFullscreenOverlay("Hardware connection lost. Video paused.")
      }
    }
  }, [hardwareOnline, isVideoPlaying, youtubePlayer, isFullscreen])

  // YouTube API Setup
  useEffect(() => {
    console.log("YouTube API Script/Player useEffect: Running")
    if (typeof window !== "undefined") {
      if (!window.YT) {
        const script = document.createElement("script")
        script.src = "https://www.youtube.com/iframe_api"
        script.async = true
        document.body.appendChild(script)
      }

      window.onYouTubeIframeAPIReady = () => {
        console.log("onYouTubeIframeAPIReady: API is ready!")
        if (window.YT && !youtubePlayer && document.getElementById('youtube-player')) {
          const player = new window.YT.Player('youtube-player', {
            videoId: videoUrl.includes("youtube.com/watch?v=") ? new URLSearchParams(videoUrl.split("?")[1]).get("v") || '' : videoUrl.split("youtu.be/")[1]?.split("?")[0] || '',
            playerVars: {
              autoplay: 0,
              controls: 1,
              enablejsapi: 1,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
            },
            events: {
              onReady: (event: any) => {
                setYoutubePlayer(event.target)
              },
              onStateChange: (event: any) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsVideoPlaying(true)
                } else {
                  setIsVideoPlaying(false)
                }
              },
            },
          })
        }
      }
    }

    return () => {
      if (youtubePlayer) {
        youtubePlayer.destroy()
      }
    }
  }, [youtubePlayer, videoUrl])

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null
      setIsFullscreen(isCurrentlyFullscreen)
      if (!isCurrentlyFullscreen) {
        hideFullscreenOverlay()
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const showFullscreenOverlay = (message: string) => {
    if (fullscreenOverlayRef.current) {
      hideFullscreenOverlay()
    }

    const overlay = document.createElement("div")
    overlay.className = "fullscreen-overlay"
    const content = document.createElement("div")
    content.className = "fullscreen-overlay-content"
    const icon = document.createElement("div")
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor-off"><path d="M17 17H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h13a2 2 0 0 1 2 2v2.5"/><path d="M17 21h-5.5"/><path d="M22 21h-2"/><path d="M7 21v-4"/><path d="m22 2-6 6"/><path d="m16 2 6 6"/></svg>`
    icon.className = "fullscreen-overlay-icon"
    const text = document.createElement("p")
    text.textContent = message
    
    content.appendChild(icon)
    content.appendChild(text)
    overlay.appendChild(content)
    
    videoContainerRef.current?.appendChild(overlay)
    fullscreenOverlayRef.current = overlay
    setOverlayMessage(message)
  }

  const hideFullscreenOverlay = () => {
    if (fullscreenOverlayRef.current) {
      fullscreenOverlayRef.current.remove()
      fullscreenOverlayRef.current = null
      setOverlayMessage("")
    }
  }

  // Load initial progress
  useEffect(() => {
    const fetchProgress = async () => {
      setInitialProgressLoaded(true)
    }
    fetchProgress()
  }, [userId, courseId, videoId])

  // Camera permission request
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setCameraPermission("granted")
      setIsMonitoring(true)

      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")
        const video = videoRef.current
        video.srcObject = stream
        await video.play()

        const drawFrame = () => {
          if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
          }
          if (isMonitoring) {
            requestAnimationFrame(drawFrame)
          }
        }
        drawFrame()
      }
    } catch (error) {
      console.error("Camera permission denied:", error)
      setCameraPermission("denied")

      if (auth.currentUser) {
        await saveAlertToFirebase(userId, {
          type: "camera_denied",
          message: "Camera permission denied for video monitoring",
          courseId: courseId,
          videoId: videoId
        })
      }
    }
  }

  // Tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAttentionStatus("distracted")
        if (isFullscreen) {
          showFullscreenOverlay("Tab switched. Video paused.")
        }
        if (auth.currentUser) {
          saveAlertToFirebase(userId, {
            type: "tab_switch",
            message: "User switched tabs - attention diverted",
            courseId: courseId,
            videoId: videoId
          }).catch(error => console.error("Error saving tab switch alert:", error))
        }
      } else {
        setAttentionStatus("focused")
        if (isFullscreen) {
          hideFullscreenOverlay()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isFullscreen])

  // Watch time tracking
  useEffect(() => {
    console.log("WatchTime useEffect: Running with cameraPermission:", cameraPermission, "isVideoPlaying:", isVideoPlaying)
    if (cameraPermission === "granted" && isVideoPlaying) {
      intervalRef.current = setInterval(() => {
        setWatchTime((prev) => {
          console.log("WatchTime: incrementing watchTime from", prev, "to", prev + 1)
          return prev + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        console.log("WatchTime: clearing interval due to cameraPermission or isVideoPlaying state")
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        console.log("WatchTime useEffect cleanup: clearing interval")
        clearInterval(intervalRef.current)
      }
    }
  }, [cameraPermission, isVideoPlaying])

  // Progress saving
  useEffect(() => {
    const saveProgress = async () => {
      if (auth.currentUser && watchTime > 0) {
        const isCompleted = watchTime >= totalDuration * 0.9
        try {
          await saveVideoProgressToFirebase(userId, courseId, videoId, {
            lastWatchedTime: watchTime,
            validWatchTime: watchTime,
            totalDuration: totalDuration,
            completed: isCompleted,
            videoIndex: videoIndex,
            lastWatchTime: Date.now()
          })

          ProgressStorage.saveVideoProgress(userId, courseId, videoId, {
            lastWatchedTime: watchTime,
            lastPosition: watchTime,
            validWatchTime: watchTime,
            totalDuration: totalDuration,
            completed: isCompleted,
            videoTitle: `Video ${videoIndex + 1} - Module ${moduleNumber}`,
            videoIndex: videoIndex,
            moduleNumber: moduleNumber
          })

          await saveContinueLearningDataToFirebase(userId, courseId, videoId, watchTime)

          if (watchTime % 30 === 0) {
            const progress = Math.round((watchTime / totalDuration) * 100)
            await saveCourseProgressToFirebase(userId, courseId, progress, isCompleted ? 1 : 0, 10)
          }
        } catch (error) {
          console.error("Error saving video progress to Firebase:", error)
        }
      }
    }

    const progressInterval = setInterval(saveProgress, 5000)
    return () => clearInterval(progressInterval)
  }, [watchTime, userId, courseId, videoId, videoIndex, totalDuration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const saveProgressOnUnmount = async () => {
        if (auth.currentUser && watchTime > 0) {
          try {
            await saveVideoProgressToFirebase(userId, courseId, videoId, {
              lastWatchedTime: watchTime,
              validWatchTime: watchTime,
              totalDuration: totalDuration,
              completed: watchTime >= totalDuration * 0.9,
              videoIndex: videoIndex,
              lastWatchTime: Date.now()
            })
          } catch (error) {
            console.error("Error saving final progress to Firebase:", error)
          }
        }
      }
      saveProgressOnUnmount()
    }
  }, [watchTime, userId, courseId, videoId, videoIndex, totalDuration])

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }, [])

  // Face detection setup
  useEffect(() => {
    const loadFaceDetection = async () => {
      try {
        const script1 = document.createElement("script")
        script1.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"
        script1.crossOrigin = "anonymous"
        document.body.appendChild(script1)
        await new Promise((resolve) => {
          script1.onload = resolve
        })

        const script2 = document.createElement("script")
        script2.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface"
        script2.crossOrigin = "anonymous"
        document.body.appendChild(script2)
        await new Promise((resolve) => {
          script2.onload = resolve
        })

        // @ts-ignore
        const model = await blazeface.load()
        setFaceDetector(model)
        setModelLoaded(true)
        console.log("BlazeFace model loaded successfully")
      } catch (error) {
        console.error("Error loading face detection model:", error)
        setModelLoaded(false)
      }
    }

    loadFaceDetection()
  }, [])

  // Eye tracking
  useEffect(() => {
    if (cameraPermission === "granted" && isVideoPlaying && !videoPausedByEyeTracking && modelLoaded && faceDetector) {
      eyeTrackingIntervalRef.current = setInterval(async () => {
        const video = videoRef.current
        const canvas = canvasRef.current

        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !video.paused && !video.ended) {
          try {
            const predictions = await faceDetector.estimateFaces(video, false)

            if (predictions && predictions.length > 0) {
              const face = predictions[0]
              const hasEyes = face.landmarks && face.landmarks.length >= 2

              if (hasEyes) {
                setEyesDetected(true)
                setNoEyesDuration(0)
                setShowEyeAlert(false)
                setAttentionStatus("focused")
                if (videoPausedByEyeTracking) {
                  handleResumeVideo()
                }
              } else {
                setEyesDetected(false)
                setAttentionStatus("distracted")
                setNoEyesDuration((prev) => {
                  const newDuration = prev + 1
                  if (newDuration >= 25 && !videoPausedByEyeTracking) {
                    if (isFullscreen) {
                      showFullscreenOverlay("Face not detected. Video paused.")
                    }
                    setVideoPausedByEyeTracking(true)
                    setShowEyeAlert(true)
                    if (youtubePlayer) {
                      youtubePlayer.pauseVideo()
                    }
                    if (auth.currentUser) {
                      saveAlertToFirebase(userId, {
                        type: "eyes_not_detected",
                        message: "Eyes not detected for 25+ seconds - video paused",
                        courseId: courseId,
                        videoId: videoId
                      })
                    }
                  }
                  return newDuration
                })
              }
            } else {
              setEyesDetected(false)
              setAttentionStatus("distracted")
              setNoEyesDuration((prev) => {
                const newDuration = prev + 1
                if (newDuration >= 25 && !videoPausedByEyeTracking) {
                  if (isFullscreen) {
                    showFullscreenOverlay("Face not detected. Video paused.")
                  }
                  setVideoPausedByEyeTracking(true)
                  setShowEyeAlert(true)
                  if (youtubePlayer) {
                    youtubePlayer.pauseVideo()
                  }
                  if (auth.currentUser) {
                    saveAlertToFirebase(userId, {
                      type: "no_face_detected",
                      message: "Face not detected for 25+ seconds - video paused",
                      courseId: courseId,
                      videoId: videoId
                    })
                  }
                }
                return newDuration
              })
            }
          } catch (error) {
            console.error("Error during BlazeFace detection:", error)
          }
        }
      }, 1000)
    } else {
      if (eyeTrackingIntervalRef.current) {
        clearInterval(eyeTrackingIntervalRef.current)
      }
    }

    return () => {
      if (eyeTrackingIntervalRef.current) {
        clearInterval(eyeTrackingIntervalRef.current)
      }
    }
  }, [cameraPermission, isVideoPlaying, videoPausedByEyeTracking, modelLoaded, faceDetector, userId, courseId, videoId, isFullscreen, youtubePlayer])

  const handleVideoEnd = () => {
    if (watchTime >= totalDuration * 0.9) {
      if (onVideoComplete) {
        onVideoComplete()
      } else {
        router.refresh()
      }
    }
  }

  const handleResumeVideo = () => {
    console.log("handleResumeVideo: Resuming video")
    hideFullscreenOverlay()
    setVideoPausedByEyeTracking(false)
    setVideoPausedByHardware(false)
    setShowEyeAlert(false)
    setNoEyesDuration(0)
    setEyesDetected(true)
    if (youtubePlayer) {
      youtubePlayer.playVideo()
    }
  }

  const getEmbedUrl = (url: string) => {
    let videoId = ""
    if (url.includes("youtube.com/watch?v=")) {
      const urlParams = new URLSearchParams(url.split("?")[1])
      videoId = urlParams.get("v") || ""
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || ""
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1&rel=0&showinfo=0`

    if (startTime > 0) {
      return `${embedUrl}&start=${startTime}`
    }
    return embedUrl
  }

  // Determine pause reason for UI
  const getPauseReason = () => {
    if (motionViolation) return "Excessive movement detected"
    if (!hardwareOnline) return "Hardware connection lost"
    if (videoPausedByEyeTracking) return "Face not detected"
    return "Video paused"
  }

  if (cameraPermission === "pending") {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-6">
          <Camera className="h-16 w-16 text-blue-500" />
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Camera Access Required</h3>
            <p className="text-muted-foreground max-w-md">
              To ensure focused learning, we need to monitor your attention during the video. Please grant camera access
              to continue.
            </p>
          </div>
          <Alert variant="default" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Without camera access, you cannot watch the videos. This is required for tracking your learning progress
              and attention.
            </AlertDescription>
          </Alert>
          <Button onClick={requestCameraPermission} size="lg" className="mt-4">
            <Camera className="mr-2 h-5 w-5" />
            Grant Camera Access
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (cameraPermission === "denied") {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-6">
          <CameraOff className="h-16 w-16 text-red-500" />
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-red-600">Camera Access Denied</h3>
            <p className="text-muted-foreground max-w-md">
              You have denied camera access. You cannot proceed with watching the video without enabling camera
              monitoring.
            </p>
          </div>
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please enable camera permissions in your browser settings and refresh the page to continue learning.
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {(showEyeAlert && videoPausedByEyeTracking) || (motionViolation && videoPausedByHardware) ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Video paused: {getPauseReason()}. {motionViolation ? "Please stabilize your posture." : "Please look at the screen."}</span>
              <Button size="sm" variant="outline" onClick={handleResumeVideo} className="ml-4 bg-transparent">
                Resume Video
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardContent className="p-0">
            <div className="aspect-video bg-black relative" ref={videoContainerRef}>
              {(videoPausedByEyeTracking || videoPausedByHardware) && !isFullscreen && (
                <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Pause className="h-16 w-16 text-white mx-auto" />
                    <div className="text-white">
                      <p className="text-xl font-bold">Video Paused</p>
                      <p className="text-sm">{getPauseReason()}.</p>
                      <p className="text-sm">
                        {motionViolation ? "Please stabilize your posture." : "Please look at the screen to continue."}
                      </p>
                    </div>
                    <Button onClick={handleResumeVideo} size="lg">
                      I'm Ready - Resume
                    </Button>
                  </div>
                </div>
              )}
              {initialProgressLoaded && (
                <iframe
                  key={videoUrl}
                  id="youtube-player"
                  src={getEmbedUrl(videoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title="Course Video"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Watch Time</p>
                <p className="text-2xl font-bold">
                  {Math.floor(watchTime / 60)}:{String(watchTime % 60).padStart(2, "0")}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm font-medium">Total Duration</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((watchTime / totalDuration) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((watchTime / totalDuration) * 100)}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Hardware Monitoring Card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold">Hardware Status (ESP32)</h3>
              <Badge variant={hardwareOnline ? "default" : "destructive"} className="ml-auto">
                {hardwareOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>

            <div className="space-y-3">
              {/* Motion Detection */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  {isMotionDetected ? (
                    <Activity className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Wifi className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-sm">Motion Detection</p>
                    <p className="text-xs text-muted-foreground">
                      {isMotionDetected ? `${motionSeconds}s / 5s` : "No motion detected"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={motionViolation ? "destructive" : isMotionDetected ? "default" : "outline"}
                  className={motionViolation ? "bg-red-100 text-red-700" : isMotionDetected ? "bg-blue-100 text-blue-700" : ""}
                >
                  {motionViolation ? "Violation!" : isMotionDetected ? "Active" : "Idle"}
                </Badge>
              </div>

              {/* Hardware Connection */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Wifi className={`h-5 w-5 ${hardwareOnline ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="font-medium text-sm">Hardware Connection</p>
                    <p className="text-xs text-muted-foreground">
                      {hardwareOnline ? "ESP32 connected" : "Connection lost"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={hardwareOnline ? "default" : "destructive"}
                  className={hardwareOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                >
                  {hardwareOnline ? "Connected" : "Offline"}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                ESP32 monitors physical movement. Motion lasting 5+ seconds will trigger video pause.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Monitoring Card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">AI Monitoring</h3>
              {!modelLoaded && <Badge variant="outline">Loading AI...</Badge>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  {postureStatus === "good" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">Posture</p>
                    <p className="text-xs text-muted-foreground">
                      {postureStatus === "good" ? "Good posture" : "Leaning forward"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={postureStatus === "good" ? "default" : "outline"}
                  className={postureStatus === "good" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}
                >
                  {postureStatus === "good" ? "Good" : "Warning"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  {attentionStatus === "focused" ? (
                    <Eye className="h-5 w-5 text-blue-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">Attention</p>
                    <p className="text-xs text-muted-foreground">
                      {attentionStatus === "focused" ? "Focused on content" : "Distracted"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={attentionStatus === "focused" ? "default" : "outline"}
                  className={attentionStatus === "focused" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}
                >
                  {attentionStatus === "focused" ? "Focused" : "Distracted"}
                </Badge>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  eyesDetected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {eyesDetected ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">Face & Eye Tracking</p>
                    <p className="text-xs text-muted-foreground">
                      {eyesDetected ? "Face detected" : `No face: ${noEyesDuration}s`}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={eyesDetected ? "default" : "outline"}
                  className={eyesDetected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                >
                  {eyesDetected ? "Active" : "Warning"}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <canvas ref={canvasRef} className="w-full rounded-lg border" style={{ display: "none" }} />
              <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} src="" />
              <p className="text-xs text-muted-foreground">
                Your attention and face detection are monitored using AI. Video will pause if your face is not detected
                for 25+ seconds.
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Leaving this page or switching tabs will be tracked and may affect your progress score. Hardware motion violations will also pause the video.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

