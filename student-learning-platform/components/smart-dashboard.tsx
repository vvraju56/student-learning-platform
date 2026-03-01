"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Badge from "react-bootstrap/Badge"
import ProgressBar from "react-bootstrap/ProgressBar"
import { 
  Video, Book, User, BarChart3, Camera, Play, Eye, Activity, 
  CheckCircle, AlertTriangle, Lock, Monitor, Smartphone, Clock, Target
} from "lucide-react"
import { MonitoringProvider, useMonitoring } from "../contexts/monitoring-context"
import { FirebaseProgressManager } from "../lib/firebase-progress"
import { courses } from "../lib/courses-data"

interface SmartDashboardProps {
  user: any
  profile: any
  handleLogout: () => void
}

// Comprehensive bright white text styling
const brightWhiteStyle = {
  color: '#ffffff',
  textShadow: '0 0 1px rgba(255,255,255,0.5)'
}

const brightWhiteTextStyle = {
  color: '#ffffff',
  opacity: 1,
  fontWeight: 'inherit',
  fontSize: 'inherit'
}

const courseDisplayData: { [key: string]: { icon: JSX.Element; bgColor: string; textColor: string } } = {
  'web-development': { icon: <Monitor className="w-5 h-5" />, bgColor: '#2563eb', textColor: '#2563eb' },
  'app-development': { icon: <Smartphone className="w-5 h-5" />, bgColor: '#1a3a5a', textColor: '#1a3a5a' },
  'game-development': { icon: <Target className="w-5 h-5" />, bgColor: '#991b1b', textColor: '#991b1b' },
}

function SmartDashboardContent({ user, profile, handleLogout }: SmartDashboardProps) {
  const router = useRouter()
  const {
    isVideoPlaying,
    focusActive,
    isMonitoring,
    postureStatus,
    attentionStatus,
    cameraStatus,
    startMonitoring,
    stopMonitoring,
  } = useMonitoring()

  const [overallProgress, setOverallProgress] = useState(0)
  const [courseProgress, setCourseProgress] = useState<{[key: string]: {progress: number, completedVideos: number, totalVideos: number}}>({})
  const [learningStats, setLearningStats] = useState({totalHours: 0, completedVideos: 0, totalViolations: 0})
  const [isLoading, setIsLoading] = useState(true)
  
  // Firebase manager for progress tracking - only create if user is logged in
  const firebaseManager = user?.uid ? new FirebaseProgressManager(user.uid) : null

  const isFirstLoad = useRef(true)
  
  useEffect(() => {
    // Load user progress from Firebase AND localStorage
    const loadProgress = async () => {
      if (!firebaseManager) return // Don't load if not logged in
      
      if (isFirstLoad.current) {
        setIsLoading(true)
        isFirstLoad.current = false
      }
      try {
        // First try to load from Firebase
        const userProgress = await Promise.race([
          firebaseManager.getUserProgress(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]).catch(() => null)
        
        const fetchedCoursesData = (userProgress as any)?.courses || {};
        
        const newCourseProgress: {[key: string]: {progress: number, completedVideos: number, totalVideos: number}} = {}
        let totalProgressSum = 0
        let totalCompletedCount = 0
        let coursesWithProgress = 0

        for (const courseDataFromLib of courses) { // Iterate over imported courses
          const courseId = courseDataFromLib.id;
          const courseModules = courseDataFromLib.modules[0]; // Assuming single module
          const totalVideosInCourse = courseModules.videos.length;

          // Check Firebase first, then fall back to localStorage
          let progressData = fetchedCoursesData[courseId] || {};
          let completedVideos = progressData.completedVideos || 0;
          
          // If Firebase has no progress, check localStorage
          if (completedVideos === 0) {
            const localStorageKey = `course_progress_${courseId}`
            const localData = localStorage.getItem(localStorageKey)
            if (localData) {
              try {
                const parsed = JSON.parse(localData)
                completedVideos = Array.isArray(parsed.completedVideos) ? parsed.completedVideos.length : (parsed.completedVideos || 0)
              } catch (e) {
                // Failed to parse
              }
            }
          }
          
          const courseProgressValue = totalVideosInCourse > 0 ? (completedVideos / totalVideosInCourse) * 100 : 0;
          
          newCourseProgress[courseId] = {
            progress: courseProgressValue,
            completedVideos: completedVideos,
            totalVideos: totalVideosInCourse
          }

          totalProgressSum += courseProgressValue;
          totalCompletedCount += completedVideos;
        }

        // Calculate overall progress as: total completed videos / total videos across all courses
        const totalVideosAllCourses = courses.reduce((sum, c) => sum + (c.modules[0]?.videos?.length || 0), 0)
        const overallProgressValue = totalVideosAllCourses > 0 ? (totalCompletedCount / totalVideosAllCourses) * 100 : 0;
        
        setCourseProgress(newCourseProgress)
        setOverallProgress(Math.round(overallProgressValue))
        setLearningStats({
          totalHours: 0,
          completedVideos: totalCompletedCount,
          totalViolations: 0
        })
        setIsLoading(false)
      } catch (error) {
        // Failed to load progress
        setIsLoading(false)
        
        // Fallback: Try loading from localStorage only
        try {
          const localCourseProgress: {[key: string]: {progress: number, completedVideos: number, totalVideos: number}} = {}
          let totalProgressSum = 0
          let totalCompletedCount = 0
          let coursesWithProgress = 0
          
          for (const courseDataFromLib of courses) {
            const courseId = courseDataFromLib.id
            const totalVideosInCourse = courseDataFromLib.modules[0].videos.length
            const localData = localStorage.getItem(`course_progress_${courseId}`)
            
            if (localData) {
              const parsed = JSON.parse(localData)
              const completedVideos = Array.isArray(parsed.completedVideos) ? parsed.completedVideos.length : (parsed.completedVideos || 0)
              const progress = totalVideosInCourse > 0 ? (completedVideos / totalVideosInCourse) * 100 : 0
              
              localCourseProgress[courseId] = {
                progress,
                completedVideos,
                totalVideos: totalVideosInCourse
              }
              
              totalProgressSum += progress
              totalCompletedCount += completedVideos
            } else {
              localCourseProgress[courseId] = { progress: 0, completedVideos: 0, totalVideos: totalVideosInCourse }
            }
          }
          
          const totalVideosAllCourses = courses.reduce((sum, c) => sum + (c.modules[0]?.videos?.length || 0), 0)
          const overallProgressValue = totalVideosAllCourses > 0 ? (totalCompletedCount / totalVideosAllCourses) * 100 : 0
          
          setCourseProgress(localCourseProgress)
          setOverallProgress(Math.round(overallProgressValue))
          setLearningStats(prev => ({ ...prev, completedVideos: totalCompletedCount }))
        } catch (localError) {
          // Failed to load from localStorage
        }
      }
    }

    // Set up real-time updates every 5 seconds
    loadProgress(); // Load initially
    const interval = setInterval(loadProgress, 5000)
    
    // Focus detection for pausing updates
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval); // Clear the interval when page is hidden
      } else {
        // Re-establish interval when page is visible
        loadProgress(); // Load immediately upon regaining focus
        const newInterval = setInterval(loadProgress, 5000);
        return () => clearInterval(newInterval); // Clean up new interval
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval); // Clear initial interval on unmount
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [firebaseManager])

  // Real-time dashboard behavior effects
  useEffect(() => {
    if (isVideoPlaying && focusActive && isMonitoring) {
      // Progress is updating
    }
  }, [isVideoPlaying, focusActive, isMonitoring])

  useEffect(() => {
    if (!focusActive && isVideoPlaying) {
      // Focus lost
    }
  }, [focusActive, isVideoPlaying])

  useEffect(() => {
    if (!isMonitoring) {
      console.log('📷 Camera shows Camera Off')
      console.log('🧠 Attention tracking disabled')
      console.log('⛔ Progress enforcement paused')
    }
  }, [isMonitoring])

  const quickAccessCards = [
    {
      id: 'courses',
      icon: <Video className="w-6 h-6" />,
      title: 'Video Courses',
      text: 'Watch monitored lessons',
      onClick: () => router.push('/courses/select'),
      bgColor: 'primary',
      textColor: 'text-primary'
    },
    {
      id: 'materials',
      icon: <Book className="w-6 h-6" />,
      title: 'Study Materials',
      text: 'Browse reading content',
      onClick: () => router.push('/content'),
      bgColor: 'info',
      textColor: 'text-info'
    },
    {
      id: 'profile',
      icon: <User className="w-6 h-6" />,
      title: 'Profile',
      text: 'View your status',
      onClick: () => router.push('/profile'),
      bgColor: 'success',
      textColor: 'text-success'
    },
    {
      id: 'reports',
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Reports',
      text: 'Analytics & progress',
      onClick: () => router.push('/reports'),
      bgColor: 'warning',
      textColor: 'text-warning'
    }
  ]



  // Determine quiz availability based on course progress
  const isWebDevQuizAvailable = (courseProgress['web-development']?.completedVideos || 0) >= 10
  const isAppDevQuizAvailable = (courseProgress['app-development']?.completedVideos || 0) >= 10
  const isGameDevQuizAvailable = (courseProgress['game-development']?.completedVideos || 0) >= 10

  const quizSets = [
    {
      id: 'web-development',
      course: 'Web Development',
      status: isWebDevQuizAvailable ? 'available' : 'locked',
      questions: '20 MCQ + 2 Coding'
    },
    {
      id: 'app-development',
      course: 'Android App Development',
      status: isAppDevQuizAvailable ? 'available' : 'locked',
      questions: '20 MCQ + 2 Coding'
    },
    {
      id: 'game-development',
      course: 'Game Development',
      status: isGameDevQuizAvailable ? 'available' : 'locked',
      questions: '20 MCQ + 2 Coding'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: '#9ca3af' }}>Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#000000' }}>
      {/* 🔝 TOP HEADER BAR */}
      <header style={{ 
        backgroundColor: '#0a0a0a', 
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        ...brightWhiteStyle
      }}>
        <div className="container-fluid">
          <div className="row align-items-center py-3">
            <div className="col">
              <h1 className="h3 mb-0 fw-bold" style={brightWhiteStyle}>DASHBOARD</h1>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-4">
                <div className="text-end">
                  <div className="small fw-medium" style={brightWhiteStyle}>{user?.email}</div>
                  <div className="small" style={{ ...brightWhiteStyle, fontSize: '0.75rem' }}>
                    Session Active
                  </div>
                </div>
                <Button 
                  variant="dark" 
                  size="sm"
                  onClick={handleLogout}
                  className="d-flex align-items-center gap-2 rounded-pill px-3"
                  style={{ backgroundColor: '#000000', borderColor: '#000000' }}
                >
                  <span style={brightWhiteTextStyle}>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container-fluid py-4">
        {/* 🟦 TOP QUICK-ACCESS CARDS (4 CARDS) */}
        <div className="row g-3 mb-4">
          {quickAccessCards.map((card) => (
            <div key={card.id} className="col-lg-3 col-md-6">
              <Card 
                className="border-0 shadow-sm h-100"
                style={{ 
                  backgroundColor: '#0a0a0a', 
                  borderRadius: '12px',
                  border: '1px solid #1a1a1a',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onClick={card.onClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'
                }}
              >
                <Card.Body className="p-3 d-flex align-items-center gap-3">
                  <div 
                    className={`d-flex align-items-center justify-content-center rounded-circle bg-${card.bgColor} bg-opacity-25 ${card.textColor}`}
                    style={{ 
                      color: `var(--bs-${card.bgColor})`, 
                      width: '48px',
                      height: '48px'
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h6 className="mb-1 fw-semibold" style={brightWhiteStyle}>{card.title}</h6>
                    <p className="mb-0" style={{ ...brightWhiteTextStyle, fontSize: '0.85rem' }}>
                      {card.text}
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>

        {/* 📊 OVERALL PROGRESS DASHBOARD */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <Card className="border-0 shadow-lg" style={{ 
              backgroundColor: '#0a0a0a', 
              borderRadius: '12px',
              border: '1px solid #1a1a1a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold" style={brightWhiteStyle}>
                    📊 Overall Progress Dashboard
                  </h5>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#3b82f6' }}>
                        {Math.round(overallProgress)}%
                      </div>
                      <div className="small" style={brightWhiteStyle}>Complete</div>
                    </div>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                
                <h6 className="mb-3 fw-semibold" style={brightWhiteStyle}>Course-wise Progress</h6>
                <div className="row g-3">
                  {courses.map((courseFromLib) => (
                    <div key={courseFromLib.id} className="col-md-4">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div className={`d-flex align-items-center justify-content-center rounded-circle text-${courseDisplayData[courseFromLib.id]?.bgColor} bg-${courseDisplayData[courseFromLib.id]?.bgColor} bg-opacity-25`} style={{width: '32px', height: '32px'}}>
                            {courseDisplayData[courseFromLib.id]?.icon}
                          </div>
                          <h6 className="mb-0 fw-medium" style={brightWhiteStyle}>{courseFromLib.title}</h6>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small" style={brightWhiteStyle}>Progress</span>
                          <span className="small fw-bold" style={{ color: courseDisplayData[courseFromLib.id]?.textColor || '#3b82f6' }}>
                            {Math.round(courseProgress[courseFromLib.id]?.progress || 0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${courseProgress[courseFromLib.id]?.progress || 0}%`,
                              backgroundColor: courseDisplayData[courseFromLib.id]?.bgColor || '#3b82f6',
                            }}
                          />
                        </div>
                        <div className="mt-2 text-center">
                          <span className="x-small" style={brightWhiteStyle}>
                            {courseProgress[courseFromLib.id]?.completedVideos || 0} / {courseProgress[courseFromLib.id]?.totalVideos || 0} videos
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div> {/* Closes col-12 */}
        </div> {/* Closes row g-4 mb-4 */}

        {/* 📚 COURSE PROGRESS SECTION - FULL WIDTH */}
        <div className="row">
          <div className="col-lg-4">
            {/* 📊 Live Course Status Card */}
            <Card className="border-0 shadow-lg mb-4" style={{ 
              backgroundColor: '#0a0a0a', 
              borderRadius: '12px',
              border: '1px solid #1a1a1a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <h5 className="mb-0 fw-bold" style={brightWhiteStyle}>
                  📊 Live Course Status
                </h5>
              </Card.Header>
              <Card.Body className="p-3">
                {/* Posture Status Card */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-medium" style={brightWhiteStyle}>Posture Status</span>
                    <Badge 
                      bg={postureStatus === 'Good' ? 'success' : 'warning'}
                      className="d-flex align-items-center gap-1"
                    >
                      <span style={brightWhiteTextStyle}>{postureStatus}</span>
                    </Badge>
                  </div>
                  <p className="small mb-0" style={brightWhiteStyle}>{postureStatus}</p>
                  <div className="x-small mt-1">
                    <span style={brightWhiteTextStyle}>Updates instantly from posture sensor</span>
                    <div className="mt-1 text-warning">
                      <span style={brightWhiteTextStyle}>Turns warning color if leaning forward</span>
                    </div>
                  </div>
                </div>

                {/* Attention Status Card */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-medium" style={brightWhiteStyle}>Attention Status</span>
                    <Badge 
                      bg={attentionStatus === 'Focused' ? 'info' : attentionStatus === 'Absent' ? 'danger' : 'warning'}
                      className="d-flex align-items-center gap-1"
                    >
                      <span style={brightWhiteTextStyle}>{attentionStatus}</span>
                    </Badge>
                  </div>
                  <p className="small mb-0" style={brightWhiteStyle}>{attentionStatus}</p>
                  <div className="x-small mt-1">
                    <span style={brightWhiteTextStyle}>Changes when tab switch / face not detected</span>
                    <div className="mt-1 text-info">
                      <span style={brightWhiteTextStyle}>Used to pause progress when distracted</span>
                    </div>
                  </div>
                </div>

                {/* Info Text */}
                <div className="p-2 rounded" style={{ backgroundColor: '#1a1a1a' }}>
                  <p className="small mb-0 text-center">
                    <span style={brightWhiteTextStyle}>"Start monitoring below to track in real-time"</span>
                  </p>
                </div>
              </Card.Body>
            </Card>

            {/* Face Monitoring Panel */}
            <Card className="border-0 shadow-lg" style={{ 
              backgroundColor: '#0a0a0a', 
              borderRadius: '12px',
              border: '1px solid #1a1a1a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold" style={brightWhiteStyle}>Face Monitoring</h5>
                  <Badge 
                    bg={isMonitoring ? 'success' : 'secondary'}
                  >
                    <span style={brightWhiteTextStyle}>{isMonitoring ? 'Active' : 'Inactive'}</span>
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                {/* Camera Area */}
                <div className="text-center mb-4">
                  <div 
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ 
                      backgroundColor: cameraStatus ? '#1a3a5a20' : '#1a1a1a',
                      color: cameraStatus ? '#1a3a5a' : '#6b7280',
                      width: '80px',
                      height: '80px'
                    }}
                  >
                    <Camera className="w-10 h-10" />
                  </div>
                  <p className="small mb-3 fw-medium">
                    <span style={brightWhiteTextStyle}>Camera {cameraStatus ? 'On' : 'Off'}</span>
                  </p>
                  
                  <Button 
                    variant={isMonitoring ? 'danger' : 'primary'}
                    size="sm"
                    onClick={async () => {
                      console.log('🖱️ Button clicked, current monitoring state:', isMonitoring)
                      try {
                        if (isMonitoring) {
                          console.log('🖱️ Calling stopMonitoring')
                          stopMonitoring()
                        } else {
                          console.log('🖱️ Calling startMonitoring')
                          await startMonitoring()
                          console.log('🖱️ startMonitoring completed')
                        }
                      } catch (error) {
                        console.error('🖱️ Button click error:', error)
                      }
                    }}
                    className="d-flex align-items-center gap-2 mx-auto px-4 py-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span style={brightWhiteTextStyle}>{isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}</span>
                  </Button>
                </div>

                {/* Monitoring Features */}
                <div className="mt-4">
                  <h6 className="small fw-bold mb-3" style={brightWhiteStyle}>Monitoring Features</h6>
                  <ul className="mb-0" style={{ paddingLeft: '1.2rem' }}>
                    <li className="mb-2">
                      <span style={brightWhiteTextStyle}>Live video feed capture</span>
                    </li>
                    <li className="mb-2">
                      <span style={brightWhiteTextStyle}>Session activity logging</span>
                    </li>
                    <li className="mb-2">
                      <span style={brightWhiteTextStyle}>Real-time alerts</span>
                    </li>
                  </ul>
                  
                  <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#1a1a1a' }}>
                    <p className="small mb-0">
                      <span className="text-info" style={brightWhiteStyle}><strong>Functionality:</strong></span>
                    </p>
                    <p className="small mb-0 mt-1">
                      <span style={brightWhiteTextStyle}>Starts webcam-based face detection</span>
                    </p>
                    <p className="small mb-0 mt-1">
                      <span style={brightWhiteTextStyle}>Activates posture & attention tracking</span>
                    </p>
                    <p className="small mb-0 mt-1">
                      <span style={brightWhiteTextStyle}>Switches status from Inactive → Active</span>
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-lg-8">
            <Card className="border-0 shadow-lg" style={{ 
              backgroundColor: '#0a0a0a', 
              borderRadius: '12px',
              border: '1px solid #1a1a1a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold" style={brightWhiteStyle}>Course Progress</h5>
                  <span className="small">
                    <span style={brightWhiteTextStyle}>{learningStats.completedVideos} video(s) completed</span>
                  </span>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="row g-4">
                  {courses.map((courseFromLib) => (
                    <div key={courseFromLib.id} className="col-md-6">
                      <Card className="border-0 h-100" style={{ 
                        backgroundColor: '#1a1a1a', 
                        borderRadius: '8px'
                      }}>
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-center gap-2 mb-3">
                          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{width: '32px', height: '32px', backgroundColor: (courseDisplayData[courseFromLib.id]?.bgColor || '#3b82f6') + '20', color: courseDisplayData[courseFromLib.id]?.bgColor || '#3b82f6'}}>
                            {courseDisplayData[courseFromLib.id]?.icon}
                          </div>
                          <h6 className="mb-0 fw-semibold" style={brightWhiteStyle}>{courseFromLib.title}</h6>
                        </div>
                        
                          <div className="mb-3">
                            <div className="small fw-medium mb-1" style={brightWhiteStyle}>Videos Completed</div>
                            <ProgressBar 
                              now={courseProgress[courseFromLib.id]?.progress || 0} 
                              style={{ 
                                height: '10px', 
                                backgroundColor: '#1a1a1a',
                                borderRadius: '5px'
                              }}
                              variant={courseDisplayData[courseFromLib.id]?.bgColor}
                            />
                            <div className="text-center mt-2">
                              <span className="fw-bold" style={brightWhiteStyle}>
                                {Math.round(courseProgress[courseFromLib.id]?.progress || 0)}% complete
                              </span>
                            </div>
                          </div>
                          
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => {
                              router.push(`/lecture/${courseFromLib.id}`)
                            }}
                            className="w-100 d-flex align-items-center justify-content-center gap-2"
                            style={{ 
                              backgroundColor: (courseProgress[courseFromLib.id]?.progress || 0) > 0 ? (courseDisplayData[courseFromLib.id]?.bgColor) : '#6b7280',
                              borderColor: (courseProgress[courseFromLib.id]?.progress || 0) > 0 ? (courseDisplayData[courseFromLib.id]?.bgColor) : '#6b7280',
                              borderRadius: '6px'
                            }}
                          >
                            {(courseProgress[courseFromLib.id]?.progress || 0) > 0 ? (
                              <>
                                <Play className="w-4 h-4" />
                                <span style={brightWhiteTextStyle}>Continue Learning</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                <span style={brightWhiteTextStyle}>Start Course</span>
                              </>
                            )}
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* 📝 QUIZ SETS SECTION (BOTTOM RIGHT) */}
            <Card className="border-0 shadow-lg mt-4" style={{ 
              backgroundColor: '#0a0a0a', 
              borderRadius: '12px',
              border: '1px solid #1a1a1a'
            }}>
              <Card.Header className="border-0 bg-transparent py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold" style={brightWhiteStyle}>Quiz Sets</h5>
                  <span className="small">
                    <span style={brightWhiteTextStyle}>Complete videos to unlock quiz sets (20 MCQ + 2 Coding Questions each)</span>
                  </span>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="row g-3">
                  {quizSets.map((quiz) => (
                    <div key={quiz.id} className="col-md-4">
                      <Card 
                        className="border-0"
                        style={{ 
                          backgroundColor: quiz.status === 'available' ? '#1a1a1a' : '#0a0a0a', 
                          borderRadius: '8px',
                          opacity: quiz.status === 'available' ? 1 : 0.6
                        }}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0 fw-medium" style={{ ...brightWhiteStyle, fontSize: '0.95rem' }}>
                              {quiz.course}
                            </h6>
                            <Badge 
                              bg={quiz.status === 'available' ? 'success' : 'secondary'}
                              className="d-flex align-items-center gap-1"
                            >
                              {quiz.status === 'available' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <Lock className="w-3 h-3" />
                              )}
                              <span style={brightWhiteTextStyle}>{quiz.status}</span>
                            </Badge>
                          </div>
                          <p className="small mb-3" style={brightWhiteStyle}>{quiz.questions}</p>
                          
                          {quiz.status === 'available' ? (
                            <Button 
                              variant="success" 
                              size="sm"
                              className="w-100 d-flex align-items-center justify-content-center gap-2"
                              onClick={() => router.push(`/content/${quiz.id}/quiz`)}
                            >
                              <span style={brightWhiteTextStyle}>Start Quiz</span>
                            </Button>
                          ) : (
                            <div className="text-center">
                              <Lock className="w-4 h-4 mb-1" style={{ color: '#6b7280' }} />
                              <div style={brightWhiteTextStyle}>Complete videos to unlock</div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </main>

      {/* 📋 LEARNING DETAILS SECTION - Full width below */}
      <div className="container-fluid py-4">
        <Card className="border-0 shadow-lg" style={{ 
          backgroundColor: '#0a0a0a', 
          borderRadius: '12px',
          border: '1px solid #1a1a1a'
        }}>
          <Card.Header className="border-0 bg-transparent py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold" style={brightWhiteStyle}>Learning Platform Details</h5>
            </div>
          </Card.Header>
          <Card.Body className="p-3">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="p-3 rounded" style={{ backgroundColor: '#1a1a1a' }}>
                  <h6 className="fw-bold mb-3" style={brightWhiteStyle}>
                    <Video className="w-5 h-5 me-2" />
                    Video Learning
                  </h6>
                  <ul className="mb-0" style={{ paddingLeft: '1rem', ...brightWhiteTextStyle }}>
                    <li className="mb-2 small">Each course has 10 video lessons</li>
                    <li className="mb-2 small">Complete 30 min of focused learning per video</li>
                    <li className="mb-2 small">Progress auto-saves and resumes</li>
                    <li className="small">Videos marked complete after time limit</li>
                  </ul>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded" style={{ backgroundColor: '#1a1a1a' }}>
                  <h6 className="fw-bold mb-3" style={brightWhiteStyle}>
                    <Eye className="w-5 h-5 me-2" />
                    Face Monitoring
                  </h6>
                  <ul className="mb-0" style={{ paddingLeft: '1rem', ...brightWhiteTextStyle }}>
                    <li className="mb-2 small">Face detection ensures active participation</li>
                    <li className="mb-2 small">3-second grace period before pausing</li>
                    <li className="mb-2 small">Tab switching detection</li>
                    <li className="small">Real-time attention tracking</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#1a1a1a' }}>
              <h6 className="fw-bold mb-2" style={brightWhiteStyle}>Available Courses</h6>
              <div className="row g-2">
                {courses.map((course) => (
                  <div key={course.id} className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: courseDisplayData[course.id]?.bgColor || '#3b82f6' }} />
                      <span className="small" style={brightWhiteTextStyle}>
                        {course.title} ({course.modules[0]?.videos?.length || 0} videos)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export function SmartDashboard({ user, profile, handleLogout }: SmartDashboardProps) {
  return <SmartDashboardContent user={user} profile={profile} handleLogout={handleLogout} />
}