"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMonitoring } from "../contexts/monitoring-context"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Badge from "react-bootstrap/Badge"
import { 
  Play, Pause, SkipForward, SkipBack, ArrowLeft, AlertTriangle
} from "lucide-react"

interface TestVideoPlayerProps {
  user: any
  courseId: string
  videoId: string
}

export function TestVideoPlayer({ user, courseId, videoId }: TestVideoPlayerProps) {
  const router = useRouter()
  const {
    isVideoPlaying,
    focusActive,
    isMonitoring,
    postureStatus,
    attentionStatus,
    startMonitoring,
    stopMonitoring,
    startVideoPlayback,
    pauseVideoPlayback,
    resumeVideoPlayback
  } = useMonitoring()

  const [currentTime, setCurrentTime] = useState(0)
  const [duration] = useState(600) // 10 minutes

  const handlePlay = () => {
    if (!isMonitoring) {
      startMonitoring()
    }
    startVideoPlayback(courseId, videoId)
    console.log('🎬 Video Playback Started')
  }

  const handlePause = () => {
    pauseVideoPlayback()
    console.log('⏸️ Video Playback Paused')
  }

  const handleResume = () => {
    resumeVideoPlayback()
    console.log('▶️ Video Playback Resumed')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#1a1a1a', 
        borderBottom: '1px solid #2a2a2a'
      }} className="text-white">
        <div className="container-fluid">
          <div className="row align-items-center py-3">
            <div className="col">
              <div className="d-flex align-items-center gap-3">
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={() => router.back()}
                  className="d-flex align-items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
                <div>
                  <h1 className="h3 mb-0 text-white fw-bold">Test Video Player</h1>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.875rem' }}>
                    Real-time Monitoring Demo
                  </p>
                </div>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3">
                <div className="text-end">
                  <div className="text-white small fw-medium">{user?.email}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Testing Real-time Behavior
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-fluid py-4">
        <div className="row g-4">
          {/* Video Player */}
          <div className="col-lg-8">
            <Card className="border-0 shadow-lg" style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <Card.Body className="p-4">
                {/* Video Mock */}
                <div 
                  className="position-relative rounded mb-3 d-flex align-items-center justify-content-center"
                  style={{ 
                    backgroundColor: '#000', 
                    height: '400px',
                    border: `2px solid ${focusActive ? '#10b981' : '#dc2626'}`
                  }}
                >
                  {isVideoPlaying ? (
                    <div className="text-center">
                      <Play className="w-16 h-16 text-white mb-3" />
                      <div className="text-white">Video Playing...</div>
                      <div className="text-muted">Test focus loss by switching tabs</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Pause className="w-16 h-16 text-white-50 mb-3" />
                      <div className="text-white-50">Video Paused</div>
                      <div className="text-muted">Press play to start</div>
                    </div>
                  )}
                </div>

                {/* Video Controls */}
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <Button 
                      variant="outline-light" 
                      size="sm"
                      onClick={() => console.log('Skip backward')}
                      className="d-flex align-items-center gap-1"
                    >
                      <SkipBack className="w-4 h-4" />
                      -10s
                    </Button>
                    
                    {isVideoPlaying ? (
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={handlePause}
                        className="d-flex align-items-center gap-1"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </Button>
                    ) : (
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={handleResume}
                        className="d-flex align-items-center gap-1"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline-light" 
                      size="sm"
                      onClick={() => console.log('Skip forward')}
                      className="d-flex align-items-center gap-1"
                    >
                      +10s
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <span className="text-white small">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Monitoring Status */}
          <div className="col-lg-4">
            {/* Real-time Status */}
            <Card className="border-0 shadow-lg mb-4" style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <h5 className="text-white mb-0">Real-time Status</h5>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="space-y-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-white small">Video Status</span>
                    <Badge bg={isVideoPlaying ? 'success' : 'secondary'}>
                      {isVideoPlaying ? 'Playing' : 'Paused'}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-white small">Focus Status</span>
                    <Badge bg={focusActive ? 'info' : 'warning'}>
                      {focusActive ? 'Focused' : 'Lost'}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-white small">Posture</span>
                    <Badge bg={postureStatus.includes('Good') ? 'success' : 'warning'}>
                      {postureStatus.includes('Good') ? 'Good' : 'Poor'}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-white small">Attention</span>
                    <Badge bg={attentionStatus.includes('Focused') ? 'info' : 'danger'}>
                      {attentionStatus}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-white small">AI Monitoring</span>
                    <Badge bg={isMonitoring ? 'success' : 'secondary'}>
                      {isMonitoring ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Test Instructions */}
            <Card className="border-0 shadow-lg" style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <h5 className="text-white mb-0 d-flex align-items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Test Real-time Behavior
                </h5>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="text-muted small">
                  <h6 className="text-white mb-2">🔄 Try these actions:</h6>
                  <ul className="mb-3" style={{ paddingLeft: '1.2rem' }}>
                    <li><strong>While video is playing:</strong> Progress increases live, status updates instantly</li>
                    <li><strong>Switch tabs:</strong> Video auto-pauses, timer pauses, progress freezes</li>
                    <li><strong>Minimize window:</strong> Status changes to Distracted</li>
                    <li><strong>Return to tab:</strong> Focus regained, ready to resume</li>
                  </ul>
                  
                  <h6 className="text-white mb-2">📊 What happens:</h6>
                  <ul style={{ paddingLeft: '1.2rem' }}>
                    <li><strong>Monitoring ON:</strong> Camera shows On, attention tracking active</li>
                    <li><strong>Monitoring OFF:</strong> Camera shows Off, progress enforcement paused</li>
                    <li><strong>Focus Lost:</strong> Video auto-pauses, status changes</li>
                    <li><strong>Focus Regained:</strong> Ready to resume video playback</li>
                  </ul>
                  
                  <div className="p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                    <p className="text-white small mb-1">
                      💡 <strong>Check browser console</strong> to see real-time behavior logs
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}