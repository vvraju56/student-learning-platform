"use client"

import { useState, useEffect, useRef, useCallback } from "react"

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
  previewJpeg: ""
}

const DATA_STALE_MS = 3000

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
    typeof explicitEyes === "boolean"
      ? explicitEyes
      : isFaceDetected && reason.toUpperCase() !== "NO FACE"

  const isEyeTrackingStable =
    typeof explicitStable === "boolean"
      ? explicitStable
      : isEyesDetected && !isDrowsy && !distracted

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
    previewJpeg: typeof (payload?.previewJpeg ?? payload?.preview_jpeg) === "string"
      ? (payload?.previewJpeg ?? payload?.preview_jpeg)
      : ""
  }
}

export function usePythonEyeTracking(): PythonEyeTrackingHook {
  const [isTracking, setIsTracking] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isDataFresh, setIsDataFresh] = useState(false)
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null)
  const [result, setResult] = useState<PythonEyeTrackingResult>(DEFAULT_RESULT)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldTrackRef = useRef(false)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const getCandidateUrls = useCallback(() => {
    const envUrl = process.env.NEXT_PUBLIC_PYTHON_WS_URL?.trim()
    if (envUrl) {
      return [envUrl]
    }

    const candidates = ["ws://127.0.0.1:8001", "ws://localhost:8001"]
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      const host = window.location.hostname
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        candidates.unshift(`wss://${host}:8001`)
      }
    }
    return candidates
  }, [])

  const connect = useCallback((urlIndex = 0) => {
    if (!shouldTrackRef.current || wsRef.current) return
    const urls = getCandidateUrls()

    if (urlIndex >= urls.length) {
      setIsConnected(false)
      setError("Python eye server is not reachable. Run web_server.py or set NEXT_PUBLIC_PYTHON_WS_URL.")
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
      console.log(`✅ Connected to Python Eye Tracking Server (${url})`)
      clearReconnectTimer()
      setIsConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
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
  }, [clearReconnectTimer, getCandidateUrls])

  const startTracking = useCallback(() => {
    shouldTrackRef.current = true
    setIsTracking(true)
    setIsDataFresh(false)
    setLastMessageAt(null)
    setError(null)

    // Best-effort local auto-start for eye dectetion/web_server.py.
    fetch("/api/python-eye/start", { method: "POST" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          if (payload?.error) {
            setError(payload.error)
          }
        }
      })
      .catch(() => {
        // Ignore; reconnect loop will continue trying websocket.
      })

    if (wsRef.current) return
    clearReconnectTimer()
    connect(0)
  }, [clearReconnectTimer, connect])

  const stopTracking = useCallback(() => {
    shouldTrackRef.current = false
    clearReconnectTimer()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsTracking(false)
    setIsConnected(false)
    setIsDataFresh(false)
    setLastMessageAt(null)
    setError(null)
    setResult(DEFAULT_RESULT)
  }, [clearReconnectTimer])

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
    return () => {
      shouldTrackRef.current = false
      clearReconnectTimer()
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [clearReconnectTimer])

  return {
    isTracking,
    isConnected,
    isDataFresh,
    lastMessageAt,
    result,
    error,
    startTracking,
    stopTracking
  }
}
