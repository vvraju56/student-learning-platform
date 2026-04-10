"use client"

import { useState, useEffect, useRef, useCallback } from "react"
// We use a slightly different import pattern for @mediapipe/tasks-vision 
// to avoid ESM resolution errors in Next.js / Webpack
import type { 
  FilesetResolver as FilesetResolverType,
  FaceLandmarker as FaceLandmarkerType,
} from "@mediapipe/tasks-vision"
import {
  getEyeLandmarks,
  calculateGazeRatio,
  calculateVerticalGazeRatio,
} from "./eye-tracker/utils/eyeTracker"
import { calculateEyeAspectRatio } from "./eye-tracker/utils/blinkDetector"
import { estimateHeadPose } from "./eye-tracker/utils/headPose"

type FilesetResolver = typeof FilesetResolverType;
type FaceLandmarker = typeof FaceLandmarkerType;

interface MonitoringStates {
  monitoringActive: boolean
  cameraActive: boolean
  faceDetected: boolean
  faceMissingGraceActive: boolean
  tabVisible: boolean
  videoPlaying: boolean
  isFocusedNow: boolean
  isDistracted: boolean
  gazeX: number
  gazeY: number
  headYaw: number
  headPitch: number
}

interface ViolationCounts {
  faceMissingCount: number
  tabSwitchCount: number
  autoPauseCount: number
  videoInvalidated: boolean
}

interface MonitoringHook {
  states: MonitoringStates
  violations: ViolationCounts
  validWatchTime: number
  pauseCountdown: number | null
  startMonitoring: () => Promise<void>
  stopMonitoring: () => void
  requestCameraPermission: () => Promise<void>
  pauseVideo: () => void
  resumeVideo: () => void
  setVideoPlaying: (playing: boolean) => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  toggleLandmarks: () => void
}

const VIOLATION_LIMIT = 10
const GRACE_PERIOD_MS = 3000 
const H_GAZE_ONSCREEN_MIN = 0.35 
const H_GAZE_ONSCREEN_MAX = 0.65 
const V_GAZE_ONSCREEN_MIN = 0.30 
const V_GAZE_ONSCREEN_MAX = 0.70 
const EYE_OPEN_THRESHOLD = 0.15 
const MAX_HEAD_YAW = 15 
const MAX_HEAD_PITCH = 15 

const MEDIAPIPE_INFO_PATTERN =
  /Created TensorFlow Lite XNNPACK delegate for CPU|Feedback manager requires a model with a single signature inference|face_landmarker_graph|Packet timestamp mismatch|InputStreamHandler|gl_graph_runner_internal_image\.cc|mediapipe\.StatusList/i

let consoleFilterRefCount = 0
let originalConsoleError: typeof console.error | null = null
let originalConsoleWarn: typeof console.warn | null = null
let originalConsoleLog: typeof console.log | null = null
let originalConsoleInfo: typeof console.info | null = null

function shouldSuppressMediapipeLog(args: unknown[]): boolean {
  return args.some((arg) => {
    if (typeof arg === "string") return MEDIAPIPE_INFO_PATTERN.test(arg)
    if (arg && typeof arg === "object" && "message" in arg) {
      const message = (arg as { message?: unknown }).message
      if (typeof message === "string") return MEDIAPIPE_INFO_PATTERN.test(message)
    }
    return false
  })
}

function installMediapipeConsoleFilter(): () => void {
  if (typeof window === "undefined") return () => {}

  consoleFilterRefCount += 1
  if (consoleFilterRefCount === 1) {
    originalConsoleError = console.error.bind(console)
    originalConsoleWarn = console.warn.bind(console)
    originalConsoleLog = console.log.bind(console)
    originalConsoleInfo = console.info.bind(console)

    console.error = (...args: unknown[]) => {
      if (shouldSuppressMediapipeLog(args)) return
      originalConsoleError?.(...args)
    }
    console.warn = (...args: unknown[]) => {
      if (shouldSuppressMediapipeLog(args)) return
      originalConsoleWarn?.(...args)
    }
    console.log = (...args: unknown[]) => {
      if (shouldSuppressMediapipeLog(args)) return
      originalConsoleLog?.(...args)
    }
    console.info = (...args: unknown[]) => {
      if (shouldSuppressMediapipeLog(args)) return
      originalConsoleInfo?.(...args)
    }
  }

  return () => {
    consoleFilterRefCount = Math.max(0, consoleFilterRefCount - 1)
    if (consoleFilterRefCount === 0) {
      if (originalConsoleError) console.error = originalConsoleError
      if (originalConsoleWarn) console.warn = originalConsoleWarn
      if (originalConsoleLog) console.log = originalConsoleLog
      if (originalConsoleInfo) console.info = originalConsoleInfo
      originalConsoleError = null
      originalConsoleWarn = null
      originalConsoleLog = null
      originalConsoleInfo = null
    }
  }
}

export function useEyeMonitoring(
  videoIframeRef: React.RefObject<HTMLIFrameElement | null>,
  externalPauseCondition: boolean = false,
  onPauseRequest?: () => void,
  onResumeRequest?: () => void
): MonitoringHook {
  const [monitoringActive, setMonitoringActive] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceMissingGraceActive, setFaceMissingGraceActive] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const [videoPlaying, setVideoPlayingInternal] = useState(false)
  const [isFocusedNow, setIsFocusedNow] = useState(false)
  const [isDistracted, setIsDistracted] = useState(false)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const [pauseCountdown, setPauseCountdown] = useState<number | null>(null)
  
  const [gazeX, setGazeX] = useState(0.5)
  const [gazeY, setGazeY] = useState(0.5)
  const [headYaw, setHeadYaw] = useState(0)
  const [headPitch, setHeadPitch] = useState(0)

  const [faceMissingCount, setFaceMissingCount] = useState(0)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [autoPauseCount, setAutoPauseCount] = useState(0)
  const [videoInvalidated, setVideoInvalidated] = useState(false)
  const [validWatchTime, setValidWatchTime] = useState(0)

  const videoStreamRef = useRef<MediaStream | null>(null)
  const faceLandmarkerRef = useRef<FaceLandmarkerType | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>(0)
  const graceTimerStartRef = useRef<number | null>(null)
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTimestampRef = useRef<number>(0)
  const clearConsoleFilterRef = useRef<(() => void) | null>(null)

  const isFocusedRef = useRef(false)
  const isTabVisibleRef = useRef(true)
  const externalPauseRef = useRef(false)
  const faceDetectedRef = useRef(false)

  const setVideoPlaying = useCallback((playing: boolean) => {
    setVideoPlayingInternal(playing)
  }, [])

  const faceOkForTiming = faceDetected || faceMissingGraceActive
  const focusOkForTiming = isFocusedNow || faceMissingGraceActive
  const canCountTime =
    monitoringActive &&
    cameraActive &&
    faceDetected &&
    tabVisible &&
    focusOkForTiming &&
    !videoInvalidated &&
    !externalPauseCondition

  useEffect(() => {
    console.log('Timer status:', canCountTime ? 'RUNNING' : 'STOPPED', '| faceDetected:', faceDetected, 'focused:', isFocusedNow, 'externalPause:', externalPauseCondition)
  }, [canCountTime, faceDetected, isFocusedNow, externalPauseCondition])

  const canResume =
    monitoringActive &&
    cameraActive &&
    faceDetected &&
    tabVisible &&
    isFocusedNow &&
    !videoInvalidated &&
    !externalPauseCondition

  useEffect(() => {
    isFocusedRef.current = isFocusedNow
    isTabVisibleRef.current = tabVisible
    externalPauseRef.current = externalPauseCondition
    faceDetectedRef.current = faceDetected
  }, [isFocusedNow, faceDetected, tabVisible, externalPauseCondition])

  const toggleLandmarks = useCallback(() => {
    setShowLandmarks(prev => !prev)
  }, [])

  const pauseVideo = useCallback(() => {
    console.log('pauseVideo called')
    if (onPauseRequest) {
      onPauseRequest()
    } else if (videoIframeRef.current) {
      videoIframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    }
    setVideoPlayingInternal(false)
    setAutoPauseCount(prev => prev + 1)
  }, [onPauseRequest, videoIframeRef])

  const resumeVideo = useCallback(() => {
    if (onResumeRequest) {
      onResumeRequest()
    } else if (videoIframeRef.current) {
      videoIframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
    }
    setVideoPlayingInternal(true)
  }, [onResumeRequest, videoIframeRef])

  useEffect(() => {
    if (externalPauseCondition && videoPlaying && monitoringActive) {
      console.log('External pause condition triggered, pausing video')
      pauseVideo()
    }
  }, [externalPauseCondition, videoPlaying, monitoringActive, pauseVideo])

  // Stable Grace Period Interval
  useEffect(() => {
    if (!monitoringActive || !videoPlaying) {
      graceTimerStartRef.current = null
      setPauseCountdown(null)
      setFaceMissingGraceActive(false)
      return
    }

    const interval = setInterval(() => {
      const tabLost = !isTabVisibleRef.current
      const externalPause = externalPauseRef.current
      const faceMissing = !faceDetectedRef.current
      const notFocused = !isFocusedRef.current

      if (tabLost || externalPause) {
        graceTimerStartRef.current = null
        setPauseCountdown(null)
        setFaceMissingGraceActive(false)
        console.log('Pausing video: tabLost=', tabLost, 'externalPause=', externalPause)
        pauseVideo()
        return
      }

      if (faceMissing) {
        if (graceTimerStartRef.current === null) {
          graceTimerStartRef.current = Date.now()
        }
        const elapsed = Date.now() - graceTimerStartRef.current
        const remaining = Math.max(0, GRACE_PERIOD_MS - elapsed)
        if (remaining <= 0) {
          console.log('Pausing video: face missing grace period expired')
          pauseVideo()
          setPauseCountdown(null)
          graceTimerStartRef.current = null
          setFaceMissingGraceActive(false)
        } else {
          setPauseCountdown(remaining / 1000)
          setFaceMissingGraceActive(true)
        }
        return
      } else {
        // Face detected - reset grace timer
        graceTimerStartRef.current = null
        setPauseCountdown(null)
        setFaceMissingGraceActive(false)
      }

      if (notFocused) {
        graceTimerStartRef.current = null
        setPauseCountdown(null)
        setFaceMissingGraceActive(false)
        pauseVideo()
        return
      }

      graceTimerStartRef.current = null
      setPauseCountdown(null)
      setFaceMissingGraceActive(false)
    }, 100)

    return () => clearInterval(interval)
  }, [monitoringActive, videoPlaying, pauseVideo])

  const initFaceLandmarker = useCallback(async () => {
    if (faceLandmarkerRef.current) return
    try {
      const vision: any = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/vision_bundle.mjs")
      const filesetResolver = await vision.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm")
      const faceLandmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
      })
      faceLandmarkerRef.current = faceLandmarker
    } catch (err) { console.error("FaceLandmarker load failed:", err) }
  }, [])

  const requestCameraPermission = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
    videoStreamRef.current = stream
    setCameraActive(true)
    return stream
  }, [])

  const processFrame = useCallback(() => {
    const video = videoElementRef.current
    const faceLandmarker = faceLandmarkerRef.current
    const canvas = canvasRef.current
    if (!video || !faceLandmarker || video.paused || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(processFrame)
      return
    }
    const { videoWidth: width, videoHeight: height } = video
    if (canvas) {
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false })
      if (ctx) {
        ctx.save(); ctx.scale(-1, 1); ctx.translate(-width, 0); ctx.drawImage(video, 0, 0, width, height); ctx.restore()
        const rawTimestamp = video.currentTime > 0 ? video.currentTime * 1000 : performance.now()
        const usedTimestamp = Math.max(rawTimestamp, lastTimestampRef.current + 1)
        lastTimestampRef.current = usedTimestamp
        const results = faceLandmarker.detectForVideo(video, usedTimestamp)
        let focused = false, hasFace = false
        if (results.faceLandmarks?.[0]) {
          hasFace = true
          const landmarks = results.faceLandmarks[0]
          const eyeData = getEyeLandmarks(landmarks, width, height)
          const earData = calculateEyeAspectRatio(landmarks, width, height)
          const headPoseData = estimateHeadPose(landmarks, width, height)
          const avgH = (calculateGazeRatio(eyeData.leftEye, eyeData.leftIris) + calculateGazeRatio(eyeData.rightEye, eyeData.rightIris)) / 2
          const avgV = (calculateVerticalGazeRatio(eyeData.leftEye, eyeData.leftIris) + calculateVerticalGazeRatio(eyeData.rightEye, eyeData.rightIris)) / 2
          setGazeX(avgH); setGazeY(avgV)
          const euler = headPoseData.eulerAngles
          if (euler) { setHeadYaw(euler.yaw); setHeadPitch(euler.pitch) }
          focused = avgH > H_GAZE_ONSCREEN_MIN && avgH < H_GAZE_ONSCREEN_MAX && avgV > V_GAZE_ONSCREEN_MIN && avgV < V_GAZE_ONSCREEN_MAX && 
                    (!euler || (Math.abs(euler.yaw) < MAX_HEAD_YAW && Math.abs(euler.pitch) < MAX_HEAD_PITCH)) && earData.avgEar >= EYE_OPEN_THRESHOLD
          if (showLandmarks) {
            ctx.save(); ctx.scale(-1, 1); ctx.translate(-width, 0); ctx.strokeStyle = focused ? "#00ff00" : "#ff0000"; ctx.lineWidth = 2
            const draw = (p: any[]) => { ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); p.forEach(pt => ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.stroke() }
            ctx.fillStyle = focused ? "#00ff00" : "#ff0000"; ctx.beginPath(); ctx.arc(eyeData.leftIris.x, eyeData.leftIris.y, 4, 0, 7); ctx.arc(eyeData.rightIris.x, eyeData.rightIris.y, 4, 0, 7); ctx.fill(); ctx.restore()
          }
        } else {
          console.log('No face detected in frame')
        }
        setFaceDetected(hasFace)
        if (!hasFace) setFaceMissingCount(prev => (prev + 1 >= VIOLATION_LIMIT * 10 ? (setVideoInvalidated(true), prev + 1) : prev + 1))
        else setFaceMissingCount(0)
        setIsFocusedNow(focused); setIsDistracted(!focused)
      }
    }
    animationRef.current = requestAnimationFrame(processFrame)
  }, [showLandmarks])

  const startMonitoring = useCallback(async () => {
    if (!clearConsoleFilterRef.current) {
      clearConsoleFilterRef.current = installMediapipeConsoleFilter()
    }
    await initFaceLandmarker(); const stream = await requestCameraPermission()
    const video = document.createElement('video'); video.muted = true; video.srcObject = stream; video.style.display = 'none'; document.body.appendChild(video)
    videoElementRef.current = video; await video.play()
    setMonitoringActive(true); setVideoInvalidated(false)
    setVideoPlayingInternal(true)
    processFrame()
    console.log('Monitoring started, will resume video once face is detected')
  }, [initFaceLandmarker, requestCameraPermission, processFrame])

  const stopMonitoring = useCallback(() => {
    setMonitoringActive(false); cancelAnimationFrame(animationRef.current)
    if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach(t => t.stop())
    if (videoElementRef.current) document.body.removeChild(videoElementRef.current)
    if (clearConsoleFilterRef.current) { clearConsoleFilterRef.current(); clearConsoleFilterRef.current = null }
    setCameraActive(false); setFaceDetected(false); setFaceMissingGraceActive(false); setVideoPlayingInternal(false); setPauseCountdown(null)
  }, [])

  useEffect(() => {
    const handle = () => { const v = !document.hidden && document.hasFocus(); setTabVisible(v); if (!v) setTabSwitchCount(p => (p + 1 >= VIOLATION_LIMIT ? (setVideoInvalidated(true), p + 1) : p + 1)) }
    window.addEventListener('visibilitychange', handle); window.addEventListener('blur', handle); window.addEventListener('focus', handle)
    return () => { window.removeEventListener('visibilitychange', handle); window.removeEventListener('blur', handle); window.removeEventListener('focus', handle) }
  }, [])

  useEffect(() => {
    if (!canCountTime) { 
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current)
        watchTimeIntervalRef.current = null
      }
      return 
    }
    watchTimeIntervalRef.current = setInterval(() => setValidWatchTime(p => p + 1), 1000)
    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current)
        watchTimeIntervalRef.current = null
      }
    }
  }, [canCountTime])

  useEffect(() => {
    console.log('Resume check: monitoringActive=', monitoringActive, 'canResume=', canResume, 'videoPlaying=', videoPlaying, 'faceDetected=', faceDetected, 'isFocusedNow=', isFocusedNow, 'externalPauseCondition=', externalPauseCondition)
    if (monitoringActive && canResume && !videoPlaying) {
      console.log('Auto-resuming video - all conditions met')
      resumeVideo()
    }
  }, [monitoringActive, canResume, videoPlaying, resumeVideo, faceDetected, isFocusedNow, tabVisible, externalPauseCondition])

  useEffect(() => {
    if (faceDetected && !videoPlaying && monitoringActive && !externalPauseCondition && tabVisible) {
      console.log('Face detected, attempting resume')
      setTimeout(() => {
        if (!videoPlaying) {
          resumeVideo()
        }
      }, 500)
    }
  }, [faceDetected, videoPlaying, monitoringActive, externalPauseCondition, tabVisible, resumeVideo])

  return { states: { monitoringActive, cameraActive, faceDetected, faceMissingGraceActive, tabVisible, videoPlaying, isFocusedNow, isDistracted, gazeX, gazeY, headYaw, headPitch }, violations: { faceMissingCount, tabSwitchCount, autoPauseCount, videoInvalidated }, validWatchTime, pauseCountdown, startMonitoring, stopMonitoring, requestCameraPermission, pauseVideo, resumeVideo, setVideoPlaying, canvasRef, toggleLandmarks }
}
