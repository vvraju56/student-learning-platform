"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import heavy dependencies to reduce initial bundle size
const BootstrapButton = dynamic(() => import('react-bootstrap/Button'), {
  loading: () => <div className="btn btn-secondary disabled">Loading...</div>
})

const BootstrapCard = dynamic(() => import('react-bootstrap/Card'), {
  loading: () => <div className="card">Loading...</div>
})

const BootstrapProgressBar = dynamic(() => import('react-bootstrap/ProgressBar'), {
  loading: () => <div className="progress">Loading...</div>
})

const BootstrapBadge = dynamic(() => import('react-bootstrap/Badge'), {
  loading: () => <span className="badge">Loading...</span>
})

import { 
  Play, Pause, SkipForward, SkipBack, Volume2, Maximize2, 
  ArrowLeft, AlertTriangle, Eye, EyeOff, Activity, Clock
} from "lucide-react"
import { videoSyncService } from "@/services/video-sync-service"
import { useVideoValidation } from "@/hooks/use-video-validation"

interface VideoPlayerPageProps {
  user: any
  courseId: string
  videoId: string
}

export function VideoPlayerPage({ user, courseId, videoId }: VideoPlayerPageProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [video, setVideo] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Dynamic imports for Bootstrap components to reduce bundle size
  const [Button, setButton] = useState<any>(null)
  const [Card, setCard] = useState<any>(null)
  const [ProgressBar, setProgressBar] = useState<any>(null)
  const [Badge, setBadge] = useState<any>(null)
  
  // Video sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<number>(0)
  const videoKeyRef = useRef<string>(`${courseId}_${videoId}`)
  const watchTimeRef = useRef<number>(0)
  
  // Get validation state
  const { state: validationState = {
    watchTime: 0,
    totalDuration: 0,
    violations: { tabSwitches: 0, faceMissingEvents: 0, autoPauses: 0, skipCount: 0, skippedTime: 0 },
    isValid: false,
    isCompleted: false,
    completionPercentage: 0,
    isVideoPlaying: false
  }, startVideoValidation = () => {}, addViolation = () => {} } = useVideoValidation(user?.uid || "")
  
  
  useEffect(() => {
    // Dynamically import Bootstrap components
    Promise.all([
      import('react-bootstrap/Button'),
      import('react-bootstrap/Card'),
      import('react-bootstrap/ProgressBar'),
      import('react-bootstrap/Badge')
    ]).then(([ButtonModule, CardModule, ProgressBarModule, BadgeModule]) => {
      setButton(() => ButtonModule.default)
      setCard(() => CardModule.default)
      setProgressBar(() => ProgressBarModule.default)
      setBadge(() => BadgeModule.default)
    })
  }, [])
  
  // Setup video progress sync every 5 minutes
  useEffect(() => {
    if (!user?.uid) return
    
    const videoKey = videoKeyRef.current
    
    // Start sync with 5-minute interval
    videoSyncService.startSync(
      videoKey,
      user.uid,
      courseId,
      videoId,
      async (data) => {
        setSyncStatus('syncing')
        try {
          // Simulate sync delay
          await new Promise(resolve => setTimeout(resolve, 500))
          setLastSyncTime(Date.now())
          setSyncStatus('synced')
          console.log('✅ Video progress synced to Firebase')
          
          // Reset status after 3 seconds
          setTimeout(() => setSyncStatus('idle'), 3000)
        } catch (error) {
          console.error('Error syncing video progress:', error)
          setSyncStatus('idle')
        }
      }
    )
    
    // Cleanup on unmount
    return () => {
      videoSyncService.stopSync(videoKey)
      videoSyncService.cleanup()
    }
  }, [user?.uid, courseId, videoId])
  
  // Update pending sync data on video progress change
  useEffect(() => {
    const videoKey = videoKeyRef.current
    
    videoSyncService.updatePendingData(videoKey, {
      courseId,
      videoId,
      userId: user?.uid || '',
      currentTime,
      duration,
      isPlaying,
      watchTime: watchTimeRef.current,
      violations: validationState.violations
    })
  }, [currentTime, duration, isPlaying, courseId, videoId, validationState.violations, user?.uid])
  
  // Track watch time
  useEffect(() => {
    watchTimeRef.current += currentTime
  }, [currentTime])

  // Mock video data
  useEffect(() => {
    const mockVideo = {
      id: videoId,
      title: `Video ${videoId}: ${getVideoTitle(courseId, parseInt(videoId.split('-')[1]) - 1)}`,
      duration: 1200, // 20 minutes in seconds
      description: 'This is a comprehensive lesson covering important concepts and practical examples.',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
    setVideo(mockVideo)
    // Start validation with video duration
    startVideoValidation(mockVideo.duration)
  }, [courseId, videoId, startVideoValidation])

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)
      // Watch time is tracked via watchTimeRef automatically
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      addViolation('skipCount')
    }
  }

  const handleSkipForward = () => {
    handleSeek(currentTime + 10)
  }

  const handleSkipBackward = () => {
    handleSeek(currentTime - 10)
  }

  const handleFullscreen = () => {
    if (videoRef.current && !isFullscreen) {
      videoRef.current.requestFullscreen()
      setIsFullscreen(true)
    }
  }

  const handleBackToVideos = () => {
    // Save progress before leaving
    // Validation is automatically tracked by the validation hook
    router.push(`/course/${courseId}/videos`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!video) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" 
           style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading video...</span>
          </div>
          <p className="mt-3 text-white">Loading video...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#1a1a1a', 
        borderBottom: '1px solid #2a2a2a',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }} className="text-white">
        <div className="container-fluid">
          <div className="row align-items-center py-3">
            <div className="col">
              <div className="d-flex align-items-center gap-3">
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={handleBackToVideos}
                  className="d-flex align-items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Videos
                </Button>
                <div>
                  <h1 className="h3 mb-0 text-white fw-bold">{video.title}</h1>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.875rem' }}>
                    {video.description}
                  </p>

                </div>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3">
                {/* Monitoring Status */}
                <div className="d-flex align-items-center gap-2">
                  <Eye className="w-4 h-4 text-success" />
                  <span className="small text-success">Face Detected</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Activity className="w-4 h-4 text-info" />
                  <span className="small text-info">Focused</span>
                </div>
                <div className="text-end">
                  <div className="text-white small fw-medium">{user?.email}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Learning Time: {formatTime(validationState.watchTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <main className="container-fluid py-4">
        <div className="row">
          <div className="col-lg-8">
            {/* Video Container */}
            <Card className="border-0 shadow-lg mb-4" style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <div className="position-relative" style={{ paddingBottom: '56.25%' }}>
                <video
                  ref={videoRef}
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{ backgroundColor: '#000', borderRadius: '12px' }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  src={video.url}
                />
                
                {/* Video Controls Overlay */}
                <div className="position-absolute bottom-0 start-0 w-100 p-3" 
                     style={{
                       background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                       borderRadius: '0 0 12px 12px'
                     }}>
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <ProgressBar 
                      now={progressPercentage} 
                      style={{ 
                        height: '6px', 
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                      }}
                      variant="primary"
                      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const clickX = e.clientX - rect.left
                        const percentage = clickX / rect.width
                        handleSeek(duration * percentage)
                      }}
                    />
                  </div>

                  {/* Control Buttons */}
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={handleSkipBackward}
                        className="d-flex align-items-center gap-1"
                      >
                        <SkipBack className="w-4 h-4" />
                        -10s
                      </Button>
                      
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={isPlaying ? handlePause : handlePlay}
                        className="d-flex align-items-center gap-1"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Play
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={handleSkipForward}
                        className="d-flex align-items-center gap-1"
                      >
                        +10s
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="small">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <Button 
                          variant="outline-light" 
                          size="sm"
                          onClick={() => handleVolumeChange(isMuted ? 0.5 : 0)}
                          className="d-flex align-items-center"
                        >
                          {isMuted ? (
                            <Volume2 className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={handleFullscreen}
                        className="d-flex align-items-center"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="col-lg-4">
            {/* Violations Panel */}
            <Card className="border-0 shadow-lg mb-4" style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <h5 className="text-white mb-0 d-flex align-items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Session Violations
                </h5>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="space-y-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Tab Switches</span>
                    <Badge bg={validationState.violations.tabSwitches > 5 ? 'danger' : 'warning'}>
                      {validationState.violations.tabSwitches}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Face Missing</span>
                    <Badge bg={validationState.violations.faceMissingEvents > 5 ? 'danger' : 'warning'}>
                      {validationState.violations.faceMissingEvents}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Auto Pauses</span>
                    <Badge bg={validationState.violations.autoPauses > 5 ? 'danger' : 'warning'}>
                      {validationState.violations.autoPauses}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Skips</span>
                    <Badge bg={validationState.violations.skipCount > 3 ? 'danger' : 'warning'}>
                      {validationState.violations.skipCount}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Progress Info */}
            <Card className="border-0 shadow-lg" style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <h5 className="text-white mb-0">Learning Progress</h5>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="text-center mb-3">
                  <div className="h4 text-primary mb-1">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="small text-muted">Video Progress</div>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small text-muted">Valid Watch Time</span>
                    <span className="small text-white">{formatTime(validationState.watchTime)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small text-muted">Total Duration</span>
                    <span className="small text-white">{formatTime(duration)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="small text-muted">Required for Completion</span>
                    <span className="small text-success">90%</span>
                  </div>
                </div>

                <Badge 
                  bg={validationState.isValid ? 'success' : 'danger'}
                  className="w-100 d-flex align-items-center justify-content-center"
                >
                  {validationState.isValid ? '✓ Valid Session' : '⚠ Invalid Session'}
                </Badge>
              </Card.Body>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function getVideoTitle(courseId: string, index: number): string {
  const titles: Record<string, string[]> = {
    'web-development': [
      'Introduction to HTML & CSS', 'JavaScript Fundamentals', 'React Basics',
      'State Management', 'Routing in React', 'API Integration', 'Authentication',
      'Deployment', 'Performance Optimization', 'Advanced Patterns'
    ],
    'app-development': [
      'React Native Setup', 'Components & Styling', 'Navigation',
      'State Management', 'Native Modules', 'Push Notifications', 'App Store Deployment',
      'Performance', 'Testing', 'Advanced Topics'
    ],
    'game-development': [
      'Unity Introduction', 'Game Objects', 'Physics Engine',
      'Scripting in C#', 'Game Design', 'Animation', 'Audio Integration',
      'UI Systems', 'Optimization', 'Publishing'
    ]
  }
  return titles[courseId]?.[index] || `Lesson ${index + 1}`
}