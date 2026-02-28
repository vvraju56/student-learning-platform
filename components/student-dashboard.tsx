"use client"

import { useState, useEffect } from "react"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Badge from "react-bootstrap/Badge"
import ProgressBar from "react-bootstrap/ProgressBar"
import { 
  CheckCircle, Heart, Brain, Camera, Cog, Play, Square, Info, Lock, 
  BookOpen, ChartBar, UserCircle, Clock, AlertTriangle, Eye, EyeOff,
  Activity, PauseCircle, PlayCircle, LogOut, RotateCcw, Monitor, Smartphone
} from "lucide-react"
import { listenToUserProgress, saveContinueLearningDataToFirebase } from "../lib/firebase"

interface StudentDashboardProps {
  user: any
  profile: any
  videoProgress: any[]
  sessionData: any
  courseProgress: any
  handleLogout: () => void
}

export function StudentDashboard({ user, profile, videoProgress, sessionData, courseProgress, handleLogout }: StudentDashboardProps) {
  const [sessionActive, setSessionActive] = useState(false)
  const [postureStatus, setPostureStatus] = useState("Leaning Forward")
  const [attentionStatus, setAttentionStatus] = useState("Distracted")
  const [cameraStatus, setCameraStatus] = useState("Not Detected")
  const [aiMonitoringStatus, setAiMonitoringStatus] = useState("Active")
  const [realtimeProgress, setRealtimeProgress] = useState(courseProgress || {})

  const [recentAlerts, setRecentAlerts] = useState<any[]>([])

  // Real-time Firebase listeners
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = listenToUserProgress(user.uid, (data) => {
        if (data) {
          setRealtimeProgress(data)
          if (data.alerts) {
            const alertsArray = Object.values(data.alerts).slice(-5)
            setRecentAlerts(alertsArray as any[])
          }
        }
      })
      return unsubscribe
    }
  }, [user?.uid])

  // Calculate session progress
  const totalSessionTime = sessionData?.totalTime || 0
  const totalSessions = sessionData?.totalSessions || 0
  
  // Use progress from props or realtime data
  const webProgress = realtimeProgress?.courses?.webDevelopment?.progress || courseProgress?.webDevelopment || 0
  const appProgress = realtimeProgress?.courses?.appDevelopment?.progress || courseProgress?.appDevelopment || 0
  const gameProgress = realtimeProgress?.courses?.gameDevelopment?.progress || courseProgress?.gameDevelopment || 0
  const overallProgress = realtimeProgress?.overallProgress || courseProgress?.overall || ((webProgress + appProgress + gameProgress) / 3)

  // Course data
  const courses = [
    {
      id: 'webDevelopment',
      name: 'Web Development',
      icon: <Monitor className="w-5 h-5" />,
      progress: webProgress,
      color: '#3b82f6'
    },
    {
      id: 'appDevelopment', 
      name: 'App Development',
      icon: <Smartphone className="w-5 h-5" />,
      progress: appProgress,
      color: '#10b981'
    },
    {
      id: 'gameDevelopment',
      name: 'Game Development', 
      icon: <PlayCircle className="w-5 h-5" />,
      progress: gameProgress,
      color: '#f59e0b'
    }
  ]



  const getStatusColor = (status: string, type: 'posture' | 'attention' | 'camera') => {
    if (type === 'posture') {
      return status.includes('Good') ? 'success' : 'warning'
    } else if (type === 'attention') {
      return status.includes('Focused') ? 'success' : 'danger'
    } else {
      return status.includes('Detected') ? 'success' : 'danger'
    }
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
      {/* Header with User Info */}
      <header style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }} className="text-white">
        <div className="container-fluid">
          <div className="row align-items-center py-3">
            <div className="col">
              <h1 className="h3 mb-0 text-white">SMART LEARNING DASHBOARD</h1>
              <p className="mb-0 text-muted small">Real-time Learning Analytics & Monitoring</p>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3">
                <div className="text-end">
                  <div className="text-white small">{user?.email}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Session Active</div>
                </div>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 me-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container-fluid py-4" style={{ backgroundColor: '#000000' }}>
        {/* Overall Progress Section */}
        <div className="row g-4 mb-4">
          <div className="col-lg-12">
            <Card className="text-center" style={{ backgroundColor: '#0a0a0a', color: '#ffffff', border: '1px solid #1a1a1a' }}>
              <Card.Body className="p-4">
                <h2 className="h3 text-white mb-3">Overall Learning Progress</h2>
                <div className="display-1 fw-bold mb-3" style={{ color: '#3b82f6' }}>
                  {Math.round(overallProgress)}%
                </div>
                <ProgressBar 
                  now={overallProgress} 
                  style={{ 
                    height: '30px', 
                    backgroundColor: '#1a1a1a',
                    fontSize: '14px'
                  }}
                  variant="primary"
                  label={`${Math.round(overallProgress)}%`}
                />
                <div className="mt-3 text-muted">
                  Calculated from {courses.length} courses • Updates in real-time
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        <div className="row g-4">
          {/* Course-wise Progress */}
          <div className="col-lg-8">
            <Card style={{ backgroundColor: '#0a0a0a', color: '#ffffff', border: '1px solid #1a1a1a' }}>
              <Card.Header className="border-secondary">
                <h3 className="h5 text-white mb-0">
                  <BookOpen className="w-5 h-5 me-2" />
                  Course-wise Progress Analysis
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="row g-3">
                  {courses.map((course) => (
                    <div key={course.id} className="col-md-4">
                      <Card className="h-100" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                        <Card.Body>
                          <div className="d-flex align-items-center mb-3">
                            <div className="me-2" style={{ color: course.color }}>
                              {course.icon}
                            </div>
                            <h6 className="mb-0 text-white">{course.name}</h6>
                          </div>
                          <div className="mb-2">
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small text-muted">Progress</span>
                              <span className="small text-white">{Math.round(course.progress)}%</span>
                            </div>
                            <ProgressBar 
                              now={course.progress} 
                              style={{ 
                                height: '8px', 
                                backgroundColor: '#2a2a2a'
                              }}
                              variant="primary"
                            />
                          </div>
                          <Badge 
                            bg={course.progress >= 100 ? 'success' : course.progress > 0 ? 'warning' : 'secondary'}
                            className="w-100"
                          >
                            {course.progress >= 100 ? 'Completed' : course.progress > 0 ? 'In Progress' : 'Not Started'}
                          </Badge>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Real-time Monitoring Status */}
          <div className="col-lg-4">
            <Card style={{ backgroundColor: '#0a0a0a', color: '#ffffff', border: '1px solid #1a1a1a' }}>
              <Card.Header className="border-secondary">
                <h3 className="h5 text-white mb-0">
                  <Eye className="w-5 h-5 me-2" />
                  Real-time Monitoring Status
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
                    <span className="small text-muted">Posture</span>
                    <Badge bg={getStatusColor(postureStatus, 'posture')}>
                      {postureStatus}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
                    <span className="small text-muted">Attention</span>
                    <Badge bg={getStatusColor(attentionStatus, 'attention')}>
                      {attentionStatus}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
                    <span className="small text-muted">Face Detection</span>
                    <Badge bg={getStatusColor(cameraStatus, 'camera')}>
                      {cameraStatus}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="small text-muted">Face Monitoring</span>
                    <Badge bg={aiMonitoringStatus === 'Active' ? 'success' : 'danger'}>
                      {aiMonitoringStatus}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        <div className="row g-4 mt-1">
          {/* Recent Alerts */}
          <div className="col-lg-12">
            <Card style={{ backgroundColor: '#0a0a0a', color: '#ffffff', border: '1px solid #1a1a1a' }}>
              <Card.Header className="border-secondary">
                <h3 className="h5 text-white mb-0">
                  <AlertTriangle className="w-5 h-5 me-2" />
                  Recent Activity & Alerts
                </h3>
              </Card.Header>
              <Card.Body>
                {recentAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {recentAlerts.map((alert: any, index: number) => (
                      <div key={index} className="d-flex align-items-center gap-2 py-2 border-bottom border-secondary">
                        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                        <div className="flex-1">
                          <div className="small text-white">{alert.message}</div>
                          <div className="x-small text-muted">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                    <p className="text-muted mb-0">No recent violations</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Session Statistics */}
        <div className="row g-4 mt-1">
          <div className="col-lg-12">
            <Card style={{ backgroundColor: '#0a0a0a', color: '#ffffff', border: '1px solid #1a1a1a' }}>
              <Card.Header className="border-secondary">
                <h3 className="h5 text-white mb-0">
                  <Clock className="w-5 h-5 me-2" />
                  Session Statistics
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-primary mb-1">{totalSessions}</div>
                      <div className="small text-muted">Total Sessions</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-success mb-1">{Math.round(totalSessionTime)} min</div>
                      <div className="small text-muted">Total Learning Time</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-warning mb-1">{Math.round(overallProgress)}%</div>
                      <div className="small text-muted">Completion Rate</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="h4 text-info mb-1">
                        {aiMonitoringStatus === 'Active' ? 'Online' : 'Offline'}
                      </div>
                      <div className="small text-muted">System Status</div>
                    </div>
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