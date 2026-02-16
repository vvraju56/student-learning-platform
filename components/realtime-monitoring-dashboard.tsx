"use client"

import { useState, useEffect } from "react"
import { Button, Badge, Card, Row, Col } from "react-bootstrap"
import { realtimeDb } from "../lib/firebase"
import { 
  AlertTriangle, Eye, Monitor, Camera, 
  Activity, TrendingUp, TrendingDown, 
  Wifi, WifiOff, RefreshCw, Download, Filter,
  Users, Video, Clock, CheckCircle, XCircle, Pause
} from "lucide-react"

// Import our monitoring hooks
import { useRealtimeMonitoring } from "../hooks/use-realtime-monitoring"
import { useVideoValidation } from "../hooks/use-video-validation"

interface CourseProgress {
  courseId: string
  courseName: string
  totalVideos: number
  completedVideos: number
  totalWatchTime: number
  progressPercentage: number
  lastAccessTime: string
}

interface RealtimeDashboardProps {
  userId: string
}

interface MonitoringState {
  isMonitoring: boolean
  faceDetected: boolean
  postureStatus: 'Good' | 'Leaning Forward' | 'Poor'
  attentionStatus: 'Focused' | 'Distracted' | 'Absent'
  cameraActive: boolean
  lastUpdate: number
}

interface AlertData {
  id: string
  type: 'posture' | 'attention' | 'face' | 'focus' | 'tab_switch' | 'auto_pause' | 'completion' | 'invalid'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  courseId?: string
  videoId?: string
}

export function RealtimeMonitoringDashboard({ userId }: RealtimeDashboardProps) {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  
  // Mock monitoring state (in real app, this would come from context)
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    isMonitoring: false,
    faceDetected: false,
    postureStatus: 'Good',
    attentionStatus: 'Focused',
    cameraActive: false,
    lastUpdate: Date.now()
  })
  
  // Mock alert data (in real app, this would come from context or API)
  const [alerts, setAlerts] = useState<AlertData[]>([
    {
      id: '1',
      type: 'attention',
      severity: 'low',
      message: 'Real-time monitoring system initialized',
      timestamp: Date.now(),
      courseId: 'web-development',
      videoId: 'html-basics'
    },
    {
      id: '2',
      type: 'posture',
      severity: 'medium',
      message: 'User leaning too close to screen',
      timestamp: Date.now() - 3600000,
      courseId: 'web-development',
      videoId: 'css-fundamentals'
    },
    {
      id: '3',
      type: 'face',
      severity: 'high',
      message: 'Face not detected for 3 seconds',
      timestamp: Date.now() - 7200000,
      courseId: 'web-development',
      videoId: 'javascript-intro'
    }
  ])
  
  const realtimeMonitoring = useRealtimeMonitoring(userId)
  const videoValidation = useVideoValidation(userId)
  
  // Filter alerts based on criteria
  const filteredAlerts = alerts.filter(alert => {
    const typeMatch = filterType === 'all' || alert.type === filterType
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity
    
    // Time range filter
    const alertTime = alert.timestamp
    const now = Date.now()
    let timeMatch = true
    
    switch (selectedTimeRange) {
      case '1h':
        timeMatch = (now - alertTime) <= 60 * 60 * 1000
        break
      case '24h':
        timeMatch = (now - alertTime) <= 24 * 60 * 60 * 1000
        break
      case '7d':
        timeMatch = (now - alertTime) <= 7 * 24 * 60 * 60 * 1000
        break
      case '30d':
        timeMatch = (now - alertTime) <= 30 * 24 * 60 * 60 * 1000
        break
      default:
        timeMatch = true
    }
    
    return typeMatch && severityMatch && timeMatch
  })
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'posture': return <Monitor className="w-4 h-4" />
      case 'attention': return <Eye className="w-4 h-4" />
      case 'face': return <Camera className="w-4 h-4" />
      case 'focus': return <Activity className="w-4 h-4" />
      case 'tab_switch': return <WifiOff className="w-4 h-4" />
      case 'auto_pause': return <Pause className="w-4 h-4" />
      case 'completion': return <CheckCircle className="w-4 h-4" />
      case 'invalid': return <XCircle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }
  
  // Export alerts
  const handleExport = () => {
    const exportData = {
      userId,
      exportDate: new Date().toISOString(),
      monitoringState,
      alerts: filteredAlerts,
      courseProgress
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
  }
  
  // Clear alerts
  const handleClearAlerts = () => {
    setAlerts([])
  }
  
  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setRefreshing(false)
  }
  
  return (
    <div className="min-vh-100" style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#1a1a1a', 
        borderBottom: '1px solid #2a2a2a'
      }} className="py-3 px-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <Monitor className="w-6 h-6 text-primary" />
            <div>
              <h1 className="h3 mb-0 text-white fw-bold">Real-time Monitoring Dashboard</h1>
              <p className="mb-0 text-muted">Comprehensive monitoring system overview</p>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <div className="text-end">
              <div className="text-white small fw-medium">{userId}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                {new Date().toLocaleString()}
              </div>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Badge 
                bg={monitoringState.isMonitoring ? 'success' : 'secondary'}
                className="d-flex align-items-center gap-1"
              >
                {monitoringState.isMonitoring ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {monitoringState.isMonitoring ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="d-flex align-items-center gap-1"
              >
                {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </Button>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleExport}
                className="d-flex align-items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleClearAlerts}
                className="d-flex align-items-center gap-1"
              >
                <AlertTriangle className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="row g-4">
          {/* Monitoring Status Overview */}
          <div className="col-lg-8">
            <div className="card bg-dark text-white mb-4 p-3 rounded">
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <Activity className="w-5 h-5" />
                Real-time Monitoring Status
              </h5>
              
              <div className="row g-3 text-center">
                <div className="col-md-4">
                  <div className="text-center p-3 rounded bg-success">
                    <Camera className="w-4 h-4" />
                    <div className="mt-2">Camera</div>
                    <div className="text-white small">Face Detection</div>
                  </div>
                  <div className="text-center p-2 rounded bg-light text-dark">
                    <Eye className="w-6 h-6" />
                    <div className="mt-2">Face Status</div>
                    <div className="text-dark small">{
                      monitoringState.faceDetected ? 'Detected' : 'Not Detected'
                    }</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 rounded bg-primary">
                    <Monitor className="w-4 h-4" />
                    <div className="mt-2">Posture</div>
                    <div className="text-white small">{
                      monitoringState.postureStatus
                    }</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 rounded bg-info">
                    <Activity className="w-4 h-4" />
                    <div className="mt-2">Attention</div>
                    <div className="text-white small">{
                      monitoringState.attentionStatus
                    }</div>
                  </div>
                </div>
              </div>
              
              <div className="row g-2 mt-4 text-center">
                <div className="col-6">
                  <h6 className="text-white">Status</h6>
                  <div className={`text-center p-2 rounded ${
                    monitoringState.isMonitoring ? 'bg-success' : 'bg-secondary'
                  } text-white`}>
                    <div className={`mb-2 ${
                      monitoringState.cameraActive ? 'text-success' : 'text-muted'
                    }`}>
                      Monitoring
                    </div>
                    <div className={`text-${
                      monitoringState.isMonitoring ? 'success' : 'muted'
                    }`}>
                      {
                        monitoringState.isMonitoring ? 'Active' : 'Inactive'
                      }
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <h6 className="text-white">Last Update</h6>
                  <div className="text-center p-2 rounded bg-light text-dark">
                    {new Date(monitoringState.lastUpdate).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Course Progress Overview */}
          <div className="col-lg-4">
            <div className="card bg-dark text-white mb-4 p-3 rounded">
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <Users className="w-5 h-5" />
                Course Progress Overview
              </h5>
              
              <div className="table-responsive">
                <table className="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Progress</th>
                      <th>Completed</th>
                      <th>Watch Time</th>
                      <th>Last Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseProgress.map((course, index) => (
                      <tr key={course.courseId}>
                        <td className="text-white">{course.courseName}</td>
                        <td>
                          <div className="progress" style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: course.progressPercentage > 0 ? '#28a745' : '#374151'
                          }}>
                          <div style={{ 
                            width: `${course.progressPercentage}%`,
                            height: '100%',
                            backgroundColor: '#28a745'
                          }} />
                        </div>
                        </td>
                        <td>{course.completedVideos}/{course.totalVideos}</td>
                        <td>{Math.round(course.totalWatchTime / 60)}m</td>
                        <td>{course.lastAccessTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Alerts Section */}
          <div className="col-lg-12">
            <div className="card bg-dark text-white mb-4 p-3 rounded">
              <h5 className="mb-3 d-flex align-items-center justify-content-between">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Recent Alerts
                
                <Badge bg="warning" className="ms-2">
                  {filteredAlerts.length}
                </Badge>
                
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={handleClearAlerts}
                  className="d-flex align-items-center gap-1"
                >
                  Clear
                </Button>
              </h5>
              
              <div className="table-responsive" style={{ maxHeight: '300px' }}>
                <table className="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Alert</th>
                      <th>Severity</th>
                      <th>Course</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.slice(0, 20).map((alert, index) => (
                      <tr key={alert.id}>
                        <td className="text-muted small">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="d-flex align-items-center gap-2">
                          {getTypeIcon(alert.type)}
                          <span className="ms-2">{alert.type.replace('_', ' ')}</span>
                        </td>
                        <td>
                          <span className={`badge bg-${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="text-white small">
                          <div className="text-truncate" style={{ maxWidth: '200px' }}>
                            {alert.message}
                          </div>
                        </td>
                        <td className="text-white small">
                          {alert.courseId || 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="row g-4">
          <div className="col-12">
            <div className="card bg-dark text-white p-3 rounded">
              <h5 className="mb-3">Filters</h5>
              
              <div className="d-flex gap-2 mb-3">
                <div>
                  <label className="text-white small me-2">Alert Type:</label>
                  <select 
                    className="form-select form-select-sm bg-dark text-light border-secondary"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="posture">Posture</option>
                    <option value="attention">Attention</option>
                    <option value="face">Face Detection</option>
                    <option value="tab_switch">Tab Switch</option>
                    <option value="auto_pause">Auto Pause</option>
                    <option value="completion">Completion</option>
                    <option value="invalid">Invalid</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-white small me-2">Severity:</label>
                  <select 
                    className="form-select form-select-sm bg-dark text-light border-secondary"
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-white small me-2">Time Range:</label>
                  <select 
                    className="form-select form-select-sm bg-dark text-light border-secondary"
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                  >
                    <option value="1h">Last 1 Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12">
            <div className="card bg-dark text-white p-3 rounded">
              <h5 className="mb-3">Export Controls</h5>
              
              <div className="d-flex justify-content-end gap-2">
                <Button 
                  variant="primary" 
                  onClick={handleExport}
                  className="d-flex align-items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}