"use client"

import { useState, useEffect, useRef } from "react"

interface RealtimeFaceDetectionHook {
  isFaceDetected: boolean
  isWebcamActive: boolean
  confidence: number
  boundingBox: { x: number; y: number; width: number; height: number } | null
  startWebcam: () => Promise<void>
  stopWebcam: () => void
  faceDetectionError: string | null
}

export function useRealtimeFaceDetection(): RealtimeFaceDetectionHook {
  const [isFaceDetected, setIsFaceDetected] = useState(false)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [boundingBox, setBoundingBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const modelRef = useRef<any>(null)

  const loadFaceDetectionModel = async () => {
    try {
      // Try to load TensorFlow face detection model
      const faceDetection = await import('@tensorflow-models/face-detection')
      const tf = await import('@tensorflow/tfjs')
      
      // Set backend
      await tf.setBackend('webgl')
      await tf.ready()
      
      // Load model
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector
      const detectorConfig = {
        runtime: 'tfjs' as const,
        maxFaces: 1,
        refineLandmarks: false
      }
      
      modelRef.current = await faceDetection.createDetector(model, detectorConfig)
      console.log('🧠 TensorFlow face detection model loaded')
      
      return true
    } catch (error) {
      console.error('❌ Failed to load TensorFlow model:', error)
      
      // Fallback to BlazeFace model
      try {
        const blazeface = await import('@tensorflow-models/blazeface')
        const tf = await import('@tensorflow/tfjs')
        
        await tf.setBackend('webgl')
        await tf.ready()
        
        modelRef.current = await blazeface.load()
        console.log('🧠 BlazeFace model loaded as fallback')
        
        return true
      } catch (blazefaceError) {
        console.error('❌ Failed to load BlazeFace model:', blazefaceError)
        return false
      }
    }
  }

  const detectFace = async () => {
    if (!videoRef.current || videoRef.current.readyState !== 4 || !modelRef.current) {
      return false
    }

    try {
      const video = videoRef.current
      
      // Try MediaPipe face detection first
      if (modelRef.current.estimateFaces) {
        const faces = await modelRef.current.estimateFaces(video)
        
        if (faces && faces.length > 0) {
          const face = faces[0]
          const box = face.box || {
            xMin: face.boundingBox.xMin,
            yMin: face.boundingBox.yMin,
            width: face.boundingBox.width,
            height: face.boundingBox.height
          }
          
          setBoundingBox({
            x: box.xMin,
            y: box.yMin,
            width: box.width,
            height: box.height
          })
          
          // Confidence estimation based on face size and position
          const faceArea = box.width * box.height
          const videoArea = video.videoWidth * video.videoHeight
          const relativeSize = faceArea / videoArea
          const confidenceScore = Math.min(0.5 + relativeSize * 10, 0.95)
          
          setConfidence(confidenceScore)
          console.log('👤 Face detected with confidence:', confidenceScore.toFixed(2))
          return true
        }
      }
      // Fallback to BlazeFace
      else if (modelRef.current.estimateFaces) {
        const predictions = await modelRef.current.estimateFaces(video, false)
        
        if (predictions && predictions.length > 0) {
          const face = predictions[0]
          const [x, y, width, height] = face.topLeft.concat(face.bottomRight).flatMap((coord: number[]) => [
            coord[0], coord[1], coord[2] - coord[0], coord[3] - coord[1]
          ])
          
          setBoundingBox({ x, y, width, height })
          setConfidence(face.probability[0])
          console.log('👤 Face detected with confidence:', face.probability[0].toFixed(2))
          return true
        }
      }
    } catch (error) {
      console.error('Face detection error:', error)
    }
    
    return false
  }

  const startFaceDetectionLoop = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }

    let faceMissingCount = 0
    const maxFaceMissingCount = 3 // Allow 3 consecutive misses before considering face lost

    detectionIntervalRef.current = setInterval(async () => {
      // Check if stream is still active
      if (!streamRef.current || !streamRef.current.active) {
        clearInterval(detectionIntervalRef.current!)
        setIsWebcamActive(false)
        setIsFaceDetected(false)
        setConfidence(0)
        setBoundingBox(null)
        return
      }
      
      const faceDetected = await detectFace()
      
      if (faceDetected) {
        if (!isFaceDetected) {
          setIsFaceDetected(true)
          console.log('👤 Face detected')
        }
        faceMissingCount = 0
      } else {
        faceMissingCount++
        
        if (faceMissingCount >= maxFaceMissingCount) {
          if (isFaceDetected) {
            setIsFaceDetected(false)
            setConfidence(0)
            setBoundingBox(null)
            console.log('👤 Face not detected')
          }
        }
      }
    }, 1000) // Check every second
  }

  const startWebcam = async () => {
    try {
      setFaceDetectionError(null)
      
      // Load face detection model first
      const modelLoaded = await loadFaceDetectionModel()
      if (!modelLoaded) {
        setFaceDetectionError('Failed to load face detection models')
        return
      }
      
      // Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      streamRef.current = stream
      
      // Create video element for face detection
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      videoRef.current = video
      
      // Wait for video to be ready
      video.addEventListener('loadedmetadata', () => {
        setIsWebcamActive(true)
        console.log('📷 Webcam started for real-time face detection')
        
        // Start face detection loop
        startFaceDetectionLoop()
      })
      
    } catch (error) {
      console.error('❌ Webcam access denied:', error)
      setFaceDetectionError('Webcam access denied. Please allow camera access for monitoring.')
      setIsWebcamActive(false)
    }
  }

  const stopWebcam = () => {
    // Stop face detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    
    // Stop webcam stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current = null
    }
    
    // Reset state
    setIsWebcamActive(false)
    setIsFaceDetected(false)
    setConfidence(0)
    setBoundingBox(null)
    
    console.log('📷 Webcam stopped')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  return {
    isFaceDetected,
    isWebcamActive,
    confidence,
    boundingBox,
    startWebcam,
    stopWebcam,
    faceDetectionError
  }
}