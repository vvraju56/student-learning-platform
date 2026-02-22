"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import * as tf from "@tensorflow/tfjs"
import * as blazeface from "@tensorflow-models/blazeface"

type QuizState = "ready" | "mcq" | "coding" | "submitted"

const webDevQuizQuestions = [
  { id: 1, type: "mcq", question: "What does HTML stand for?", options: ["Hyper Tool Markup Language", "Home Tool Markup Language", "Hyper Text Markup Language", "Hyperlinks Text Language"], correctAnswer: 2, marks: 1 },
  { id: 2, type: "mcq", question: "Which HTML tag is used to create a hyperlink?", options: ["<link>", "<href>", "<a>", "<url>"], correctAnswer: 2, marks: 1 },
  { id: 3, type: "mcq", question: "Which tag is used for the largest heading in HTML?", options: ["<h6>", "<heading>", "<h1>", "<head>"], correctAnswer: 2, marks: 1 },
  { id: 4, type: "mcq", question: "What does CSS stand for?", options: ["Creative Style Sheets", "Computer Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"], correctAnswer: 2, marks: 1 },
  { id: 5, type: "mcq", question: "Which CSS property is used to change text color?", options: ["text-color", "font-color", "color", "foreground"], correctAnswer: 2, marks: 1 },
  { id: 6, type: "mcq", question: "Which HTML tag is used to insert an image?", options: ["<image>", "<img>", "<src>", "<pic>"], correctAnswer: 1, marks: 1 },
  { id: 7, type: "mcq", question: "Which CSS property controls the background color?", options: ["bgcolor", "background", "background-color", "color"], correctAnswer: 2, marks: 1 },
  { id: 8, type: "mcq", question: "Which HTML element is used to create an unordered list?", options: ["<ol>", "<list>", "<li>", "<ul>"], correctAnswer: 3, marks: 1 },
  { id: 9, type: "mcq", question: "Which symbol is used for comments in CSS?", options: ["// comment", "<!-- comment -->", "/* comment */", "# comment"], correctAnswer: 2, marks: 1 },
  { id: 10, type: "mcq", question: "Which attribute uniquely identifies an HTML element?", options: ["class", "name", "id", "style"], correctAnswer: 2, marks: 1 },
]

const codingQuestions = [
  { id: 1, type: "coding", title: "Create a Basic HTML Web Page", description: "Write HTML code to create a webpage with heading, paragraph, list and link", marks: 5 },
  { id: 2, type: "coding", title: "Style a Web Page Using CSS", description: "Write CSS to style heading (blue, center), button (green bg, white text)", marks: 5 }
]

const styles: any = {
  page: { minHeight: "100vh", background: "#0b0f14", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" },
  card: { background: "#111827", padding: 32, borderRadius: 16, maxWidth: 500, width: "100%", margin: "0 auto" },
  video: { width: "100%", aspectRatio: "4/3", borderRadius: 12, objectFit: "cover", marginBottom: 15 },
  btn: { width: "100%", padding: 14, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 10, cursor: "pointer", fontWeight: 600, marginTop: 10 },
  header: { position: "sticky", top: 0, background: "rgba(15,23,42,0.95)", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2937" },
  layout: { display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "calc(100vh - 70px)" },
  sidebar: { background: "#0f172a", padding: 25, borderRight: "1px solid #1f2937" },
  main: { padding: 30, maxWidth: 900, margin: "0 auto" },
  questionBox: { background: "#111827", border: "1px solid #1f2937", borderRadius: 20, padding: 30, marginBottom: 25 },
  focused: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid #22c55e" },
  warning: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid #ef4444" },
}

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>("ready")
  const [faceDetected, setFaceDetected] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [tfModelLoaded, setTfModelLoaded] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [blockUI, setBlockUI] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600)
  const [noFaceCountdown, setNoFaceCountdown] = useState<number | null>(null)
  const [tabSwitchDetected, setTabSwitchDetected] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [codingAnswers, setCodingAnswers] = useState<Record<number, string>>({})
  const [canStartQuiz, setCanStartQuiz] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const noFaceSinceRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const tfModelRef = useRef<blazeface.BlazeFaceModel | null>(null)
  const consecutiveNoFaceRef = useRef(0)

  useEffect(() => {
    const load = async () => {
      try {
        await tf.setBackend('webgl')
        await tf.ready()
        const model = await blazeface.load()
        tfModelRef.current = model
        setTfModelLoaded(true)
      } catch (e) {
        console.error("Failed to load TensorFlow model:", e)
      }
    }
    load()
  }, [])

  const startCamera = async () => {
    if (!tfModelLoaded || !tfModelRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream

      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      
      videoRef.current.onloadedmetadata = async () => {
        try {
          await videoRef.current?.play()
          setVideoReady(true)
          setCameraActive(true)
          startTensorFlowDetection()
        } catch (e) {
          console.log("Video play interrupted")
        }
      }
    } catch (err) {
      console.error("Camera error:", err)
      alert("Camera not accessible. Please allow camera access to take the quiz.")
    }
  }

  const startTensorFlowDetection = () => {
    console.log("startTensorFlowDetection called")
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)

    const detectFace = async () => {
      console.log("detectFace CALLED")
      console.log("  videoRef.current:", !!videoRef.current)
      console.log("  tfModelRef.current:", !!tfModelRef.current)
      console.log("  videoWidth:", videoRef.current?.videoWidth)
      console.log("  readyState:", videoRef.current?.readyState)
      
      if (!videoRef.current || !tfModelRef.current || !videoRef.current.videoWidth) {
        console.log("  -> early return: video or model not ready")
        return
      }

      console.log("  About to call estimateFaces")
      try {
        const predictions = await tfModelRef.current.estimateFaces(videoRef.current, false)
        console.log("Predictions:", predictions.length, predictions)
        const detected = predictions.length > 0
        setFaceDetected(detected)
        setCanStartQuiz(detected)

        if (detected) {
          noFaceSinceRef.current = null
          consecutiveNoFaceRef.current = 0
          setBlockUI(false)
          setNoFaceCountdown(null)
          if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
          }
        } else {
          consecutiveNoFaceRef.current += 1
          if (!noFaceSinceRef.current) {
            noFaceSinceRef.current = Date.now()
          }
          const diff = Date.now() - noFaceSinceRef.current
          if (diff >= 5000 || consecutiveNoFaceRef.current >= 6) {
            setBlockUI(true)
            setCanStartQuiz(false)
          }
        }
      } catch (e) {
        console.error("Face detection error:", e)
      }
    }

    console.log("Setting interval, tfModelRef.current:", tfModelRef.current)
    detectFace() // run immediately
    detectIntervalRef.current = setInterval(detectFace, 800)
  }

  useEffect(() => {
    const shouldDetect = (quizState === "ready" || quizState === "mcq" || quizState === "coding") && cameraActive && videoReady
    if (shouldDetect) {
      startTensorFlowDetection()
    }
    return () => {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current)
        detectIntervalRef.current = null
      }
    }
  }, [quizState, cameraActive, videoReady])

  useEffect(() => {
    const video = videoRef.current
    if (video && streamRef.current && !video.srcObject) {
      console.log("Restoring video stream...")
      video.srcObject = streamRef.current
      video.play().catch(() => {})
    }
  }, [quizState])

  useEffect(() => {
    if (quizState !== "mcq") return
    if (blockUI) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleFinishMCQ()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [quizState, blockUI])

  useEffect(() => {
    const isInQuiz = quizState === "mcq" || quizState === "coding"
    
    if (!isInQuiz) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      setNoFaceCountdown(null)
      return
    }
    
    if (faceDetected) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      setNoFaceCountdown(null)
      return
    }
    
    if (!faceDetected && !countdownRef.current) {
      setNoFaceCountdown(5)
      let count = 5
      countdownRef.current = setInterval(() => {
        count -= 1
        setNoFaceCountdown(count)
        if (count <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
          }
            setQuizState("ready")
            setBlockUI(false)
            setNoFaceCountdown(null)
            setCurrentQuestion(0)
        }
      }, 1000)
    }
  }, [quizState, faceDetected])

  useEffect(() => {
    const isInQuiz = quizState === "mcq" || quizState === "coding"
    if (!isInQuiz) return
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchDetected(true)
        if (countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
        setNoFaceCountdown(null)
        setQuizState("ready")
        setBlockUI(false)
        setNoFaceCountdown(null)
        setCurrentQuestion(0)
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [quizState])

  useEffect(() => {
    if (quizState !== "coding") return
    
    const preventDefault = (e: Event) => e.preventDefault()
    const preventKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'c' || e.key === 'x')) {
        e.preventDefault()
      }
    }
    
    document.addEventListener("copy", preventDefault)
    document.addEventListener("paste", preventDefault)
    document.addEventListener("cut", preventDefault)
    document.addEventListener("contextmenu", preventDefault)
    document.addEventListener("keydown", preventKeyDown)
    
    return () => {
      document.removeEventListener("copy", preventDefault)
      document.removeEventListener("paste", preventDefault)
      document.removeEventListener("cut", preventDefault)
      document.removeEventListener("contextmenu", preventDefault)
      document.removeEventListener("keydown", preventKeyDown)
    }
  }, [quizState])

  useEffect(() => {
    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleStartMCQ = () => {
    if (!canStartQuiz) return
    setQuizState("mcq")
    setCurrentQuestion(0)
  }

  const handleFinishMCQ = () => {
    setCurrentQuestion(0)
    setQuizState("ready")
    setTimeout(() => setQuizState("coding"), 100)
  }

  const handleSubmit = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
    setQuizState("submitted")
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  if (quizState === "submitted") {
    const correct = webDevQuizQuestions.reduce((c, q, i) => c + (answers[i] === q.correctAnswer ? 1 : 0), 0)
    const totalMarks = webDevQuizQuestions.reduce((s, q) => s + q.marks, 0) + codingQuestions.reduce((s, q) => s + q.marks, 0)
    const codingMarks = Object.keys(codingAnswers).length * 5
    const totalScore = correct + codingMarks
    const percentage = Math.round((totalScore / totalMarks) * 100)
    
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={styles.card}>
          <h2 style={{ fontSize: 32, color: percentage >= 60 ? "#22c55e" : "#ef4444", marginBottom: 20 }}>
            {percentage >= 60 ? "PASSED" : "NEEDS REVIEW"}
          </h2>
          <p style={{ fontSize: 48, fontWeight: "bold" }}>{totalScore}/{totalMarks}</p>
          <p style={{ color: "#94a3b8", marginTop: 10 }}>MCQ: {correct}/{webDevQuizQuestions.length} | Coding: {Object.keys(codingAnswers).length}/{codingQuestions.length}</p>
          <Link href="/dashboard">
            <button style={{ ...styles.btn, marginTop: 20 }}>Back to Dashboard</button>
          </Link>
        </div>
      </div>
    )
  }

  if (quizState === "ready") {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={styles.card}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Web Development Quiz</h2>
          <p style={{ color: "#94a3b8", marginBottom: 20 }}>Test your HTML & CSS knowledge</p>
          
          {tabSwitchDetected && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, padding: 15, marginBottom: 20, color: "#ef4444" }}>
              ⚠️ Tab switch detected! Quiz was terminated.
            </div>
          )}
          
          <video ref={videoRef} autoPlay muted playsInline style={{ ...styles.video, display: videoReady ? "block" : "none" }} />
          
          <p style={{ margin: "10px 0", color: faceDetected ? "#22c55e" : "#f59e0b" }}>
            {faceDetected ? "✓ Face detected" : "⏳ Waiting for face detection..."}
          </p>
          
          {tfModelLoaded ? (
            <p style={{ color: "#22c55e", fontSize: 12 }}>✓ TensorFlow Ready</p>
          ) : (
            <p style={{ color: "#f59e0b", fontSize: 12 }}>⏳ Loading TensorFlow...</p>
          )}

          <p style={{ color: "#94a3b8", marginTop: 15 }}>Section A: 10 MCQs (10 marks) | Section B: 2 Coding (10 marks)</p>
          
          {!cameraActive ? (
            <button onClick={() => { startCamera(); setTabSwitchDetected(false); }} disabled={!tfModelLoaded} style={styles.btn}>
              {!tfModelLoaded ? "Loading AI..." : "📷 Enable Camera"}
            </button>
          ) : (
            <button onClick={() => { handleStartMCQ(); setTabSwitchDetected(false); }} disabled={!canStartQuiz} style={{ ...styles.btn, opacity: canStartQuiz ? 1 : 0.5 }}>
              {canStartQuiz ? "✅ Start Quiz" : "⏳ Show your face to start..."}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (quizState === "mcq") {
    if (!cameraActive) {
      return (
        <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={styles.card}>
            <h2 style={{ fontSize: 24, color: "#ef4444", marginBottom: 15 }}>
              ⚠️ Camera Not Active!
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: 20 }}>
              Camera is required to continue the quiz.
            </p>
            <button onClick={() => { setQuizState("ready"); setBlockUI(false); setNoFaceCountdown(null); setCurrentQuestion(0); }} style={styles.btn}>
              ← Return to Setup
            </button>
          </div>
        </div>
      )
    }

    const q = webDevQuizQuestions[currentQuestion]

    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <button onClick={() => { setQuizState("ready"); setBlockUI(false); setNoFaceCountdown(null); setCurrentQuestion(0); }} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: "10px 18px", borderRadius: 10, cursor: "pointer" }}>← Back</button>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Section A: MCQs</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%" }}></span>
              Tab monitoring active
            </div>
            {!faceDetected && noFaceCountdown !== null && (
              <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: 20, color: "#ef4444", fontWeight: 600 }}>
                ⚠️ Face missing! Returning in {noFaceCountdown}s
              </div>
            )}
            {faceDetected && <div style={styles.focused}>● Focused</div>}
            <div style={{ background: "#0f172a", border: "1px solid #3b82f6", padding: "10px 20px", borderRadius: 25, color: "#3b82f6", fontWeight: 700 }}>{formatTime(timeLeft)}</div>
            <button onClick={handleFinishMCQ} style={{ background: "#3b82f6", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Finish →</button>
          </div>
        </header>

        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", color: "#94a3b8", marginBottom: 15 }}>Questions</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {webDevQuizQuestions.map((_, idx) => (
                  <div key={idx} onClick={() => setCurrentQuestion(idx)} style={{ 
                    aspectRatio: 1, display: "flex", alignItems: "center", justifyContent: "center", 
                    background: idx === currentQuestion ? "#3b82f6" : answers[idx] !== undefined ? "#3b82f6" : "#0f172a", 
                    border: `1px solid ${idx === currentQuestion ? "#3b82f6" : "#1f2937"}`, borderRadius: 8, fontSize: 12, cursor: "pointer"
                  }}>{idx + 1}</div>
                ))}
              </div>
            </div>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 15 }}>AI Monitoring</div>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", aspectRatio: "4/3", borderRadius: 10, objectFit: "cover" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 15 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#0f172a", borderRadius: 10, fontSize: 12, border: `1px solid ${faceDetected ? "#22c55e" : "#ef4444"}` }}>
                  <span>Face</span><span style={{ color: faceDetected ? "#22c55e" : "#ef4444" }}>{faceDetected ? "OK" : "No Face"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#0f172a", borderRadius: 10, fontSize: 12 }}>
                  <span>Camera</span><span>{cameraActive ? "On" : "Off"}</span>
                </div>
              </div>
            </div>
          </aside>

          <main style={styles.main}>
            <div style={styles.questionBox}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ background: "#3b82f6", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>Q{currentQuestion + 1} of {webDevQuizQuestions.length}</span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>1 mark</span>
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 25 }}>{q.question}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {q.options.map((opt, idx) => (
                  <div key={idx} onClick={() => setAnswers({ ...answers, [currentQuestion]: idx })} style={{ 
                    background: answers[currentQuestion] === idx ? "rgba(59,130,246,0.15)" : "#0f172a", 
                    border: `2px solid ${answers[currentQuestion] === idx ? "#3b82f6" : "#1f2937"}`, 
                    borderRadius: 12, padding: "16px 20px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 15
                  }}>
                    <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: answers[currentQuestion] === idx ? "#3b82f6" : "#1f2937", borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
              <button onClick={() => setCurrentQuestion(c => c - 1)} disabled={currentQuestion === 0} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: "14px 28px", borderRadius: 10, cursor: currentQuestion === 0 ? "not-allowed" : "pointer", opacity: currentQuestion === 0 ? 0.4 : 1 }}>← Previous</button>
              {currentQuestion === webDevQuizQuestions.length - 1 ? (
                <button onClick={handleFinishMCQ} style={{ background: "#3b82f6", border: "none", color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Proceed to Coding →</button>
              ) : (
                <button onClick={() => setCurrentQuestion(c => c + 1)} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: "14px 28px", borderRadius: 10, cursor: "pointer" }}>Next →</button>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (quizState === "coding") {
    if (!cameraActive) {
      return (
        <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={styles.card}>
            <h2 style={{ fontSize: 24, color: "#ef4444", marginBottom: 15 }}>
              ⚠️ Camera Not Active!
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: 20 }}>
              Camera is required to continue the quiz.
            </p>
            <button onClick={() => { setQuizState("ready"); setBlockUI(false); setNoFaceCountdown(null); setCurrentQuestion(0); }} style={styles.btn}>
              ← Return to Setup
            </button>
          </div>
        </div>
      )
    }

    const cq = codingQuestions[currentQuestion]

    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <button onClick={() => { setQuizState("ready"); setBlockUI(false); setNoFaceCountdown(null); setCurrentQuestion(0); }} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: "10px 18px", borderRadius: 10, cursor: "pointer" }}>← Back</button>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Section B: Coding</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%" }}></span>
              Tab monitoring active
            </div>
            {!faceDetected && noFaceCountdown !== null && (
              <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: 20, color: "#ef4444", fontWeight: 600 }}>
                ⚠️ Face missing! Returning in {noFaceCountdown}s
              </div>
            )}
            {faceDetected && <div style={{ color: "#22c55e" }}>✓ Face OK</div>}
            <button onClick={handleSubmit} style={{ background: "#3b82f6", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Submit Quiz</button>
          </div>
        </header>

        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", color: "#94a3b8", marginBottom: 15 }}>Questions</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {codingQuestions.map((_, idx) => (
                  <div key={idx} onClick={() => setCurrentQuestion(idx)} style={{ 
                    aspectRatio: 1, display: "flex", alignItems: "center", justifyContent: "center", 
                    background: idx === currentQuestion ? "#3b82f6" : codingAnswers[idx] ? "#3b82f6" : "#0f172a", 
                    border: `1px solid ${idx === currentQuestion ? "#3b82f6" : "#1f2937"}`, borderRadius: 8, fontSize: 12, cursor: "pointer"
                  }}>{idx + 1}</div>
                ))}
              </div>
            </div>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 15 }}>AI Monitoring</div>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", aspectRatio: "4/3", borderRadius: 10, objectFit: "cover" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 15 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#0f172a", borderRadius: 10, fontSize: 12, border: `1px solid ${faceDetected ? "#22c55e" : "#ef4444"}` }}>
                  <span>Face</span><span style={{ color: faceDetected ? "#22c55e" : "#ef4444" }}>{faceDetected ? "OK" : "No Face"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#0f172a", borderRadius: 10, fontSize: 12 }}>
                  <span>Camera</span><span>{cameraActive ? "On" : "Off"}</span>
                </div>
              </div>
            </div>
          </aside>

          <main style={styles.main}>
            <div style={styles.questionBox}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ background: "#3b82f6", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>Coding Q{currentQuestion + 1}</span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>{cq.marks} marks</span>
              </div>
              <h3 style={{ color: "#fff", marginBottom: 15 }}>{cq.title}</h3>
              <p style={{ color: "#94a3b8", marginBottom: 20, lineHeight: 1.6 }}>{cq.description}</p>
              <div>
                <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 10 }}>Your Answer:</div>
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#f87171" }}>
                  Copy/Paste is disabled during the test. Tab switching will terminate the quiz.
                </div>
                <textarea
                  value={codingAnswers[currentQuestion] || ""}
                  onChange={(e) => setCodingAnswers({ ...codingAnswers, [currentQuestion]: e.target.value })}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'c' || e.key === 'x' || e.key === 'a')) {
                      e.preventDefault()
                    }
                  }}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  placeholder="Write your code here..."
                  style={{ width: "100%", minHeight: 200, background: "#0f172a", border: "2px solid #1f2937", borderRadius: 12, padding: 15, color: "#e2e8f0", fontFamily: "monospace", fontSize: 14, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
                <button onClick={() => setCurrentQuestion(c => c - 1)} disabled={currentQuestion === 0} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: "14px 28px", borderRadius: 10, cursor: currentQuestion === 0 ? "not-allowed" : "pointer", opacity: currentQuestion === 0 ? 0.4 : 1 }}>← Previous</button>
                {currentQuestion === codingQuestions.length - 1 ? (
                  <button onClick={handleSubmit} style={{ background: "#3b82f6", border: "none", color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Submit Quiz</button>
                ) : (
                  <button onClick={() => setCurrentQuestion(c => c + 1)} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: "14px 28px", borderRadius: 10, cursor: "pointer" }}>Next →</button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return null
}
