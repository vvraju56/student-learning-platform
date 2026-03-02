"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import Badge from "react-bootstrap/Badge"
import ProgressBar from "react-bootstrap/ProgressBar"
import { 
  Play, Clock, CheckCircle, ArrowLeft, PlayCircle, Monitor, 
  Smartphone, BookOpen, Eye, EyeOff, PauseCircle, AlertTriangle
} from "lucide-react"
import { useProgressCalculator } from "../hooks/use-progress-calculator"

interface VideoPageProps {
  user: any
  courseId: string
}

interface Video {
  id: string
  title: string
  duration: string
  description: string
  progress: number
  completed: boolean
  thumbnail: string
}

export function VideoPage({ user, courseId }: VideoPageProps) {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const { getContinueLearningData, saveContinueLearningData } = useProgressCalculator(user.uid)

  // Course information
  const courseData: Record<string, any> = {
    'web-development': {
      name: 'Web Development',
      icon: <Monitor className="w-6 h-6" />,
      color: '#10b981',
      description: 'Master modern web development technologies'
    },
    'app-development': {
      name: 'App Development',
      icon: <Smartphone className="w-6 h-6" />,
      color: '#3b82f6',
      description: 'Build powerful mobile applications'
    },
    'game-development': {
      name: 'Game Development',
      icon: <PlayCircle className="w-6 h-6" />,
      color: '#f59e0b',
      description: 'Create engaging interactive games'
    }
  }

  // Mock video data
  useEffect(() => {
    const mockVideos: Video[] = Array.from({ length: 10 }, (_, index) => ({
      id: `video-${index + 1}`,
      title: `Lesson ${index + 1}: ${getVideoTitle(courseId, index)}`,
      duration: `${15 + Math.floor(Math.random() * 30)} min`,
      description: `Learn ${getVideoDescription(courseId, index)} in this comprehensive lesson.`,
      progress: Math.random() * 100,
      completed: Math.random() > 0.7,
      thumbnail: `/api/placeholder/320/180?text=Video+${index + 1}`
    }))

    setVideos(mockVideos)
    setCourseInfo(courseData[courseId] || courseData['web-development'])
  }, [courseId])

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video)
    // Save continue learning data
    saveContinueLearningData(courseId, video.id, 0)
    // Navigate to video player
    router.push(`/course/${courseId}/video/${video.id}`)
  }

  const handleBackToCourses = () => {
    router.push('/course/select')
  }

  const getStatusBadge = (video: Video) => {
    if (video.completed) {
      return <Badge bg="success" className="d-flex align-items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Completed
      </Badge>
    } else if (video.progress > 0) {
      return <Badge bg="warning" className="d-flex align-items-center gap-1">
        <Clock className="w-3 h-3" />
        In Progress
      </Badge>
    } else {
      return <Badge bg="secondary">Not Started</Badge>
    }
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
                  onClick={handleBackToCourses}
                  className="d-flex align-items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Courses
                </Button>
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{ 
                      backgroundColor: courseInfo?.color + '20', 
                      color: courseInfo?.color,
                      width: '40px',
                      height: '40px'
                    }}
                  >
                    {courseInfo?.icon}
                  </div>
                  <div>
                    <h1 className="h3 mb-0 text-white fw-bold">{courseInfo?.name}</h1>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.875rem' }}>
                      {courseInfo?.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-auto">
              <div className="text-end">
                <div className="text-white small fw-medium">{user?.email}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {videos.filter(v => v.completed).length} / {videos.length} completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video List */}
      <main className="container-fluid py-4">
        <div className="row g-4">
          {videos.map((video) => (
            <div key={video.id} className="col-lg-6 col-xl-4">
              <Card 
                className="border-0 shadow-lg video-card h-100"
                style={{ 
                  backgroundColor: '#1a1a1a', 
                  borderRadius: '12px',
                  border: '1px solid #2a2a2a',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onClick={() => handleVideoSelect(video)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'
                }}
              >
                {/* Video Thumbnail */}
                <div className="position-relative" style={{ height: '180px', backgroundColor: '#2a2a2a' }}>
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    <PlayCircle className="w-16 h-16 text-white-50" />
                  </div>
                  
                  {/* Duration Badge */}
                  <Badge 
                    bg="dark" 
                    className="position-absolute bottom-2 end-2 d-flex align-items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    {video.duration}
                  </Badge>

                  {/* Progress Overlay */}
                  {video.progress > 0 && (
                    <div className="position-absolute bottom-0 start-0 w-100">
                      <ProgressBar 
                        now={video.progress} 
                        style={{ height: '4px' }}
                        variant={video.completed ? 'success' : 'warning'}
                      />
                    </div>
                  )}
                </div>

                <Card.Body className="p-3">
                  {/* Video Title and Status */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="text-white fw-semibold mb-0" style={{ 
                      fontSize: '0.95rem',
                      lineHeight: '1.4'
                    }}>
                      {video.title}
                    </h6>
                    {getStatusBadge(video)}
                  </div>

                  {/* Video Description */}
                  <p className="text-muted small mb-3" style={{ 
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {video.description}
                  </p>

                  {/* Play Button */}
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ 
                      backgroundColor: courseInfo?.color,
                      borderColor: courseInfo?.color,
                      borderRadius: '6px'
                    }}
                  >
                    <Play className="w-4 h-4" />
                    {video.completed ? 'Review' : video.progress > 0 ? 'Continue' : 'Start'} Lesson
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>

        {/* Course Progress Summary */}
        <div className="row mt-5">
          <div className="col-lg-8 mx-auto">
            <Card className="border-0" style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px',
              border: '1px solid #2a2a2a'
            }}>
              <Card.Body className="p-4">
                <h5 className="text-white mb-3 d-flex align-items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Progress
                </h5>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white">Overall Progress</span>
                    <span className="text-white fw-bold">
                      {Math.round(videos.filter(v => v.completed).length / videos.length * 100)}%
                    </span>
                  </div>
                  <ProgressBar 
                    now={videos.filter(v => v.completed).length / videos.length * 100} 
                    style={{ height: '8px', backgroundColor: '#2a2a2a' }}
                    variant="success"
                  />
                </div>
                <div className="row g-3">
                  <div className="col-4">
                    <div className="text-center p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                      <div className="text-success fw-bold">{videos.filter(v => v.completed).length}</div>
                      <div className="small text-muted">Completed</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                      <div className="text-warning fw-bold">{videos.filter(v => v.progress > 0 && !v.completed).length}</div>
                      <div className="small text-muted">In Progress</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                      <div className="text-muted fw-bold">{videos.filter(v => v.progress === 0).length}</div>
                      <div className="small text-muted">Not Started</div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </main>

      <style jsx>{`
        .video-card:hover {
          transform: translateY(-4px);
        }
      `}</style>
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

function getVideoDescription(courseId: string, index: number): string {
  const descriptions: Record<string, string[]> = {
    'web-development': [
      'HTML structure and CSS styling fundamentals',
      'JavaScript programming basics and DOM manipulation',
      'React components and modern development patterns',
      'Managing application state effectively',
      'Single-page application navigation',
      'Working with REST APIs and data fetching',
      'User authentication and authorization',
      'Modern deployment strategies and CI/CD',
      'Optimizing web applications for performance',
      'Advanced architectural patterns and best practices'
    ],
    'app-development': [
      'Setting up React Native development environment',
      'Creating reusable components and styling',
      'Navigation patterns for mobile apps',
      'Managing state in mobile applications',
      'Accessing native device functionality',
      'Implementing push notification systems',
      'App store submission and distribution',
      'Mobile app performance optimization',
      'Testing strategies for mobile applications',
      'Advanced mobile development techniques'
    ],
    'game-development': [
      'Unity engine basics and interface',
      'Working with game objects and transforms',
      'Implementing realistic physics simulations',
      'C# scripting for game logic',
      'Principles of engaging game design',
      'Creating smooth game animations',
      'Audio systems and sound integration',
      'User interface design for games',
      'Performance optimization techniques',
      'Game publishing and distribution platforms'
    ]
  }
  return descriptions[courseId]?.[index] || 'essential concepts and techniques'
}