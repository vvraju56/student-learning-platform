"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Badge from "react-bootstrap/Badge"
import Modal from "react-bootstrap/Modal"
import Alert from "react-bootstrap/Alert"
import { 
  Monitor, Smartphone, PlayCircle, Play, Clock, CheckCircle, ArrowLeft, 
  Camera, CameraOff, AlertTriangle, Shield, Eye, Lock, Unlock
} from "lucide-react"

// Import our monitoring hooks
import { useRealtimeFaceDetection } from "../hooks/use-realtime-face-detection"
import { usePostureDetection } from "../hooks/use-posture-detection"
import { useRealtimeAlertSystem } from "../hooks/use-realtime-alert-system"

interface CoursePageProps {
  user: any
  profile: any
}

export function CoursePage({ user, profile }: CoursePageProps) {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [pendingCourse, setPendingCourse] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [courseBlocked, setCourseBlocked] = useState(false)

  // Initialize monitoring systems
  const faceDetection = useRealtimeFaceDetection()
  const postureDetection = usePostureDetection()
  const alertSystem = useRealtimeAlertSystem(user?.uid || 'demo-user')

  const courses = [
    {
      id: 'web-development',
      name: 'Web Development',
      icon: <Monitor className="w-8 h-8" />,
      description: 'Learn modern web development with React, Node.js, and more',
      totalVideos: 10,
      duration: '8 hours',
      difficulty: 'Intermediate',
      color: '#10b981'
    },
    {
      id: 'app-development',
      name: 'App Development', 
      icon: <Smartphone className="w-8 h-8" />,
      description: 'Build mobile apps with React Native and Flutter',
      totalVideos: 10,
      duration: '10 hours',
      difficulty: 'Intermediate',
      color: '#3b82f6'
    },
    {
      id: 'game-development',
      name: 'Game Development',
      icon: <PlayCircle className="w-8 h-8" />,
      description: 'Create games using Unity and game development principles',
      totalVideos: 10,
      duration: '12 hours',
      difficulty: 'Advanced',
      color: '#f59e0b'
    }
  ]

  // STEP 1: CAMERA PERMISSION REQUEST (MANDATORY)
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      console.log('📷 Requesting MANDATORY camera permission...')
      
      // Request camera permission - this is MANDATORY
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      
      // Immediately stop stream - monitoring will start later
      stream.getTracks().forEach(track => track.stop())
      
      console.log('✅ Camera permission GRANTED')
      return true
      
    } catch (error) {
      console.error('❌ Camera permission DENIED:', error)
      setCameraError('Camera access is mandatory for course access. Permission denied.')
      return false
    }
  }

  // STEP 2: BLOCK COURSE IF CAMERA DENIED
  const blockCourseStart = () => {
    console.log('🚫 Course BLOCKED - Camera permission denied')
    setCourseBlocked(true)
    setCameraError('Camera permission is required to start any course. Access denied.')
    
    // Add critical alert for denial
    alertSystem.addAlert({
      type: 'attention',
      severity: 'critical',
      message: 'Course access denied - Camera permission required',
      courseId: pendingCourse || 'unknown',
      videoId: 'course-start'
    })
  }

  // STEP 3: START AI MONITORING AUTOMATICALLY
  const startAIMonitoring = async () => {
    setIsInitializing(true)
    setCameraError(null)
    
    try {
      console.log('🚀 Starting MANDATORY AI Monitoring...')
      
      // Request camera permission (MANDATORY)
      const cameraAllowed = await requestCameraPermission()
      
      if (!cameraAllowed) {
        blockCourseStart()
        setIsInitializing(false)
        return
      }
      
      // Start face detection
      await faceDetection.startWebcam()
      
      // Wait for camera initialization
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Verify camera is actually working
      if (!faceDetection.isWebcamActive) {
        throw new Error('Camera initialization failed')
      }
      
      // Start posture detection
      await postureDetection.startDetection()
      
      // Add initial alert
      await alertSystem.addAlert({
        type: 'attention',
        severity: 'low',
        message: 'AI Monitoring started successfully',
        courseId: pendingCourse || 'unknown',
        videoId: 'course-start'
      })
      
      console.log('✅ MANDATORY AI Monitoring started successfully')
      
      // Navigate to course videos
      if (pendingCourse) {
        router.push(`/courses/${pendingCourse}/videos`)
      }
      
      setShowCameraModal(false)
      setIsInitializing(false)
      setCourseBlocked(false)
      
    } catch (error) {
      console.error('❌ AI Monitoring failed:', error)
      blockCourseStart()
      setIsInitializing(false)
    }
  }

  // STEP 4: HANDLE CAMERA DENIED
  const handleCameraDenied = () => {
    console.log('🚫 User DENIED camera permission - BLOCKING course')
    blockCourseStart()
    
    // Show denial for 3 seconds then close modal
    setTimeout(() => {
      setShowCameraModal(false)
      setPendingCourse(null)
    }, 3000)
  }

  // STEP 5: COURSE START HANDLER (MANDATORY CAMERA)
  const handleCourseSelect = async (courseId: string) => {
    console.log(`🎯 Course selected: ${courseId}`)
    
    // Check if monitoring is already active
    if (faceDetection.isWebcamActive && postureDetection.isConnected) {
      console.log('✅ AI Monitoring already active - proceeding to course')
      router.push(`/courses/${courseId}/videos`)
      return
    }
    
    // Show mandatory camera permission modal
    setPendingCourse(courseId)
    setShowCameraModal(true)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  // STEP 6: MONITOR CAMERA DISCONNECTION (BLOCK IF OFF MID-COURSE)
  useEffect(() => {
    const handleCameraDisconnect = async () => {
      if (faceDetection.isWebcamActive && !faceDetection.isFaceDetected) {
        console.log('⚠️ Camera disconnected during course - BLOCKING progress')
        
        // Stop all monitoring
        faceDetection.stopWebcam()
        postureDetection.stopDetection()
        
        // Add critical alert
        await alertSystem.addAlert({
          type: 'attention',
          severity: 'critical',
          message: 'Camera disconnected - Course progress paused',
          courseId: 'unknown',
          videoId: 'course-active'
        })
        
        setCourseBlocked(true)
        setCameraError('Camera disconnected. Please reconnect to continue.')
      }
    }

    // Check every 2 seconds for camera disconnection
    const interval = setInterval(handleCameraDisconnect, 2000)
    
    return () => {
      clearInterval(interval)
    }
  }, [faceDetection.isWebcamActive, faceDetection.isFaceDetected])

  if (courseBlocked) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" 
           style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center">
          <Lock className="w-16 h-16 text-danger mb-3 mx-auto" />
          <h4 className="text-white mb-3">Course Access Blocked</h4>
          <Alert variant="danger" className="mb-3">
            <AlertTriangle className="w-4 h-4 me-2" />
            {cameraError || 'Camera permission required'}
          </Alert>
          <p className="text-muted mb-4">
            Camera access is mandatory to start any course. 
            Please allow camera access and try again.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="secondary" onClick={handleBackToDashboard}>
              <ArrowLeft className="w-4 h-4 me-2" />
              Back to Dashboard
            </Button>
            <Button variant="primary" onClick={() => setCourseBlocked(false)}>
              <Camera className="w-4 h-4 me-2" />
              Retry Camera Access
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedCourse) {
    // Show loading while redirecting
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" 
           style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white">Loading course content...</p>
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
                  onClick={handleBackToDashboard}
                  className="d-flex align-items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="h3 mb-0 text-white fw-bold">Select Course</h1>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.875rem' }}>
                    Choose a course to continue your learning journey
                  </p>
                </div>
              </div>
            </div>
            <div className="col-auto">
              <div className="text-end">
                <div className="text-white small fw-medium">{user?.email}</div>
                <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                  {faceDetection.isWebcamActive ? (
                    <>
                      <Camera className="w-3 h-3 text-success" />
                      <strong>AI Monitoring Active</strong>
                    </>
                  ) : (
                    <>
                      <CameraOff className="w-3 h-3 text-danger" />
                      <strong>Monitoring Required</strong>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Course Selection */}
      <main className="container-fluid py-5">
        <div className="row g-4 justify-content-center">
          {courses.map((course) => (
            <div key={course.id} className="col-lg-4 col-md-6">
              <Card 
                className="border-0 shadow-lg h-100 course-card"
                style={{ 
                  backgroundColor: '#1a1a1a', 
                  borderRadius: '16px',
                  border: '1px solid #2a2a2a',
                  cursor: courseBlocked ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  opacity: courseBlocked ? 0.5 : 1
                }}
                onClick={courseBlocked ? undefined : () => handleCourseSelect(course.id)}
                onMouseEnter={(e) => {
                  if (!courseBlocked) {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!courseBlocked) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <Card.Body className="p-4">
                  {/* Course Icon and Name */}
                  <div className="text-center mb-4">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ 
                        backgroundColor: course.color + '20', 
                        color: course.color,
                        width: '80px',
                        height: '80px'
                      }}
                    >
                      {course.icon}
                    </div>
                    <h3 className="h5 text-white fw-bold mb-2">{course.name}</h3>
                    <Badge 
                      bg={course.difficulty === 'Advanced' ? 'danger' : 
                            course.difficulty === 'Intermediate' ? 'warning' : 'success'}
                      className="mb-3"
                    >
                      {course.difficulty}
                    </Badge>
                  </div>

                  {/* Course Description */}
                  <p className="text-muted text-center mb-4">
                    {course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <div className="text-center p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                        <div className="small text-muted">Videos</div>
                        <div className="fw-bold text-white">{course.totalVideos}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                        <div className="small text-muted">Duration</div>
                        <div className="fw-bold text-white">{course.duration}</div>
                      </div>
                    </div>
                  </div>

                  {/* Start Course Button */}
                  <Button 
                    variant="primary" 
                    className="w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ 
                      backgroundColor: courseBlocked ? '#6b7280' : course.color,
                      borderColor: courseBlocked ? '#6b7280' : course.color,
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: courseBlocked ? 'not-allowed' : 'pointer'
                    }}
                    disabled={courseBlocked}
                  >
                    {courseBlocked ? <Lock className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {courseBlocked ? 'Access Blocked' : 'Start Course'}
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>

        {/* Camera Permission Requirements */}
        <div className="row mt-5">
          <div className="col-lg-8 mx-auto">
            <Card className="border-0" style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '16px',
              border: '1px solid #2a2a2a'
            }}>
              <Card.Body className="p-4">
                <h4 className="text-white mb-3 d-flex align-items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  🎯 CAMERA PERMISSION (MANDATORY)
                </h4>
                
                <Alert variant="danger" className="mb-3">
                  <Camera className="w-4 h-4 me-2" />
                  <strong>Camera Access Required:</strong> All courses require MANDATORY camera access for AI monitoring.
                </Alert>
                
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="text-white mb-2">📷 What's Monitored:</h6>
                    <ul className="text-muted small">
                      <li>Face detection & presence</li>
                      <li>Posture & sitting position</li>
                      <li>Focus & attention level</li>
                      <li>Tab switching behavior</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-white mb-2">🚫 Anti-Cheat Measures:</h6>
                    <ul className="text-muted small">
                      <li>📷 MANDATORY camera access</li>
                      <li>🚫 No bypassing allowed</li>
                      <li>📊 Real-time monitoring</li>
                      <li>⏸️ Auto-pause on violations</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                  <p className="text-white small mb-0">
                    <strong>⚠️ MANDATORY REQUIREMENT:</strong> Camera permission is absolutely required to start any course. 
                    If you deny camera access, you will NOT be able to start the course. This ensures fair monitoring 
                    and prevents academic misconduct.
                  </p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </main>

      {/* MANDATORY Camera Permission Modal */}
      <Modal 
        show={showCameraModal} 
        centered 
        backdrop="static" 
        keyboard={false}
        className="text-white"
      >
        <Modal.Body style={{ backgroundColor: '#1a1a1a' }} className="text-center py-5">
          {isInitializing ? (
            <>
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Initializing...</span>
              </div>
              <h4 className="text-white mb-3">Initializing MANDATORY AI Monitoring...</h4>
              <p className="text-muted mb-4">
                Setting up required monitoring systems...
              </p>
              <div className="text-muted small">
                <div className="mb-2">📷 Requesting MANDATORY camera access...</div>
                <div className="mb-2">🧍 Starting posture detection...</div>
                <div className="mb-2">👤 Initializing face tracking...</div>
                <div>🔧 Setting up monitoring alerts...</div>
              </div>
            </>
          ) : (
            <>
              <Camera className="w-16 h-16 text-primary mb-3 mx-auto" />
              <h4 className="text-white mb-3">📷 MANDATORY Camera Permission</h4>
              <Alert variant="warning" className="mb-3">
                <Camera className="w-4 h-4 me-2" />
                <strong>Camera access is MANDATORY</strong> to start any course.
              </Alert>
              <p className="text-muted mb-4">
                To proceed with this course, you must allow camera access for AI monitoring. 
                This ensures focused learning and prevents academic misconduct. <strong>Camera access is not optional.</strong>
              </p>
              
              <div className="text-start mb-4 p-3 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                <h6 className="text-white mb-2">🎯 MANDATORY Monitoring:</h6>
                <ul className="text-muted small">
                  <li>✅ Face detection to ensure you're present</li>
                  <li>✅ Posture monitoring for healthy learning habits</li>
                  <li>✅ Attention tracking to prevent distractions</li>
                  <li>✅ Tab switching detection to maintain focus</li>
                  <li>✅ <strong>No bypassing allowed</strong></li>
                </ul>
              </div>
              
              <div className="d-flex justify-content-center gap-2">
                <Button 
                  variant="danger" 
                  onClick={handleCameraDenied}
                  className="d-flex align-items-center gap-2"
                >
                  <CameraOff className="w-4 h-4" />
                  Block Camera (Deny Course)
                </Button>
                <Button 
                  variant="success" 
                  onClick={startAIMonitoring}
                  className="d-flex align-items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Allow Camera (Start Course)
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .course-card:hover .card-body {
          background: linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%);
        }
      `}</style>
    </div>
  )
}