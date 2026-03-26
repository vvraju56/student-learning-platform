"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface PythonEyeTrackingResult {
  isFaceDetected: boolean
  isEyesDetected: boolean
  isEyeTrackingStable: boolean
  gazeDirection: string
  isBlinking: boolean
  isDrowsy: boolean
  headPose: {
    yaw: number
    pitch: number
    roll: number
  }
  gazePosition: {
    x: number
    y: number
  }
  distracted: boolean
  reason: string
  cameraIndex: number
  previewJpeg: string
}

interface PythonEyeTrackingHook {
  isTracking: boolean
  isConnected: boolean
  isDataFresh: boolean
  isCameraActive: boolean
  lastMessageAt: number | null
  result: PythonEyeTrackingResult
  error: string | null
  startTracking: () => void
  stopTracking: () => void
}

const DEFAULT_RESULT: PythonEyeTrackingResult = {
  isFaceDetected: false,
  isEyesDetected: false,
  isEyeTrackingStable: false,
  gazeDirection: "unknown",
  isBlinking: false,
  isDrowsy: false,
  headPose: { yaw: 0, pitch: 0, roll: 0 },
  gazePosition: { x: 0.5, y: 0.5 },
  distracted: false,
  reason: "",
  cameraIndex: -1,
  previewJpeg: "",
}

const DATA_STALE_MS = 3000
const FRAME_INTERVAL_MS = 180

function numberOrDefault(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizePayload(payload: any): PythonEyeTrackingResult {
  const isFaceDetected = Boolean(payload?.isFaceDetected ?? payload?.is_face_detected ?? false)
  const reason = typeof payload?.reason === "string" ? payload.reason : ""
  const gazeDirection =
    typeof payload?.gazeDirection === "string"
      ? payload.gazeDirection
      : typeof payload?.gaze_direction === "string"
        ? payload.gaze_direction
        : "unknown"

  const explicitEyes = payload?.isEyesDetected ?? payload?.is_eyes_detected
  const explicitStable = payload?.isEyeTrackingStable ?? payload?.is_eye_tracking_stable
  const isBlinking = Boolean(payload?.isBlinking ?? payload?.is_blinking ?? false)
  const isDrowsy = Boolean(payload?.isDrowsy ?? payload?.is_drowsy ?? false)
  const distracted = Boolean(payload?.distracted ?? payload?.isDistracted ?? payload?.is_distracted ?? false)

  const isEyesDetected =
    typeof explicitEyes === "boolean" ? explicitEyes : isFaceDetected && reason.toUpperCase() !== "NO FACE"

  const isEyeTrackingStable =
    typeof explicitStable === "boolean" ? explicitStable : isEyesDetected && !isDrowsy && !distracted

  const headPoseRaw = payload?.headPose ?? payload?.head_pose ?? {}
  const gazePositionRaw = payload?.gazePosition ?? payload?.gaze_position ?? {}

  return {
    isFaceDetected,
    isEyesDetected,
    isEyeTrackingStable,
    gazeDirection,
    isBlinking,
    isDrowsy,
    headPose: {
      yaw: numberOrDefault(headPoseRaw?.yaw, 0),
      pitch: numberOrDefault(headPoseRaw?.pitch, 0),
      roll: numberOrDefault(headPoseRaw?.roll, 0),
    },
    gazePosition: {
      x: numberOrDefault(gazePositionRaw?.x, 0.5),
      y: numberOrDefault(gazePositionRaw?.y, 0.5),
    },
    distracted,
    reason,
    cameraIndex: numberOrDefault(payload?.cameraIndex ?? payload?.camera_index, -1),
    previewJpeg:
      typeof (payload?.previewJpeg ?? payload?.preview_jpeg) === "string"
        ? payload?.previewJpeg ?? payload?.preview_jpeg
        : "",
  }
}

function isLocalWsUrl(url: string) {
  return url.includes("127.0.0.1") || url.includes("localhost")
}

function isLocalBrowserHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1"
}

export function usePythonEyeTracking(sourceStream?: MediaStream | null): PythonEyeTrackingHook {
  const [isTracking, setIsTracking] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isDataFresh, setIsDataFresh] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null)
  const [result, setResult] = useState<PythonEyeTrackingResult>(DEFAULT_RESULT)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const captureVideoRef = useRef<HTMLVideoElement | null>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const ownStreamRef = useRef<MediaStream | null>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)
  const sourceStreamRef = useRef<MediaStream | null>(sourceStream ?? null)
  const shouldTrackRef = useRef(false)

  useEffect(() => {
    sourceStreamRef.current = sourceStream ?? null
  }, [sourceStream])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const stopFrameLoop = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current)
      frameTimerRef.current = null
    }
  }, [])

  const stopOwnStream = useCallback(() => {
    if (!ownStreamRef.current) return
    ownStreamRef.current.getTracks().forEach((track) => track.stop())
    ownStreamRef.current = null
  }, [])

  const releaseCapture = useCallback(() => {
    stopFrameLoop()
    if (captureVideoRef.current) {
      captureVideoRef.current.pause()
      captureVideoRef.current.srcObject = null
      captureVideoRef.current = null
    }
    activeStreamRef.current = null
    setIsCameraActive(false)
  }, [stopFrameLoop])

  const getCandidateUrls = useCallback(() => {
    const envUrl = process.env.NEXT_PUBLIC_PYTHON_WS_URL?.trim()
    if (envUrl) {
      return [envUrl]
    }

    if (typeof window !== "undefined" && !isLocalBrowserHost(window.location.hostname)) {
      // In deployed environments we require an explicit websocket URL.
      return []
    }

    return ["ws://127.0.0.1:8001", "ws://localhost:8001"]
  }, [])

  const requestCameraStream = useCallback(async () => {
    const constraintCandidates: MediaStreamConstraints[] = [
      {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: { ideal: "user" },
        },
        audio: false,
      },
      {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      },
      { video: true, audio: false },
    ]

    let lastError: any = null
    for (const constraints of constraintCandidates) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        lastError = err
      }
    }
    throw lastError || new Error("Camera stream unavailable")
  }, [])

  const ensureCaptureReady = useCallback(async () => {
    let stream = sourceStreamRef.current

    if (!stream) {
      if (!ownStreamRef.current) {
        ownStreamRef.current = await requestCameraStream()
      }
      stream = ownStreamRef.current
    } else {
      stopOwnStream()
    }

    if (!stream) {
      throw new Error("Camera stream unavailable")
    }

    if (activeStreamRef.current === stream && captureVideoRef.current) {
      setIsCameraActive(true)
      return
    }

    const video = document.createElement("video")
    video.srcObject = stream
    video.autoplay = true
    video.playsInline = true
    video.muted = true

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve()
    })
    await video.play()

    if (captureVideoRef.current) {
      captureVideoRef.current.pause()
      captureVideoRef.current.srcObject = null
    }

    captureVideoRef.current = video
    activeStreamRef.current = stream
    setIsCameraActive(true)
  }, [requestCameraStream, stopOwnStream])

  const sendFrame = useCallback(() => {
    const ws = wsRef.current
    const video = captureVideoRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !video || video.readyState < 2) return

    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement("canvas")
    }
    const canvas = captureCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = 320
    const ratio = video.videoWidth > 0 ? video.videoHeight / video.videoWidth : 0.75
    const height = Math.max(180, Math.round(width * ratio))
    canvas.width = width
    canvas.height = height
    ctx.drawImage(video, 0, 0, width, height)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.6)
    ws.send(
      JSON.stringify({
        type: "frame",
        frame: dataUrl,
        timestamp: Date.now(),
        cameraIndex: 0,
      }),
    )
  }, [])

  const startFrameLoop = useCallback(() => {
    stopFrameLoop()
    frameTimerRef.current = setInterval(() => {
      sendFrame()
    }, FRAME_INTERVAL_MS)
  }, [sendFrame, stopFrameLoop])

  const connect = useCallback(
    (urlIndex = 0) => {
      if (!shouldTrackRef.current || wsRef.current) return
      const urls = getCandidateUrls()

      if (urlIndex >= urls.length) {
        setIsConnected(false)
        setError("Python eye server is not reachable. Set NEXT_PUBLIC_PYTHON_WS_URL for deployed app.")
        clearReconnectTimer()
        reconnectTimerRef.current = setTimeout(() => {
          connect(0)
        }, 3000)
        return
      }

      const url = urls[urlIndex]
      let errored = false
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        clearReconnectTimer()
        setIsConnected(true)
        setError(null)
        startFrameLoop()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data?.type === "pong") return
          const normalized = normalizePayload(data)
          setResult(normalized)
          setLastMessageAt(Date.now())
          setIsDataFresh(true)
          setError(null)
        } catch (parseError) {
          console.error("Failed to parse eye tracking data:", parseError)
        }
      }

      ws.onerror = () => {
        errored = true
        setIsConnected(false)
        if (wsRef.current === ws) {
          wsRef.current = null
        }
        try {
          ws.close()
        } catch {
          // Ignore close errors for failed sockets.
        }
        connect(urlIndex + 1)
      }

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null
        }
        setIsConnected(false)
        if (!shouldTrackRef.current || errored) return
        clearReconnectTimer()
        reconnectTimerRef.current = setTimeout(() => {
          connect(0)
        }, 2000)
      }
    },
    [clearReconnectTimer, getCandidateUrls, startFrameLoop],
  )

  const startTracking = useCallback(() => {
    shouldTrackRef.current = true
    setIsTracking(true)
    setIsDataFresh(false)
    setLastMessageAt(null)
    setError(null)

    const envUrl = process.env.NEXT_PUBLIC_PYTHON_WS_URL?.trim()
    const isLocalRuntime =
      typeof window !== "undefined" && isLocalBrowserHost(window.location.hostname)
    const shouldTryLocalAutoStart = isLocalRuntime && (!envUrl || isLocalWsUrl(envUrl))

    if (shouldTryLocalAutoStart) {
      fetch("/api/python-eye/start", { method: "POST" }).catch(() => {
        // Ignore local auto-start errors.
      })
    }

    void ensureCaptureReady()
      .then(() => {
        if (!shouldTrackRef.current) return
        if (!wsRef.current) {
          clearReconnectTimer()
          connect(0)
        }
      })
      .catch((captureError: any) => {
        const errorName = typeof captureError?.name === "string" ? captureError.name : ""
        const noDevice = errorName === "NotFoundError" || errorName === "OverconstrainedError"
        const permissionDenied = errorName === "NotAllowedError" || errorName === "SecurityError"
        const deviceBusy = errorName === "NotReadableError"

        setIsCameraActive(false)
        if (noDevice) {
          setError("No camera device found for Python eye tracking.")
        } else if (permissionDenied) {
          setError("Camera permission denied for Python eye tracking.")
        } else if (deviceBusy) {
          setError("Camera is currently busy. Close other camera apps/tabs and retry.")
        } else {
          setError(captureError?.message || "Camera access denied for Python eye tracking.")
        }
      })

    if (!wsRef.current) {
      clearReconnectTimer()
      connect(0)
    }
  }, [clearReconnectTimer, connect, ensureCaptureReady])

  const stopTracking = useCallback(() => {
    shouldTrackRef.current = false
    clearReconnectTimer()
    stopFrameLoop()

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    releaseCapture()
    stopOwnStream()

    setIsTracking(false)
    setIsConnected(false)
    setIsDataFresh(false)
    setLastMessageAt(null)
    setError(null)
    setResult(DEFAULT_RESULT)
  }, [clearReconnectTimer, releaseCapture, stopFrameLoop, stopOwnStream])

  useEffect(() => {
    if (!isTracking) {
      setIsDataFresh(false)
      return
    }

    const timer = setInterval(() => {
      if (!lastMessageAt) {
        setIsDataFresh(false)
        return
      }
      setIsDataFresh(Date.now() - lastMessageAt <= DATA_STALE_MS)
    }, 500)

    return () => clearInterval(timer)
  }, [isTracking, lastMessageAt])

  useEffect(() => {
    if (!isTracking) return
    void ensureCaptureReady().catch(() => {
      // keep existing capture; reconnect loop continues
    })
  }, [isTracking, sourceStream, ensureCaptureReady])

  useEffect(() => {
    return () => {
      shouldTrackRef.current = false
      clearReconnectTimer()
      stopFrameLoop()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      releaseCapture()
      stopOwnStream()
    }
  }, [clearReconnectTimer, releaseCapture, stopFrameLoop, stopOwnStream])

  return {
    isTracking,
    isConnected,
    isDataFresh,
    isCameraActive,
    lastMessageAt,
    result,
    error,
    startTracking,
    stopTracking,
  }
}
