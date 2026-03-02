"use client"

import { useState, useEffect } from "react"
import { Button, Badge } from "react-bootstrap"
import { useRealtimeMonitoring } from "../hooks/use-realtime-monitoring"
import { useVideoValidation } from "../hooks/use-video-validation"
import { 
  AlertTriangle, Camera, Play, Pause, SkipForward, CheckCircle, 
  TrendingUp, Shield, Activity, RefreshCw
} from "lucide-react"

interface VideoPlayerProps {
  user: any
  courseId: string
  videoId: string
  videoUrl: string
  title: string
  duration: number
  nextVideoId?: string
  onVideoComplete: (metrics: any) => void
  onViolation: (violation: string, data: any) => void
}

interface EnhancedVideoPlayerProps extends VideoPlayerProps {
  enableAutoNext?: boolean
  onAutoNext?: (videoId: string) => void
}

interface VideoEndModalProps {
  show: boolean
  onDismiss: () => void
  status: 'valid' | 'invalid'
}

function VideoEndModal({ show, onDismiss, status }: VideoEndModalProps) {
  if (!show) return null

  return (
    <div 
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onDismiss}
    >
      <div 
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          color: '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {status === 'valid' ? (
            <>
              <CheckCircle className="w-16 h-16 text-success mb-3 mx-auto" />
              <h3>🎉 Video Completed!</h3>
              <p>You have successfully completed this video with proper attention.</p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-16 h-16 text-danger mb-3 mx-auto" />
              <h3>⚠️ Incomplete Video</h3>
              <p>You need to watch this video properly to continue.</p>
            </>
          )}
          <Button variant="primary" onClick={onDismiss}>
            {status === 'valid' ? 'Continue' : 'Retry'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function EnhancedVideoPlayer({
  user,
  courseId,
  videoId,
  videoUrl,
  title,
  duration,
  nextVideoId,
  onVideoComplete,
  onViolation,
  enableAutoNext = true,
  onAutoNext
}: EnhancedVideoPlayerProps) {
  const [showVideoEndModal, setShowVideoEndModal] = useState(false)
  const [videoEndStatus, setVideoEndStatus] = useState<'valid' | 'invalid'>('invalid')
  const [autoNextCountdown, setAutoNextCountdown] = useState(0)
  
  const realtimeMonitoring = useRealtimeMonitoring(user?.uid || 'demo-user')
  const videoValidation = useVideoValidation(user?.uid || 'demo-user')
  
  // Handle video completion
  const handleVideoEnd = () => {
    const validation = videoValidation.validateVideoCompletion()
    
    console.log(`🔍 Video ended - Validating completion rules...`)
    
    setVideoEndStatus(validation.isValid ? 'valid' : 'invalid')
    setShowVideoEndModal(true)
    
    if (validation.isValid && onVideoComplete) {
      onVideoComplete({
        videoId,
        courseId,
        totalWatchTime: videoValidation.state.watchTime,
        violations: videoValidation.state.violations,
        completionPercentage: videoValidation.state.completionPercentage
      })
    }
    
    // Auto-next video functionality
    if (enableAutoNext && validation.isValid && nextVideoId) {
      console.log('🎯 Setting up auto-next video countdown...')
      setAutoNextCountdown(3)
    }
  }
  
  // Handle auto-next video countdown
  useEffect(() => {
    if (autoNextCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoNextCountdown(prev => prev - 1)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [autoNextCountdown])
  
  // Auto-start next video when countdown reaches 0
  useEffect(() => {
    if (autoNextCountdown === 0 && videoEndStatus === 'valid' && nextVideoId) {
      console.log('🎬 Auto-starting next video:', nextVideoId)
      
      if (onAutoNext) {
        onAutoNext(nextVideoId)
      }
      
      // Reset countdown for next video
      setAutoNextCountdown(0)
      
      // Hide modal after 2 seconds
      setTimeout(() => {
        setShowVideoEndModal(false)
      }, 2000)
    }
  }, [autoNextCountdown, videoEndStatus, nextVideoId, onAutoNext])
  
  // Dismiss video end modal
  const dismissVideoEndModal = () => {
    setShowVideoEndModal(false)
    if (videoEndStatus === 'invalid') {
      console.log('🚫 User dismissed invalid video completion modal')
    }
  }
  
  // Retry video with clean state
  const retryVideoWithCleanState = () => {
    console.log('🔄 Retrying video with clean state')
    
    // Reset validation
    videoValidation.resetValidation()
    
    setVideoEndStatus('invalid')
    setShowVideoEndModal(false)
  }
  
  return (
    <>
      {/* Enhanced Video Player with Auto-Next */}
      <div className="min-vh-100" style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}>
        {/* Video Content */}
        <div className="d-flex align-items-start justify-content-between">
          <div className="flex-grow-1 pe-3">
            <div className="text-white">
              <h1 className="h3 mb-2">{title}</h1>
              <p className="text-muted">
                Course: {courseId.replace('-', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex-shrink-0 ps-3">
            <div className="d-flex justify-content-end">
              <Badge bg={videoValidation.state.isCompleted ? 'success' : 'secondary'} className="mb-2">
                {videoValidation.state.isCompleted ? 'Completed' : 'In Progress'}
              </Badge>
              
              <div className="text-end">
                <span className="text-white small">
                  {videoValidation.state.completionPercentage}% Complete
                </span>
              </div>
            </div>
          </div>
          
          {/* Auto-next Video Status */}
          {enableAutoNext && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-info small">
                <TrendingUp className="w-4 h-4" />
                Auto-next video enabled
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Video Controls */}
      <div className="d-flex gap-3 mb-4">
        <Button 
          variant="outline-light" 
          size="sm"
          onClick={() => {
            if (videoValidation.state.isVideoPlaying) {
              videoValidation.pauseVideo()
            } else {
              videoValidation.resumeVideo()
            }
          }}
          className="d-flex align-items-center gap-1"
        >
          {videoValidation.state.isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {videoValidation.state.isVideoPlaying ? 'Pause' : 'Play'}
        </Button>
        
        <Button variant="outline-light" size="sm" onClick={() => videoValidation.resetValidation()}>
          <RefreshCw className="w-4 h-4" />
          Reset Progress
        </Button>
        
        <Button 
          variant="outline-success" 
          size="sm"
          onClick={handleVideoEnd}
        >
          Simulate Video End
        </Button>
      </div>
      
      {/* Progress Bar */}
      <div className="progress-info mb-3">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-white small">
            {videoValidation.state.completionPercentage}% Watched
          </span>
          <div className="text-white small">
            {videoValidation.state.watchTime}s / 60s / {Math.round(duration / 60)}m
          </div>
        </div>
        <div className="progress" style={{ height: '8px' }}>
          <div 
            className="progress-bar"
            style={{
              width: `${videoValidation.state.completionPercentage}%`,
              backgroundColor: videoValidation.state.completionPercentage > 0 ? '#28a745' : '#dc3545'
            }}
          />
        </div>
      </div>
      
      {/* Violations Display */}
      <div className="violations-info p-3">
        <div className="row g-3 text-center">
          <div className="col-md-3">
            <div className="text-center p-2 rounded bg-warning">
              <AlertTriangle className="w-6 h-6" />
              <div className="mt-2">Tab Switches</div>
              <div className="text-white fw-bold">
                {videoValidation.state.violations.tabSwitches}/10
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="text-center p-2 rounded bg-danger">
              <Camera className="w-6 h-6" />
              <div className="mt-2">Face Missing</div>
              <div className="text-white fw-bold">
                {videoValidation.state.violations.faceMissingEvents}/10
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="text-center p-2 rounded bg-info">
              <Activity className="w-6 h-6" />
              <div className="mt-2">Auto Pauses</div>
              <div className="text-white fw-bold">
                {videoValidation.state.violations.autoPauses}/10
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="text-center p-2 rounded bg-light">
              <SkipForward className="w-6 h-6" />
              <div className="mt-2">Skip Count</div>
              <div className="text-white fw-bold">
                {videoValidation.state.violations.skipCount}/5
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auto-Next Countdown Display */}
      {autoNextCountdown > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999,
            opacity: 0.9
          }}
          className="text-center"
        >
          <div 
            className="countdown-timer bg-dark text-white rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{ 
              width: '120px',
              height: '120px',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}
          >
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-info mb-2" />
              <div className="countdown-number">{autoNextCountdown}</div>
              <div className="small">Next Video</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Video End Modal */}
      <VideoEndModal
        show={showVideoEndModal}
        onDismiss={videoEndStatus === 'invalid' ? retryVideoWithCleanState : dismissVideoEndModal}
        status={videoEndStatus}
      />
    </>
  )
}