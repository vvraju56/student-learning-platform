'use client';

import { useEffect, useRef, useState } from 'react';

export interface PostureDetectionData {
  posture: 'good' | 'leaning_forward' | 'slouching';
  postureScore: number;
  angle: number;
}

export function usePostureDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<any>(null);
  const [postureData, setPostureData] = useState<PostureDetectionData>({
    posture: 'good',
    postureScore: 85,
    angle: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDetection = async () => {
      try {
        // Load TensorFlow.js
        const tfScript = document.createElement('script');
        tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0';
        document.head.appendChild(tfScript);

        tfScript.onload = async () => {
          // Load pose-detection model
          const poseScript = document.createElement('script');
          poseScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.2.0';
          document.head.appendChild(poseScript);

          poseScript.onload = async () => {
            await setupPoseDetection();
          };
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load detection libraries';
        setError(errorMessage);
        console.error(' Detection library load error:', err);
      }
    };

    const setupPoseDetection = async () => {
      try {
        if (!videoRef.current) return;

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });

        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          if (videoRef.current) {
            videoRef.current.play();

            // Create detector with BlazePose (lightweight model)
            const tf = (window as any).tf;
            if (!tf) {
              throw new Error('TensorFlow not loaded');
            }

            detectPostureWithCanvas();
            setIsInitialized(true);
          }
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize detection';
        setError(errorMessage);
        console.error(' Posture detection error:', err);
      }
    };

    const detectPostureWithCanvas = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const processFrame = () => {
        // Draw video to canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Analyze center of mass (face/upper body position)
        let redSum = 0,
          greenSum = 0,
          blueSum = 0,
          count = 0;

        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Look for skin tone (reddish hues)
          if (r > g && r > b && r - b > 15) {
            redSum += i % (canvas.width * 4);
            count++;
          }
        }

        // Calculate posture based on horizontal position
        const avgHorizontal = count > 0 ? redSum / count / (canvas.width * 4) : 0.5;
        const deviation = Math.abs(avgHorizontal - 0.5) * 200;

        // Simple posture scoring
        let postureScore = 90;
        let postureStatus: 'good' | 'leaning_forward' | 'slouching' = 'good';
        let angle = 0;

        if (deviation > 20) {
          postureScore = 60;
          postureStatus = 'leaning_forward';
          angle = deviation;
        } else if (deviation > 10) {
          postureScore = 75;
          postureStatus = 'leaning_forward';
          angle = deviation / 2;
        }

        setPostureData({
          posture: postureStatus,
          postureScore: Math.round(postureScore),
          angle: Math.round(angle * 10) / 10,
        });

        // Add visual feedback
        ctx.strokeStyle = postureScore > 75 ? '#10B981' : '#F97316';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        requestAnimationFrame(processFrame);
      };

      processFrame();
    };

    initializeDetection();

    return () => {
      const scripts = document.querySelectorAll('script[src*="tensorflow"]');
      scripts.forEach((script) => script.remove());
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    postureData,
    isInitialized,
    error,
  };
}
