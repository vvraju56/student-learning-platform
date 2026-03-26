"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import * as tf from "@tensorflow/tfjs"
import * as blazeface from "@tensorflow-models/blazeface"
import { auth, saveAlertToFirebase, saveQuizAttemptToFirestore } from "@/lib/firebase"
import { useHardwareMonitoring } from "@/hooks/use-hardware-monitoring"

type QuizState = "ready" | "mcq" | "coding" | "submitted"

const webDevMCQs = [
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

const webDevCoding = [
  { id: 1, type: "coding", title: "Create a Basic HTML Web Page", description: "Write HTML code to create a webpage with heading, paragraph, list and link", marks: 5 },
  { id: 2, type: "coding", title: "Style a Web Page Using CSS", description: "Write CSS to style heading (blue, center), button (green bg, white text)", marks: 5 }
]

const appDevMCQs = [
  { id: 1, type: "mcq", question: "What does APK stand for in Android?", options: ["Android Phone Kit", "Android Package", "Application Package Kit", "Android Program Key"], correctAnswer: 2, marks: 1 },
  { id: 2, type: "mcq", question: "Which language is officially supported for Android development?", options: ["Swift", "Kotlin", "Python", "C#"], correctAnswer: 1, marks: 1 },
  { id: 3, type: "mcq", question: "Which IDE is commonly used for Android app development?", options: ["VS Code", "Xcode", "Android Studio", "Eclipse"], correctAnswer: 2, marks: 1 },
  { id: 4, type: "mcq", question: "What file contains app permissions in Android?", options: ["MainActivity.kt", "build.gradle", "AndroidManifest.xml", "settings.json"], correctAnswer: 2, marks: 1 },
  { id: 5, type: "mcq", question: "Which UI layout arranges elements vertically or horizontally?", options: ["ConstraintLayout", "RelativeLayout", "LinearLayout", "FrameLayout"], correctAnswer: 2, marks: 1 },
  { id: 6, type: "mcq", question: "What is Flutter primarily used for?", options: ["Web-only apps", "Desktop software", "Cross-platform mobile apps", "Game engines"], correctAnswer: 2, marks: 1 },
  { id: 7, type: "mcq", question: "Which command installs dependencies in a Flutter project?", options: ["flutter install", "flutter get", "flutter pub get", "flutter init"], correctAnswer: 2, marks: 1 },
  { id: 8, type: "mcq", question: "Which lifecycle method is called when an Android app starts?", options: ["onStop()", "onPause()", "onCreate()", "onDestroy()"], correctAnswer: 2, marks: 1 },
  { id: 9, type: "mcq", question: "What is React Native used for?", options: ["Native Android only", "Web apps only", "Cross-platform mobile apps", "Backend APIs"], correctAnswer: 2, marks: 1 },
  { id: 10, type: "mcq", question: "Which storage is best for small key-value data in Android?", options: ["SQLite", "SharedPreferences", "Firebase", "Room DB"], correctAnswer: 1, marks: 1 },
]

const appDevCoding = [
  { id: 1, type: "coding", title: "Create a Simple Android UI", description: "Write XML code for an Android screen that contains:\n• A TextView with text 'Welcome to My App'\n• A Button with text 'Get Started'\n• All elements centered vertically", marks: 5 },
  { id: 2, type: "coding", title: "Flutter Counter App Logic", description: "Write Dart code logic for a Flutter app that:\n• Displays a number\n• Increases the number when a button is pressed\n• Uses setState()", marks: 5 }
]

const gameDevMCQs = [
  { id: 1, type: "mcq", question: "Which engine is commonly used for 2D and 3D game development?", options: ["Unity", "Photoshop", "Figma", "Android Studio"], correctAnswer: 0, marks: 1 },
  { id: 2, type: "mcq", question: "Which language is primarily used in Unity?", options: ["Java", "C++", "C#", "Python"], correctAnswer: 2, marks: 1 },
  { id: 3, type: "mcq", question: "What does FPS stand for in games?", options: ["Frames Per Second", "Fast Play System", "First Player Screen", "Frame Power Speed"], correctAnswer: 0, marks: 1 },
  { id: 4, type: "mcq", question: "Which engine is popular for high-end AAA games?", options: ["Unity", "Unreal Engine", "Godot", "Scratch"], correctAnswer: 1, marks: 1 },
  { id: 5, type: "mcq", question: "What is a game loop?", options: ["A loading screen", "A repeating cycle of update and render", "A multiplayer feature", "A game menu"], correctAnswer: 1, marks: 1 },
  { id: 6, type: "mcq", question: "Which component handles collisions in Unity?", options: ["Transform", "Renderer", "Collider", "Animator"], correctAnswer: 2, marks: 1 },
  { id: 7, type: "mcq", question: "What does NPC stand for?", options: ["New Player Character", "Non Playable Character", "Next Player Control", "Network Player Character"], correctAnswer: 1, marks: 1 },
  { id: 8, type: "mcq", question: "Which term refers to game physics?", options: ["Rendering", "Animation", "Collision & Gravity", "UI"], correctAnswer: 2, marks: 1 },
  { id: 9, type: "mcq", question: "Which file format is commonly used for 3D models?", options: [".mp3", ".fbx", ".png", ".exe"], correctAnswer: 1, marks: 1 },
  { id: 10, type: "mcq", question: "What is the purpose of a sprite?", options: ["Sound effect", "2D image in a game", "3D model", "Game script"], correctAnswer: 1, marks: 1 },
]

const gameDevCoding = [
  { id: 1, type: "coding", title: "Player Movement Script", description: "Write a C# script for Unity that:\n• Moves a player left and right using arrow keys\n• Uses Update() method\n• Speed should be adjustable", marks: 5 },
  { id: 2, type: "coding", title: "Simple Game Loop Logic", description: "Write pseudocode or JavaScript that:\n• Updates player position\n• Checks collision\n• Renders the frame continuously", marks: 5 }
]

const quizData: Record<string, { mcqs: typeof webDevMCQs; coding: typeof webDevCoding; title: string; subtitle: string }> = {
  "web-development": { mcqs: webDevMCQs, coding: webDevCoding, title: "Web Development Quiz", subtitle: "Test your HTML & CSS knowledge" },
  "app-development": { mcqs: appDevMCQs, coding: appDevCoding, title: "App Development Quiz", subtitle: "Test your Android & Flutter knowledge" },
  "game-development": { mcqs: gameDevMCQs, coding: gameDevCoding, title: "Game Development Quiz", subtitle: "Test your Unity & Game Design knowledge" },
}

const styles: any = {
  page: { minHeight: "100vh", background: "#0b0f14", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "20px" },
  card: { background: "#111827", padding: "clamp(20px, 5vw, 32px)", borderRadius: 16, maxWidth: 500, width: "100%", margin: "0 auto" },
  video: { width: "100%", aspectRatio: "4/3", borderRadius: 12, objectFit: "cover", marginBottom: 15 },
  btn: { width: "100%", padding: "14px", background: "#3b82f6", border: "none", color: "#fff", borderRadius: 10, cursor: "pointer", fontWeight: 600, marginTop: 10, fontSize: "clamp(14px, 3vw, 16px)" },
  header: { position: "sticky", top: 0, background: "rgba(15,23,42,0.95)", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2937", flexWrap: "wrap", gap: 10 },
  layout: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", minHeight: "calc(100vh - 70px)", gap: 0 },
  sidebar: { background: "#0f172a", padding: "clamp(15px, 3vw, 25px)", borderRight: "1px solid #1f2937" },
  main: { padding: "clamp(15px, 4vw, 30px)", maxWidth: 900, margin: "0 auto", width: "100%" },
  questionBox: { background: "#111827", border: "1px solid #1f2937", borderRadius: 20, padding: "clamp(15px, 4vw, 30px)", marginBottom: 25 },
  focused: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid #22c55e" },
  warning: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid #ef4444" },
}

export default function QuizPage() {
  const params = useParams()
  const courseId = (params?.id as string) || "web-development"
  const quiz = quizData[courseId] || quizData["web-development"]
  
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const isMobile = useMemo(() => windowWidth < 768, [windowWidth])
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const [quizState, setQuizState] = useState<QuizState>("ready")
  const [faceDetected, setFaceDetected] = useState(false)
  const [eyesDetected, setEyesDetected] = useState(false)
  const [eyeTrackingStable, setEyeTrackingStable] = useState(false)
  const [eyeTrackingConfidence, setEyeTrackingConfidence] = useState(0)
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
  const [userId, setUserId] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const noFaceSinceRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const tfModelRef = useRef<blazeface.BlazeFaceModel | null>(null)
  const consecutiveNoFaceRef = useRef(0)
  const lastHardwareAlertReasonRef = useRef<string>("")
  const eyeTrackingStableRef = useRef(false)
  const stableEyeFrameStreakRef = useRef(0)
  const unstableEyeFrameStreakRef = useRef(0)
  const eyeConfidenceHistoryRef = useRef<number[]>([])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid || null)
    })

    return () => unsubscribe()
  }, [])

  const {
    hardwareStatus,
    isOnline: hardwareOnline,
    isMotionDetected,
    motionDuration,
    motionViolation,
    isMotionSensorStale,
    connectionAgeMs,
    triggerAlert: triggerHardwareAlert,
    clearAlert: clearHardwareAlert
  } = useHardwareMonitoring({
    userId: userId || "",
    motionThresholdMs: 5000,
    heartbeatTimeoutMs: 7000,
    sensorTimeoutMs: 15000
  })

  const motionSeconds = Math.floor(motionDuration / 1000)
  const hardwareReady = hardwareOnline && !motionViolation && !isMotionSensorStale
  const isQuizRunning = quizState === "mcq" || quizState === "coding"
  const attentionDetected = faceDetected && eyesDetected && eyeTrackingStable
  const noAttentionReason = !faceDetected ? "Face missing" : !eyesDetected ? "Eyes not visible" : !eyeTrackingStable ? "Eye tracking unstable" : null
  const hardwareBlockReason = !hardwareOnline
    ? "ESP32 is offline"
    : isMotionSensorStale
      ? "Motion sensor not responding"
      : motionViolation
        ? "Excessive movement detected for 5+ seconds"
        : null

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
      setFaceDetected(false)
      setEyesDetected(false)
      setEyeTrackingStable(false)
      setEyeTrackingConfidence(0)
      eyeTrackingStableRef.current = false
      stableEyeFrameStreakRef.current = 0
      unstableEyeFrameStreakRef.current = 0
      eyeConfidenceHistoryRef.current = []
      setCanStartQuiz(false)
      setNoFaceCountdown(null)
      noFaceSinceRef.current = null
      consecutiveNoFaceRef.current = 0

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
        } catch {
          console.log("Video play interrupted")
        }
      }
    } catch (err) {
      console.error("Camera error:", err)
      alert("Camera not accessible. Please allow camera access to take the quiz.")
    }
  }

  const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

  const hasBothEyesInPrediction = (prediction: any) => {
    const landmarks = Array.isArray(prediction?.landmarks) ? prediction.landmarks : []
    if (landmarks.length < 2) return false

    const rightEye = landmarks[0]
    const leftEye = landmarks[1]
    const isValidPoint = (point: any) => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1])

    if (!isValidPoint(rightEye) || !isValidPoint(leftEye)) {
      return false
    }

    const eyeDistance = Math.abs(rightEye[0] - leftEye[0])
    const maxEyeX = Math.max(Math.abs(rightEye[0]), Math.abs(leftEye[0]))
    const isNormalized = maxEyeX > 0 && maxEyeX <= 2
    const minEyeDistance = isNormalized ? 0.018 : 4

    return eyeDistance > minEyeDistance
  }

  const calculateEyeTrackingScoreInPrediction = (prediction: any, eyesFound: boolean) => {
    if (!eyesFound) return 0

    const landmarks = Array.isArray(prediction?.landmarks) ? prediction.landmarks : []
    if (landmarks.length < 2) return 0

    const rightEye = landmarks[0]
    const leftEye = landmarks[1]
    const nose = landmarks.length >= 3 ? landmarks[2] : null

    const isValidPoint = (point: any) =>
      Array.isArray(point) &&
      point.length >= 2 &&
      Number.isFinite(point[0]) &&
      Number.isFinite(point[1])

    if (!isValidPoint(rightEye) || !isValidPoint(leftEye)) {
      return 0
    }

    const eyeDistance = Math.abs(rightEye[0] - leftEye[0])
    const maxEyeX = Math.max(Math.abs(rightEye[0]), Math.abs(leftEye[0]))
    const isNormalized = maxEyeX > 0 && maxEyeX <= 2
    const minEyeDistance = isNormalized ? 0.018 : 5
    if (eyeDistance < minEyeDistance) return 0

    const distanceScore = clamp((eyeDistance - minEyeDistance) / (minEyeDistance * 2))
    const eyesY = (rightEye[1] + leftEye[1]) / 2
    const eyeTiltRatio = Math.abs(rightEye[1] - leftEye[1]) / eyeDistance
    const tiltScore = clamp(1 - (eyeTiltRatio / 0.45))

    if (eyeTiltRatio > 0.55) return 0

    const eyeMidX = (rightEye[0] + leftEye[0]) / 2
    const topLeft = Array.isArray(prediction?.topLeft) ? prediction.topLeft : null
    const bottomRight = Array.isArray(prediction?.bottomRight) ? prediction.bottomRight : null
    const hasValidFaceBox =
      Array.isArray(topLeft) &&
      topLeft.length >= 2 &&
      Number.isFinite(topLeft[1]) &&
      Array.isArray(bottomRight) &&
      bottomRight.length >= 2 &&
      Number.isFinite(bottomRight[1]) &&
      Math.abs(bottomRight[1] - topLeft[1]) > 0

    const verticalRatio = hasValidFaceBox
      ? (eyesY - topLeft[1]) / Math.max(Math.abs(bottomRight[1] - topLeft[1]), 1e-5)
      : isNormalized
        ? eyesY
        : 0.34
    const verticalScore = clamp(1 - (Math.abs(verticalRatio - 0.34) / 0.45))

    if (!isValidPoint(nose)) {
      return clamp((distanceScore * 0.55) + (tiltScore * 0.25) + (verticalScore * 0.2))
    }

    const noseScoreBase = isNormalized ? 1 : 0.85
    const noseOffsetRatio = Math.abs(nose[0] - eyeMidX) / eyeDistance
    const noseBelowEyes = nose[1] >= eyesY - (eyeDistance * 0.6)
    const noseScore = clamp(1 - (noseOffsetRatio / 0.65))
    const noseVerticalScore = noseBelowEyes ? 1 : 0.55

    return clamp(
      (distanceScore * 0.3)
      + (tiltScore * 0.25)
      + (verticalScore * 0.15)
      + (noseScore * 0.2)
      + (noseVerticalScore * 0.1 * noseScoreBase),
    )
  }

  const startTensorFlowDetection = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)

    const detectFace = async () => {
      if (!videoRef.current || !tfModelRef.current || !videoRef.current.videoWidth) {
        return
      }

      try {
        const predictions = await tfModelRef.current.estimateFaces(videoRef.current, false)
        const detected = predictions.length > 0
        const eyesFound = detected ? hasBothEyesInPrediction(predictions[0]) : false
        let eyeTrackingStableNow = false
        let smoothedEyeScore = 0

        if (detected && eyesFound) {
          const eyeScore = calculateEyeTrackingScoreInPrediction(predictions[0], eyesFound)
          eyeConfidenceHistoryRef.current.push(eyeScore)
          if (eyeConfidenceHistoryRef.current.length > 12) {
            eyeConfidenceHistoryRef.current.shift()
          }
          smoothedEyeScore =
            eyeConfidenceHistoryRef.current.reduce((sum, value) => sum + value, 0)
            / eyeConfidenceHistoryRef.current.length

          if (smoothedEyeScore >= 0.58) {
            stableEyeFrameStreakRef.current += 1
            unstableEyeFrameStreakRef.current = 0
            if (stableEyeFrameStreakRef.current >= 2) {
              eyeTrackingStableNow = true
            } else {
              eyeTrackingStableNow = eyeTrackingStableRef.current
            }
          } else {
            unstableEyeFrameStreakRef.current += 1
            stableEyeFrameStreakRef.current = 0
            if (unstableEyeFrameStreakRef.current >= 4 || smoothedEyeScore <= 0.42) {
              eyeTrackingStableNow = false
            } else {
              eyeTrackingStableNow = eyeTrackingStableRef.current
            }
          }
        } else {
          stableEyeFrameStreakRef.current = 0
          unstableEyeFrameStreakRef.current = 0
          eyeConfidenceHistoryRef.current = []
          smoothedEyeScore = 0
          eyeTrackingStableNow = false
        }

        const isAttentionDetected = detected && eyesFound && eyeTrackingStableNow
        setFaceDetected(detected)
        setEyesDetected(eyesFound)
        setEyeTrackingStable(eyeTrackingStableNow)
        setEyeTrackingConfidence(smoothedEyeScore)
        eyeTrackingStableRef.current = eyeTrackingStableNow
        setCanStartQuiz(isAttentionDetected && hardwareReady)

        if (isAttentionDetected) {
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
    setCanStartQuiz(attentionDetected && cameraActive && hardwareReady)
  }, [attentionDetected, cameraActive, hardwareReady])

  useEffect(() => {
    if (!isQuizRunning) {
      setBlockUI(false)
      return
    }

    if (!hardwareReady) {
      setBlockUI(true)
      return
    }

    if (attentionDetected) {
      setBlockUI(false)
    }
  }, [isQuizRunning, hardwareReady, attentionDetected])

  const pushHardwareAlert = useCallback(async (reason: string, options?: { led?: boolean; buzzer?: boolean }) => {
    if (!isQuizRunning) return
    if (lastHardwareAlertReasonRef.current === reason) return

    lastHardwareAlertReasonRef.current = reason

    const reasonMessageMap: Record<string, string> = {
      offline: "ESP32 connection lost during quiz.",
      sensor_stale: "Motion sensor data is stale during quiz.",
      excessive_movement: "Excessive movement detected for 5+ seconds.",
      face_lost: "Face missing for 5+ seconds during quiz.",
      eyes_lost: "Eyes not detected for 5+ seconds during quiz.",
      eye_unstable: "Advanced eye tracking unstable for 5+ seconds during quiz.",
      tab_switch: "Tab switch detected during quiz."
    }

    try {
      await triggerHardwareAlert(reason, options)
      if (userId) {
        await saveAlertToFirebase(userId, {
          type: `quiz_hardware_${reason}`,
          message: reasonMessageMap[reason] || reason,
          courseId,
          videoId: `quiz-${courseId}`
        })
      }
    } catch (error) {
      console.error("Failed to push quiz hardware alert:", error)
    }
  }, [isQuizRunning, triggerHardwareAlert, userId, courseId])

  useEffect(() => {
    if (!isQuizRunning) {
      if (lastHardwareAlertReasonRef.current && hardwareReady) {
        lastHardwareAlertReasonRef.current = ""
        void clearHardwareAlert()
      }
      return
    }

    if (!hardwareOnline) {
      void pushHardwareAlert("offline", { led: true, buzzer: true })
      return
    }

    if (isMotionSensorStale) {
      void pushHardwareAlert("sensor_stale", { led: true, buzzer: false })
      return
    }

    if (motionViolation) {
      void pushHardwareAlert("excessive_movement", { led: true, buzzer: true })
      return
    }

    if (!faceDetected && noFaceCountdown === 0) {
      void pushHardwareAlert("face_lost", { led: true, buzzer: true })
      return
    }

    if (faceDetected && !eyesDetected && noFaceCountdown === 0) {
      void pushHardwareAlert("eyes_lost", { led: true, buzzer: true })
      return
    }

    if (faceDetected && eyesDetected && !eyeTrackingStable && noFaceCountdown === 0) {
      void pushHardwareAlert("eye_unstable", { led: true, buzzer: true })
      return
    }

    if (lastHardwareAlertReasonRef.current) {
      lastHardwareAlertReasonRef.current = ""
      void clearHardwareAlert()
    }
  }, [
    isQuizRunning,
    hardwareReady,
    hardwareOnline,
    isMotionSensorStale,
    motionViolation,
    faceDetected,
    eyesDetected,
    eyeTrackingStable,
    noFaceCountdown,
    pushHardwareAlert,
    clearHardwareAlert
  ])
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
    
    if (attentionDetected) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      setNoFaceCountdown(null)
      return
    }
    
    if (!attentionDetected && !countdownRef.current) {
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
  }, [quizState, attentionDetected])

  useEffect(() => {
    const isInQuiz = quizState === "mcq" || quizState === "coding"
    if (!isInQuiz) return
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchDetected(true)
        void pushHardwareAlert("tab_switch", { led: false, buzzer: true })
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
  }, [quizState, pushHardwareAlert])

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

  const handleSubmit = async () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
    
    const correct = quiz.mcqs.reduce((c, q, i) => c + (answers[i] === q.correctAnswer ? 1 : 0), 0)
    const totalMarks = quiz.mcqs.reduce((s, q) => s + q.marks, 0) + quiz.coding.reduce((s, q) => s + q.marks, 0)
    const codingMarks = Object.keys(codingAnswers).length * 5
    const totalScore = correct + codingMarks
    const passed = totalScore >= (totalMarks * 0.6)
    
    const user = auth.currentUser
    if (user) {
      await saveQuizAttemptToFirestore(user.uid, {
        courseId: courseId,
        courseName: quiz.title,
        moduleNumber: 1,
        mcqScore: correct,
        codingScore: codingMarks,
        totalScore: totalScore,
        totalMarks: totalMarks,
        passed: passed
      })
    }
    
    setQuizState("submitted")
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  if (quizState === "submitted") {
    const correct = quiz.mcqs.reduce((c, q, i) => c + (answers[i] === q.correctAnswer ? 1 : 0), 0)
    const totalMarks = quiz.mcqs.reduce((s, q) => s + q.marks, 0) + quiz.coding.reduce((s, q) => s + q.marks, 0)
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
          <p style={{ color: "#94a3b8", marginTop: 10 }}>MCQ: {correct}/{quiz.mcqs.length} | Coding: {Object.keys(codingAnswers).length}/{quiz.coding.length}</p>
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
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>{quiz.title}</h2>
          <p style={{ color: "#94a3b8", marginBottom: 20 }}>{quiz.subtitle}</p>
          
          {tabSwitchDetected && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, padding: 15, marginBottom: 20, color: "#ef4444" }}>
              ⚠️ Tab switch detected! Quiz was terminated.
            </div>
          )}

          {!hardwareReady && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, padding: 15, marginBottom: 12, color: "#ef4444" }}>
              ⚠️ Hardware issue: {hardwareBlockReason || "ESP32 unavailable"}
            </div>
          )}

          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 12, color: "#cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>ESP32</span>
              <span style={{ color: hardwareOnline ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{hardwareOnline ? "Online" : "Offline"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Motion</span>
              <span style={{ color: isMotionDetected ? "#60a5fa" : "#94a3b8" }}>{isMotionDetected ? `${motionSeconds}s / 5s` : "Idle"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Last heartbeat</span>
              <span>{Number.isFinite(connectionAgeMs) ? `${Math.round(connectionAgeMs / 1000)}s ago` : "N/A"}</span>
            </div>
            {hardwareStatus?.alert?.reason && hardwareStatus.alert.reason !== "ok" && (
              <div style={{ marginTop: 8, color: "#fbbf24" }}>Alert: {hardwareStatus.alert.reason}</div>
            )}
          </div>

          <video ref={videoRef} autoPlay muted playsInline style={{ ...styles.video, display: videoReady ? "block" : "none" }} />
          
          <p style={{ margin: "10px 0", color: faceDetected ? "#22c55e" : "#f59e0b" }}>
            {faceDetected ? "✓ Face detected" : "⏳ Waiting for face detection..."}
          </p>
          <p style={{ margin: "4px 0 10px", color: faceDetected ? (eyesDetected ? "#22c55e" : "#f59e0b") : "#94a3b8" }}>
            {!faceDetected ? "⏳ Eye detection starts after face is visible" : eyesDetected ? "✓ Eyes detected" : "⏳ Waiting for eye detection..."}
          </p>
          <p style={{ margin: "4px 0 10px", color: !faceDetected || !eyesDetected ? "#94a3b8" : eyeTrackingStable ? "#22c55e" : "#f59e0b" }}>
            {!faceDetected || !eyesDetected ? "⏳ Advanced eye tracking starts after face + eyes are stable" : eyeTrackingStable ? `✓ Eye tracking stable (${Math.round(eyeTrackingConfidence * 100)}%)` : "⏳ Stabilize your eyes to continue..."}
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
              {canStartQuiz ? "✅ Start Quiz" : !hardwareReady ? "⚠️ Waiting for ESP32..." : !faceDetected ? "⏳ Show your face to start..." : !eyesDetected ? "⏳ Keep both eyes visible to start..." : "⏳ Stabilize eye tracking to start..."}
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

    const q = quiz.mcqs[currentQuestion]

    return (
      <div style={styles.page}>
        <header style={{ ...styles.header, flexDirection: isMobile ? "column" : "row", gap: isMobile ? "12px" : "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
            <button onClick={() => { setQuizState("ready"); setBlockUI(false); setNoFaceCountdown(null); setCurrentQuestion(0); }} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontSize: "clamp(12px, 2vw, 14px)" }}>← Back</button>
            <span style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 600 }}>Section A: MCQs</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "20px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-end" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%" }}></span>
              {!isMobile && "Tab monitoring"}
            </div>
            {!attentionDetected && noFaceCountdown !== null && (
              <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: 20, color: "#ef4444", fontWeight: 600, fontSize: "clamp(11px, 2vw, 13px)" }}>
                ⚠️ {noAttentionReason || "Attention lost"}! {noFaceCountdown}s
              </div>
            )}
            {attentionDetected && <div style={styles.focused}>● Focused (Eyes)</div>}
            {!hardwareReady && (
              <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", padding: "8px 14px", borderRadius: 20, color: "#ef4444", fontWeight: 600, fontSize: "clamp(11px, 2vw, 13px)" }}>
                ⚠️ {hardwareBlockReason || "Hardware blocked"}
              </div>
            )}
            <div style={{ background: "#0f172a", border: "1px solid #3b82f6", padding: "10px 20px", borderRadius: 25, color: "#3b82f6", fontWeight: 700, fontSize: "clamp(14px, 3vw, 16px)" }}>{formatTime(timeLeft)}</div>
            <button
              onClick={handleFinishMCQ}
              disabled={!hardwareReady || blockUI}
              style={{ background: "#3b82f6", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 600, cursor: !hardwareReady || blockUI ? "not-allowed" : "pointer", opacity: !hardwareReady || blockUI ? 0.6 : 1, fontSize: "clamp(12px, 2vw, 14px)" }}
            >
              Finish →
            </button>
          </div>
        </header>

        <div style={{ ...styles.layout, gridTemplateColumns: isMobile ? "1fr" : "280px 1fr" }}>
          <aside style={{ ...styles.sidebar, padding: isMobile ? "15px" : "25px", borderRight: isMobile ? "none" : "1px solid #1f2937", borderBottom: isMobile ? "1px solid #1f2937" : "none" }}>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: isMobile ? "12px" : 20, marginBottom: isMobile ? "12px" : 20 }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", color: "#94a3b8", marginBottom: isMobile ? "10px" : 15 }}>Questions</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 5 : 5}, 1fr)`, gap: isMobile ? "6px" : 8 }}>
                {quiz.mcqs.map((_, idx) => (
                  <div key={idx} onClick={() => setCurrentQuestion(idx)} style={{ 
                    aspectRatio: 1, display: "flex", alignItems: "center", justifyContent: "center", 
                    background: idx === currentQuestion ? "#3b82f6" : answers[idx] !== undefined ? "#3b82f6" : "#0f172a", 
                    border: `1px solid ${idx === currentQuestion ? "#3b82f6" : "#1f2937"}`, borderRadius: 8, fontSize: isMobile ? "10px" : 12, cursor: "pointer"
                  }}>{idx + 1}</div>
                ))}
              </div>
            </div>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: isMobile ? "12px" : 20 }}>
              <div style={{ fontSize: isMobile ? "12px" : 14, fontWeight: 600, marginBottom: 15 }}>Face + Advanced Eye Monitoring</div>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", aspectRatio: "4/3", borderRadius: 10, objectFit: "cover" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 15 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#0f172a", borderRadius: 10, fontSize: 12, border: `1px solid ${faceDetected ? "#22c55e" : "#ef4444"}` }}>
                  <span>Face</span><span style={{ color: faceDetected ? "#22c55e" : "#ef4444" }}>{faceDetected ? "OK" : "No Face"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#0f172a", borderRadius: 10, fontSize: 12, border: `1px solid ${!faceDetected ? "#f59e0b" : eyesDetected ? "#22c55e" : "#ef4444"}` }}>
                  <span>Eyes</span><span style={{ color: !faceDetected ? "#f59e0b" : eyesDetected ? "#22c55e" : "#ef4444" }}>{!faceDetected ? "Wait" : eyesDetected ? "OK" : "No Eyes"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#0f172a", borderRadius: 10, fontSize: 12, border: `1px solid ${!faceDetected || !eyesDetected ? "#f59e0b" : eyeTrackingStable ? "#22c55e" : "#ef4444"}` }}>
                  <span>EyeTrack</span><span style={{ color: !faceDetected || !eyesDetected ? "#f59e0b" : eyeTrackingStable ? "#22c55e" : "#ef4444" }}>{!faceDetected || !eyesDetected ? "Wait" : eyeTrackingStable ? `${Math.round(eyeTrackingConfidence * 100)}%` : "Low"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#0f172a", borderRadius: 10, fontSize: 12 }}>
                  <span>Camera</span><span>{cameraActive ? "On" : "Off"}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 10, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>ESP32</span>
                  <span style={{ color: hardwareOnline ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{hardwareOnline ? "Online" : "Offline"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>Motion</span>
                  <span style={{ color: motionViolation ? "#ef4444" : isMotionDetected ? "#60a5fa" : "#94a3b8" }}>
                    {motionViolation ? "Violation" : isMotionDetected ? `${motionSeconds}s / 5s` : "Idle"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Heartbeat</span>
                  <span>{Number.isFinite(connectionAgeMs) ? `${Math.round(connectionAgeMs / 1000)}s ago` : "N/A"}</span>
                </div>
              </div>
            </div>
          </aside>

          <main style={styles.main}>
            {!hardwareReady && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 12px", marginBottom: 12, color: "#fecaca", fontSize: "12px" }}>
                ⚠️ {hardwareBlockReason || "Hardware monitoring blocked"}. Timer paused until issue is resolved.
              </div>
            )}
            <div style={{ ...styles.questionBox, opacity: blockUI || !hardwareReady ? 0.6 : 1, pointerEvents: blockUI || !hardwareReady ? "none" : "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: "10px" }}>
                <span style={{ background: "#3b82f6", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: "clamp(11px, 2vw, 13px)", fontWeight: 600 }}>Q{currentQuestion + 1} of {quiz.mcqs.length}</span>
                <span style={{ color: "#94a3b8", fontSize: "clamp(11px, 2vw, 13px)" }}>1 mark</span>
              </div>
              <div style={{ fontSize: "clamp(15px, 3vw, 17px)", lineHeight: 1.6, marginBottom: 25 }}>{q.question}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : 12 }}>
                {q.options.map((opt, idx) => (
                  <div key={idx} onClick={() => setAnswers({ ...answers, [currentQuestion]: idx })} style={{ 
                    background: answers[currentQuestion] === idx ? "rgba(59,130,246,0.15)" : "#0f172a", 
                    border: `2px solid ${answers[currentQuestion] === idx ? "#3b82f6" : "#1f2937"}`, 
                    borderRadius: 12, padding: isMobile ? "12px 15px" : "16px 20px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: isMobile ? "10px" : 15, flexWrap: "wrap"
                  }}>
                    <span style={{ width: isMobile ? "28px" : 32, height: isMobile ? "28px" : 32, display: "flex", alignItems: "center", justifyContent: "center", background: answers[currentQuestion] === idx ? "#3b82f6" : "#1f2937", borderRadius: 8, fontWeight: 600, fontSize: isMobile ? "12px" : 14, flexShrink: 0 }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span style={{ fontSize: "clamp(13px, 2vw, 15px)" }}>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30, flexWrap: "wrap", gap: "10px" }}>
              <button onClick={() => setCurrentQuestion(c => c - 1)} disabled={currentQuestion === 0} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: isMobile ? "10px 18px" : "14px 28px", borderRadius: 10, cursor: currentQuestion === 0 ? "not-allowed" : "pointer", opacity: currentQuestion === 0 ? 0.4 : 1, fontSize: "clamp(12px, 2vw, 14px)" }}>← Previous</button>
              {currentQuestion === quiz.mcqs.length - 1 ? (
                <button onClick={handleFinishMCQ} style={{ background: "#3b82f6", border: "none", color: "#fff", padding: isMobile ? "10px 18px" : "14px 28px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: "clamp(12px, 2vw, 14px)" }}>Proceed to Coding →</button>
              ) : (
                <button onClick={() => setCurrentQuestion(c => c + 1)} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: isMobile ? "10px 18px" : "14px 28px", borderRadius: 10, cursor: "pointer", fontSize: "clamp(12px, 2vw, 14px)" }}>Next →</button>
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

    const cq = quiz.coding[currentQuestion]

    return (
      <div style={styles.page}>
        <header style={{ ...styles.header, flexDirection: isMobile ? "column" : "row", gap: isMobile ? "12px" : "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
            <button onClick={() => { setQuizState("ready"); setBlockUI(false); setNoFaceCountdown(null); setCurrentQuestion(0); }} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontSize: "clamp(12px, 2vw, 14px)" }}>← Back</button>
            <span style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 600 }}>Section B: Coding</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "20px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-end" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%" }}></span>
              {!isMobile && "Tab monitoring"}
            </div>
            {!attentionDetected && noFaceCountdown !== null && (
              <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: 20, color: "#ef4444", fontWeight: 600, fontSize: "clamp(11px, 2vw, 13px)" }}>
                ⚠️ {noAttentionReason || "Attention lost"}! {noFaceCountdown}s
              </div>
            )}
            {attentionDetected && <div style={{ color: "#22c55e", fontSize: "clamp(12px, 2vw, 14px)" }}>✓ Face + Eyes + Tracking OK</div>}
            {!hardwareReady && (
              <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", padding: "8px 14px", borderRadius: 20, color: "#ef4444", fontWeight: 600, fontSize: "clamp(11px, 2vw, 13px)" }}>
                ⚠️ {hardwareBlockReason || "Hardware blocked"}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!hardwareReady || blockUI}
              style={{ background: "#3b82f6", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 600, cursor: !hardwareReady || blockUI ? "not-allowed" : "pointer", opacity: !hardwareReady || blockUI ? 0.6 : 1, fontSize: "clamp(12px, 2vw, 14px)" }}
            >
              Submit Quiz
            </button>
          </div>
        </header>

        <div style={{ ...styles.layout, gridTemplateColumns: isMobile ? "1fr" : "280px 1fr" }}>
          <aside style={{ ...styles.sidebar, padding: isMobile ? "15px" : "25px", borderRight: isMobile ? "none" : "1px solid #1f2937", borderBottom: isMobile ? "1px solid #1f2937" : "none" }}>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: isMobile ? "12px" : 20, marginBottom: isMobile ? "12px" : 20 }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", color: "#94a3b8", marginBottom: isMobile ? "10px" : 15 }}>Questions</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: isMobile ? "6px" : 8 }}>
                {quiz.coding.map((_, idx) => (
                  <div key={idx} onClick={() => setCurrentQuestion(idx)} style={{ 
                    aspectRatio: 1, display: "flex", alignItems: "center", justifyContent: "center", 
                    background: idx === currentQuestion ? "#3b82f6" : codingAnswers[idx] ? "#3b82f6" : "#0f172a", 
                    border: `1px solid ${idx === currentQuestion ? "#3b82f6" : "#1f2937"}`, borderRadius: 8, fontSize: isMobile ? "10px" : 12, cursor: "pointer"
                  }}>{idx + 1}</div>
                ))}
              </div>
            </div>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: isMobile ? "12px" : 20 }}>
              <div style={{ fontSize: isMobile ? "12px" : 14, fontWeight: 600, marginBottom: 15 }}>Face + Advanced Eye Monitoring</div>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", aspectRatio: "4/3", borderRadius: 10, objectFit: "cover" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: isMobile ? "6px" : 10, marginTop: isMobile ? "10px" : 15 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "6px" : 10, background: "#0f172a", borderRadius: 10, fontSize: isMobile ? "10px" : 12, border: `1px solid ${faceDetected ? "#22c55e" : "#ef4444"}` }}>
                  <span>Face</span><span style={{ color: faceDetected ? "#22c55e" : "#ef4444" }}>{faceDetected ? "OK" : "No Face"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "6px" : 10, background: "#0f172a", borderRadius: 10, fontSize: isMobile ? "10px" : 12, border: `1px solid ${!faceDetected ? "#f59e0b" : eyesDetected ? "#22c55e" : "#ef4444"}` }}>
                  <span>Eyes</span><span style={{ color: !faceDetected ? "#f59e0b" : eyesDetected ? "#22c55e" : "#ef4444" }}>{!faceDetected ? "Wait" : eyesDetected ? "OK" : "No Eyes"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "6px" : 10, background: "#0f172a", borderRadius: 10, fontSize: isMobile ? "10px" : 12, border: `1px solid ${!faceDetected || !eyesDetected ? "#f59e0b" : eyeTrackingStable ? "#22c55e" : "#ef4444"}` }}>
                  <span>EyeTrack</span><span style={{ color: !faceDetected || !eyesDetected ? "#f59e0b" : eyeTrackingStable ? "#22c55e" : "#ef4444" }}>{!faceDetected || !eyesDetected ? "Wait" : eyeTrackingStable ? `${Math.round(eyeTrackingConfidence * 100)}%` : "Low"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "6px" : 10, background: "#0f172a", borderRadius: 10, fontSize: isMobile ? "10px" : 12 }}>
                  <span>Camera</span><span>{cameraActive ? "On" : "Off"}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: isMobile ? "8px" : 10, fontSize: isMobile ? "10px" : 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>ESP32</span>
                  <span style={{ color: hardwareOnline ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{hardwareOnline ? "Online" : "Offline"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>Motion</span>
                  <span style={{ color: motionViolation ? "#ef4444" : isMotionDetected ? "#60a5fa" : "#94a3b8" }}>
                    {motionViolation ? "Violation" : isMotionDetected ? `${motionSeconds}s / 5s` : "Idle"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Heartbeat</span>
                  <span>{Number.isFinite(connectionAgeMs) ? `${Math.round(connectionAgeMs / 1000)}s ago` : "N/A"}</span>
                </div>
              </div>
            </div>
          </aside>

          <main style={styles.main}>
            {!hardwareReady && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 12px", marginBottom: 12, color: "#fecaca", fontSize: "12px" }}>
                ⚠️ {hardwareBlockReason || "Hardware monitoring blocked"}. Timer paused until issue is resolved.
              </div>
            )}
            <div style={{ ...styles.questionBox, opacity: blockUI || !hardwareReady ? 0.6 : 1, pointerEvents: blockUI || !hardwareReady ? "none" : "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: "10px" }}>
                <span style={{ background: "#3b82f6", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: "clamp(11px, 2vw, 13px)", fontWeight: 600 }}>Coding Q{currentQuestion + 1}</span>
                <span style={{ color: "#94a3b8", fontSize: "clamp(11px, 2vw, 13px)" }}>{cq.marks} marks</span>
              </div>
              <h3 style={{ color: "#fff", marginBottom: 15, fontSize: "clamp(16px, 3vw, 20px)" }}>{cq.title}</h3>
              <p style={{ color: "#94a3b8", marginBottom: 20, lineHeight: 1.6, fontSize: "clamp(13px, 2vw, 15px)" }}>{cq.description}</p>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "clamp(12px, 2vw, 14px)", marginBottom: 10 }}>Your Answer:</div>
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: isMobile ? "10px" : 12, color: "#f87171" }}>
                  Copy/Paste disabled | Tab switch terminates quiz
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
                  style={{ width: "100%", minHeight: isMobile ? 150 : 200, background: "#0f172a", border: "2px solid #1f2937", borderRadius: 12, padding: isMobile ? "12px" : 15, color: "#e2e8f0", fontFamily: "monospace", fontSize: isMobile ? "13px" : 14, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30, flexWrap: "wrap", gap: "10px" }}>
                <button onClick={() => setCurrentQuestion(c => c - 1)} disabled={currentQuestion === 0} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: isMobile ? "10px 18px" : "14px 28px", borderRadius: 10, cursor: currentQuestion === 0 ? "not-allowed" : "pointer", opacity: currentQuestion === 0 ? 0.4 : 1, fontSize: "clamp(12px, 2vw, 14px)" }}>← Previous</button>
                {currentQuestion === quiz.coding.length - 1 ? (
                  <button onClick={handleSubmit} style={{ background: "#3b82f6", border: "none", color: "#fff", padding: isMobile ? "10px 18px" : "14px 28px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: "clamp(12px, 2vw, 14px)" }}>Submit Quiz</button>
                ) : (
                  <button onClick={() => setCurrentQuestion(c => c + 1)} style={{ background: "#111827", border: "1px solid #1f2937", color: "#fff", padding: isMobile ? "10px 18px" : "14px 28px", borderRadius: 10, cursor: "pointer", fontSize: "clamp(12px, 2vw, 14px)" }}>Next →</button>
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

