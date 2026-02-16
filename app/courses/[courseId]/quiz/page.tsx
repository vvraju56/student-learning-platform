"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore"
import { courses } from "@/lib/courses-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Award, 
  Monitor,
  Camera,
  Eye,
  Shield,
  Timer,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Check,
  X
} from "lucide-react"

interface QuizPageProps {
  params: Promise<{
    courseId: string
  }>
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QUIZ PAGE - DARK EXAM THEME
 * 
 * Theme: "Focused Dark Exam Environment"
 * - Reduce distractions
 * - Increase seriousness
 * - Match AI monitoring system
 * - Clearly indicate locked/active states
 * 
 * Color Palette:
 * - Background: #0b0f14 (deep black-blue)
 * - Card: #111827
 * - Primary: #3b82f6 (blue)
 * - Success: #22c55e (green)
 * - Warning: #f59e0b (amber)
 * - Danger: #ef4444 (red)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter()
  
  // ─────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  const [courseId, setCourseId] = useState<string>("")
  const [course, setCourse] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Timer (10 minutes = 600 seconds)
  const [timeLeft, setTimeLeft] = useState(600)
  
  // Monitoring state
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [tabActive, setTabActive] = useState(true)
  const [violations, setViolations] = useState({ tabSwitch: 0, faceLost: 0 })
  const [monitoringStarted, setMonitoringStarted] = useState(false)
  const [showViolationAlert, setShowViolationAlert] = useState(false)
  
  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        const resolvedParams = await params
        const { courseId: id } = resolvedParams
        setCourseId(id)
        
        const selectedCourse = courses.find((c) => c.id === id)
        if (!selectedCourse) {
          router.push("/courses")
          return
        }
        
        setCourse(selectedCourse)
        await checkQuizCompletion(selectedCourse)
        setLoading(false)
      } catch (error) {
        console.error('Error initializing quiz:', error)
        setLoading(false)
      }
    }
    
    initializeQuiz()
  }, [params, router])

  // ─────────────────────────────────────────────────────────────────────────
  // TIMER SYSTEM
  // ═══════════════════════════════════════════════════════════════════════
  // Timer only counts when: cameraActive && faceDetected && tabActive
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const canCountTime = cameraActive && faceDetected && tabActive && !showResults && !quizCompleted
    
    if (!canCountTime || timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [cameraActive, faceDetected, tabActive, showResults, quizCompleted, timeLeft])

  // ─────────────────────────────────────────────────────────────────────────
  // ANTI-CHEAT MONITORING
  // ═══════════════════════════════════════════════════════════════════════
  // - Tab switch detection
  // - Face detection (simulated)
  // - Auto-submit on violations
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!monitoringStarted || showResults || quizCompleted) return
    
    // Tab visibility detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabActive(false)
        const newCount = violations.tabSwitch + 1
        setViolations(prev => ({ ...prev, tabSwitch: newCount }))
        setShowViolationAlert(true)
        setTimeout(() => setShowViolationAlert(false), 3000)
        
        // Auto-submit after 3 tab switches
        if (newCount >= 3) {
          alert('Quiz auto-submitted due to excessive tab switching')
          handleSubmitQuiz()
        }
      } else {
        setTabActive(true)
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [monitoringStarted, showResults, quizCompleted, violations.tabSwitch])

  // Simulated face detection
  useEffect(() => {
    if (!monitoringStarted || showResults || quizCompleted) return
    
    const faceCheck = setInterval(() => {
      setFaceDetected(cameraActive)
    }, 1000)
    
    return () => clearInterval(faceCheck)
  }, [monitoringStarted, showResults, quizCompleted, cameraActive])

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const checkQuizCompletion = async (selectedCourse: any) => {
    if (!auth.currentUser) return
    
    try {
      const quizQuery = query(
        collection(db, "quiz_results"),
        where("user_id", "==", auth.currentUser.uid),
        where("course_id", "==", selectedCourse.id)
      )
      const quizSnapshot = await getDocs(quizQuery)
      
      if (!quizSnapshot.empty) {
        const quizData = quizSnapshot.docs[0].data()
        setQuizCompleted(true)
        setScore(quizData.score || 0)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error checking quiz completion:', error)
    }
  }

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      
      setCameraActive(true)
      setMonitoringStarted(true)
      
      return true
    } catch (error) {
      console.error('Camera access denied:', error)
      alert('Camera permission is required to start the quiz')
      return false
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }))
  }

  const handleNextQuestion = () => {
    if (course?.modules?.[0]?.quiz?.mcqQuestions) {
      const totalQuestions = course.modules[0].quiz.mcqQuestions.length
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        handleSubmitQuiz()
      }
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!cameraActive) {
      alert('Camera must be active to submit quiz')
      return
    }
    
    if (violations.tabSwitch > 5) {
      alert('Quiz blocked: Too many tab switches detected')
      return
    }
    
    setSubmitting(true)
    
    const questions = course?.modules?.[0]?.quiz?.mcqQuestions || []
    let correctAnswers = 0
    
    questions.forEach((question: any, index: number) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++
      }
    })
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100)
    setScore(finalScore)
    setShowResults(true)
    setQuizCompleted(true)
    setCameraActive(false)
    
    await saveQuizResults(finalScore, correctAnswers, questions.length)
    
    setSubmitting(false)
  }

  const saveQuizResults = async (finalScore: number, correctAnswers: number, totalQuestions: number) => {
    if (!auth.currentUser || !courseId) return
    
    try {
      const quizRef = doc(db, "quiz_results", `${auth.currentUser.uid}_${courseId}`)
      await setDoc(quizRef, {
        user_id: auth.currentUser.uid,
        course_id: courseId,
        score: finalScore,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        answers: selectedAnswers,
        completed_at: new Date().toISOString(),
        violations: violations,
        passed: finalScore >= 60
      })
    } catch (error) {
      console.error('Error saving quiz results:', error)
    }
  }

  const retakeQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setShowResults(false)
    setScore(0)
    setQuizCompleted(false)
    setTimeLeft(600)
    setViolations({ tabSwitch: 0, faceLost: 0 })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getMonitoringStatus = () => {
    if (!monitoringStarted) return { color: 'text-gray-500', bg: 'bg-gray-800', text: 'Not Started', icon: Lock }
    if (!cameraActive) return { color: 'text-red-400', bg: 'bg-red-900/30', text: 'Camera Off', icon: Camera }
    if (!faceDetected) return { color: 'text-yellow-400', bg: 'bg-yellow-900/30', text: 'No Face', icon: Eye }
    if (!tabActive) return { color: 'text-red-400', bg: 'bg-red-900/30', text: 'Tab Hidden', icon: AlertTriangle }
    return { color: 'text-green-400', bg: 'bg-green-900/30', text: 'All Good', icon: Shield }
  }

  const monitoringStatus = getMonitoringStatus()
  const StatusIcon = monitoringStatus.icon

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COURSE NOT FOUND
  // ─────────────────────────────────────────────────────────────────────────
  
  if (!course) {
    return (
      <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">Course not found</p>
          <Button onClick={() => router.push("/courses")} className="mt-4 bg-blue-600">
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUIZ NOT AVAILABLE
  // ─────────────────────────────────────────────────────────────────────────
  
  if (!course.modules?.[0]?.quiz?.mcqQuestions) {
    return (
      <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Quiz Not Available</h2>
          <p className="text-gray-400">This course does not have a quiz yet.</p>
          <Button onClick={() => router.push(`/courses/${courseId}`)} className="mt-4 bg-blue-600">
            Back to Course
          </Button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESULTS VIEW
  // ─────────────────────────────────────────────────────────────────────────
  
  if (showResults && quizCompleted) {
    const questions = course.modules[0].quiz.mcqQuestions
    const passed = score >= 60
    
    return (
      <div className="min-h-screen bg-[#0b0f14]">
        <header className="bg-[#0f172a] border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => router.push(`/courses/${courseId}`)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
              <h1 className="text-xl font-semibold text-white">{course.title} - Results</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <Card className="bg-[#111827] border-gray-800">
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                passed ? 'bg-green-900/30' : 'bg-red-900/30'
              }`}>
                {passed ? (
                  <Award className="h-10 w-10 text-green-400" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-red-400" />
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {passed ? 'Congratulations!' : 'Keep Learning!'}
              </h2>
              
              <div className="mb-6">
                <div className="text-5xl font-bold text-white mb-2">{score}%</div>
                <p className="text-gray-400">
                  You got {Math.round((score / 100) * questions.length)} out of {questions.length} questions correct
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={retakeQuiz} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
                <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
                  <Monitor className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUIZ IN PROGRESS
  // ─────────────────────────────────────────────────────────────────────────
  
  const questions = course.modules[0].quiz.mcqQuestions
  const currentQuestionData = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-[#0b0f14]" style={{ userSelect: 'none' }}>
      {/* ═══════════════════════════════════════════════════════════════════
        VIOLATION ALERT (Floating)
      ═══════════════════════════════════════════════════════════════════ */}
      {showViolationAlert && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 text-white px-6 py-3 rounded-lg animate-pulse border border-red-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Tab Switch Detected! ({violations.tabSwitch}/3)</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
        HEADER - Dark glass bar
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back + Course */}
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/courses/${courseId}`)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-white">{course.title}</h1>
                <p className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</p>
              </div>
            </div>

            {/* Center: Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              timeLeft < 60 
                ? 'bg-red-950 border-red-500 text-red-400 animate-pulse' 
                : timeLeft < 180 
                ? 'bg-yellow-950 border-yellow-500 text-yellow-400'
                : 'bg-[#020617] border-gray-700 text-blue-400'
            }`}>
              <Timer className="h-5 w-5" />
              <span className="text-2xl font-bold font-mono">{formatTime(timeLeft)}</span>
            </div>

            {/* Right: Status + Submit */}
            <div className="flex items-center gap-3">
              {/* Monitoring Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${monitoringStatus.bg}`}>
                <StatusIcon className={`h-4 w-4 ${monitoringStatus.color}`} />
                <span className={`text-sm font-medium ${monitoringStatus.color}`}>{monitoringStatus.text}</span>
              </div>

              {/* Submit */}
              <Button 
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
        MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-1">
            <Card className="bg-[#0f172a] border-gray-800 sticky top-28">
              <CardHeader className="pb-3 border-b border-gray-800">
                <CardTitle className="text-white text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Start Monitoring */}
                {!monitoringStarted && (
                  <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <p className="text-sm text-yellow-400 mb-2">
                      Camera monitoring required
                    </p>
                    <Button 
                      onClick={startMonitoring}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                      size="sm"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start Monitoring
                    </Button>
                  </div>
                )}

                {/* Monitoring Stats */}
                {monitoringStarted && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className={`p-2 rounded-lg ${cameraActive ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
                      <Camera className={`h-4 w-4 ${cameraActive ? 'text-green-400' : 'text-red-400'} mb-1`} />
                      <p className={`text-xs ${cameraActive ? 'text-green-400' : 'text-red-400'}`}>Camera</p>
                    </div>
                    <div className={`p-2 rounded-lg ${faceDetected ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
                      <Eye className={`h-4 w-4 ${faceDetected ? 'text-green-400' : 'text-red-400'} mb-1`} />
                      <p className={`text-xs ${faceDetected ? 'text-green-400' : 'text-red-400'}`}>Face</p>
                    </div>
                    <div className={`p-2 rounded-lg ${tabActive ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
                      <Monitor className={`h-4 w-4 ${tabActive ? 'text-green-400' : 'text-red-400'} mb-1`} />
                      <p className={`text-xs ${tabActive ? 'text-green-400' : 'text-red-400'}`}>Tab</p>
                    </div>
                    <div className={`p-2 rounded-lg ${violations.tabSwitch === 0 ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
                      <AlertTriangle className={`h-4 w-4 ${violations.tabSwitch === 0 ? 'text-green-400' : 'text-red-400'} mb-1`} />
                      <p className={`text-xs ${violations.tabSwitch === 0 ? 'text-green-400' : 'text-red-400'}`}>Violations</p>
                    </div>
                  </div>
                )}

                {/* Question Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        currentQuestion === index
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : selectedAnswers[index] !== undefined
                          ? 'bg-green-900/30 text-green-400 border border-green-800'
                          : 'bg-[#0b0f14] text-gray-500 border border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Answered:</span>
                    <span className="text-white font-medium">{Object.keys(selectedAnswers).length}/{questions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Violations:</span>
                    <span className={`font-medium ${violations.tabSwitch > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {violations.tabSwitch}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QUESTION AREA */}
          <div className="lg:col-span-3">
            <Card className="bg-[#111827] border-gray-800 rounded-2xl">
              <CardContent className="p-8">
                {/* Question */}
                <div className="mb-6">
                  <Badge variant="outline" className="mb-2 border-gray-700 text-gray-400">
                    Question {currentQuestion + 1}
                  </Badge>
                  <h2 className="text-xl font-medium text-white">
                    {currentQuestionData?.question}
                  </h2>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-8">
                  {currentQuestionData?.options?.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        selectedAnswers[currentQuestion] === index
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-800 bg-[#0f172a] hover:border-gray-700 hover:bg-[#0f172a]/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswers[currentQuestion] === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-600'
                        }`}>
                          {selectedAnswers[currentQuestion] === index && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="text-gray-200">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestion === 0}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestion] === undefined}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {currentQuestion === questions.length - 1 ? (
                      <>
                        Submit
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
