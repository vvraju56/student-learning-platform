"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface PostureStatus {
  isGood: boolean
  postureType: 'Good' | 'Leaning Forward' | 'Poor'
  distance?: number
  confidence: number
  lastUpdate: number
}

interface PostureDetectionHook {
  postureStatus: PostureStatus
  isConnected: boolean
  connectionType: 'webcam' | 'esp32' | 'simulation'
  startDetection: () => Promise<void>
  stopDetection: () => void
  connectESP32: (url: string) => Promise<boolean>
  updateManualDistance: (distance: number) => void
}

export function usePostureDetection(): PostureDetectionHook {
  const [postureStatus, setPostureStatus] = useState<PostureStatus>({
    isGood: true,
    postureType: 'Good',
    confidence: 1.0,
    lastUpdate: Date.now()
  })
  const [isConnected, setIsConnected] = useState(false)
  const [connectionType, setConnectionType] = useState<'webcam' | 'esp32' | 'simulation'>('simulation')
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const esp32SocketRef = useRef<WebSocket | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const modelRef = useRef<any>(null)

  // Posture detection thresholds
  const POSTURE_THRESHOLDS = {
    GOOD_MIN_DISTANCE: 50, // cm
    GOOD_MAX_DISTANCE: 80, // cm
    LEANING_MIN_DISTANCE: 30, // cm
    LEANING_MAX_DISTANCE: 50, // cm
    POOR_MAX_DISTANCE: 30, // cm
  }

  // Load pose detection model for webcam-based detection
  const loadPoseDetectionModel = async () => {
    try {
      const poseDetection = await import('@tensorflow-models/pose-detection')
      const tf = await import('@tensorflow/tfjs')
      
      await tf.setBackend('webgl')
      await tf.ready()
      
      const model = poseDetection.SupportedModels.MoveNet
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true
      }
      
      modelRef.current = await poseDetection.createDetector(model, detectorConfig)
      console.log('🧠 Pose detection model loaded for posture monitoring')
      return true
    } catch (error) {
      console.error('❌ Failed to load pose detection model:', error)
      return false
    }
  }

  // ESP32 sensor-based posture detection
  const connectESP32 = useCallback(async (url: string): Promise<boolean> => {
    try {
      // Close existing connection
      if (esp32SocketRef.current) {
        esp32SocketRef.current.close()
      }

      const socket = new WebSocket(url)
      esp32SocketRef.current = socket

      socket.onopen = () => {
        console.log('🔗 Connected to ESP32 posture sensor')
        setIsConnected(true)
        setConnectionType('esp32')
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.distance !== undefined) {
            const distance = Number(data.distance)
            updatePostureFromDistance(distance)
          }
        } catch (error) {
          console.error('Error parsing ESP32 data:', error)
        }
      }

      socket.onclose = () => {
        console.log('🔌 ESP32 connection closed')
        setIsConnected(false)
        esp32SocketRef.current = null
      }

      socket.onerror = (error) => {
        console.error('ESP32 connection error:', error)
        setIsConnected(false)
      }

      return true
    } catch (error) {
      console.error('Failed to connect to ESP32:', error)
      return false
    }
  }, [])

  // Webcam-based posture detection using pose estimation
  const startWebcamPostureDetection = async () => {
    try {
      const modelLoaded = await loadPoseDetectionModel()
      if (!modelLoaded) {
        throw new Error('Failed to load pose detection model')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      videoRef.current = video

      video.addEventListener('loadedmetadata', () => {
        console.log('📷 Webcam started for posture detection')
        setIsConnected(true)
        setConnectionType('webcam')
        startWebcamDetectionLoop()
      })

    } catch (error) {
      console.error('Failed to start webcam posture detection:', error)
    }
  }

  // Webcam-based pose detection loop
  const startWebcamDetectionLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !modelRef.current || videoRef.current.readyState !== 4) {
        return
      }

      try {
        const poses = await modelRef.current.estimatePoses(videoRef.current)
        
        if (poses && poses.length > 0) {
          const pose = poses[0]
          const distance = estimateDistanceFromPose(pose)
          updatePostureFromDistance(distance)
        }
      } catch (error) {
        console.error('Posture detection error:', error)
      }
    }, 2000) // Check every 2 seconds
  }

  // Estimate distance from pose landmarks
  const estimateDistanceFromPose = (pose: any): number => {
    try {
      // Get key points for distance estimation
      const keypoints = pose.keypoints
      
      // Find face and shoulder landmarks
      const faceKeypoints = keypoints.filter((kp: any) => kp.name?.includes('face') || kp.name?.includes('nose'))
      const shoulderKeypoints = keypoints.filter((kp: any) => kp.name?.includes('shoulder'))
      
      if (faceKeypoints.length > 0 && shoulderKeypoints.length > 0) {
        // Calculate approximate distance based on face size and position
        const faceY = faceKeypoints[0].y
        const shoulderY = shoulderKeypoints.reduce((sum: number, kp: any) => sum + kp.y, 0) / shoulderKeypoints.length
        
        const faceShoulderDistance = Math.abs(faceY - shoulderY)
        const videoHeight = videoRef.current?.videoHeight || 480
        
        // Estimate distance based on face-shoulder ratio
        const ratio = faceShoulderDistance / videoHeight
        
        // Convert ratio to approximate distance in cm
        // This is a simplified estimation - would need calibration for real use
        let distance = 100 * (1 - ratio * 2) // Rough approximation
        
        // Add some randomness to simulate sensor noise
        distance += (Math.random() - 0.5) * 10
        
        return Math.max(20, Math.min(120, distance)) // Clamp between 20-120cm
      }
    } catch (error) {
      console.error('Distance estimation error:', error)
    }
    
    return 60 // Default to good posture distance
  }

  // Update posture status based on distance
  const updatePostureFromDistance = useCallback((distance: number) => {
    const now = Date.now()
    let postureType: 'Good' | 'Leaning Forward' | 'Poor'
    let isGood: boolean
    let confidence: number

    if (distance >= POSTURE_THRESHOLDS.GOOD_MIN_DISTANCE && distance <= POSTURE_THRESHOLDS.GOOD_MAX_DISTANCE) {
      postureType = 'Good'
      isGood = true
      confidence = 0.9
    } else if (distance >= POSTURE_THRESHOLDS.LEANING_MIN_DISTANCE && distance < POSTURE_THRESHOLDS.GOOD_MIN_DISTANCE) {
      postureType = 'Leaning Forward'
      isGood = false
      confidence = 0.7
    } else if (distance < POSTURE_THRESHOLDS.LEANING_MIN_DISTANCE) {
      postureType = 'Poor'
      isGood = false
      confidence = 0.8
    } else if (distance > POSTURE_THRESHOLDS.GOOD_MAX_DISTANCE) {
      postureType = 'Poor' // Too far away
      isGood = false
      confidence = 0.6
    } else {
      postureType = 'Good'
      isGood = true
      confidence = 0.5
    }

    setPostureStatus({
      isGood,
      postureType,
      distance,
      confidence,
      lastUpdate: now
    })

    // Log posture changes
    const prevPostureType = postureStatus.postureType
    if (prevPostureType !== postureType) {
      console.log(`🧍 Posture changed: ${prevPostureType} → ${postureType} (Distance: ${distance.toFixed(1)}cm)`)
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('postureChanged', {
        detail: { postureType, distance, isGood, confidence }
      }))
    }
  }, [postureStatus.postureType])

  // Manual distance update (for testing or external sensors)
  const updateManualDistance = useCallback((distance: number) => {
    updatePostureFromDistance(distance)
  }, [updatePostureFromDistance])

  // Simulated posture detection
  const startSimulation = () => {
    setIsConnected(true)
    setConnectionType('simulation')
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      // Simulate realistic distance changes
      const random = Math.random()
      let distance: number

      if (random > 0.8) {
        // 20% chance of leaning forward
        distance = 30 + Math.random() * 20
      } else if (random > 0.6) {
        // 20% chance of poor posture
        distance = 20 + Math.random() * 15
      } else {
        // 60% chance of good posture
        distance = 50 + Math.random() * 30
      }

      updatePostureFromDistance(distance)
    }, 3000) // Update every 3 seconds
  }

  // Start posture detection
  const startDetection = useCallback(async () => {
    console.log('🚀 Starting posture detection')
    
    // Try webcam first, fall back to simulation
    try {
      await startWebcamPostureDetection()
    } catch (error) {
      console.log('Webcam not available, using simulation')
      startSimulation()
    }
  }, [])

  // Stop posture detection
  const stopDetection = useCallback(() => {
    console.log('⏹️ Stopping posture detection')
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (esp32SocketRef.current) {
      esp32SocketRef.current.close()
      esp32SocketRef.current = null
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    setIsConnected(false)
    setConnectionType('simulation')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection()
    }
  }, [stopDetection])

  return {
    postureStatus,
    isConnected,
    connectionType,
    startDetection,
    stopDetection,
    connectESP32,
    updateManualDistance
  }
}