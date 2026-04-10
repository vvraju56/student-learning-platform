import { useRef, useState, useCallback, useEffect } from "react";
import {
  FilesetResolver,
  FaceLandmarker,
} from "@mediapipe/tasks-vision";
import {
  getEyeLandmarks,
  calculateGazeRatio,
  calculateVerticalGazeRatio,
  getCombinedGazePosition,
} from "../utils/eyeTracker";
import type { EyeData } from "../utils/eyeTracker";
import { calculateEyeAspectRatio } from "../utils/blinkDetector";
import type { BlinkData } from "../utils/blinkDetector";
import { estimateHeadPose } from "../utils/headPose";
import type { HeadPoseData } from "../utils/headPose";

export interface TrackingState {
  isRunning: boolean;
  isFocusedNow: boolean;
  isDistracted: boolean;
  distractionReason: string;
  fps: number;
  eyeData: EyeData | null;
  blinkData: BlinkData | null;
  headPoseData: HeadPoseData | null;
  gazePosition: { x: number; y: number } | null;
  showLandmarks: boolean;
  isCalibrated: boolean;
}

const INITIAL_STATE: TrackingState = {
  isRunning: false,
  isFocusedNow: false,
  isDistracted: false,
  distractionReason: "",
  fps: 0,
  eyeData: null,
  blinkData: null,
  headPoseData: null,
  gazePosition: null,
  showLandmarks: true,
  isCalibrated: false,
};

const DISTRACTION_THRESHOLD = 1.0;
const H_GAZE_ONSCREEN_MIN = 0.32;
const H_GAZE_ONSCREEN_MAX = 0.68;
const V_GAZE_ONSCREEN_MIN = 0.25;
const V_GAZE_ONSCREEN_MAX = 0.75;
const EYE_OPEN_THRESHOLD = 0.15;
const MAX_HEAD_YAW = 22;
const MAX_HEAD_PITCH = 20;

export function useEyeTracker() {
  const [state, setState] = useState<TrackingState>(INITIAL_STATE);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);
  const distractionTimerRef = useRef<number>(0);

  const initFaceLandmarker = useCallback(async () => {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
    });
    faceLandmarkerRef.current = faceLandmarker;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      console.log("Requesting camera access...");
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("All devices:", devices.map(d => ({ 
        kind: d.kind, 
        label: d.label || 'no-label',
        deviceId: d.deviceId.substring(0, 20) + '...'
      })));
      
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      console.log(`Video devices found: ${videoDevices.length}`);
      
      if (videoDevices.length === 0) {
        throw new Error("No camera detected");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30 }
        }
      });
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!faceLandmarkerRef.current) {
        await initFaceLandmarker();
      }

      setState((prev) => ({
        ...prev,
        isRunning: true,
        isFocusedNow: false,
        isDistracted: false,
        distractionReason: "",
        fps: 0,
      }));
      fpsTimeRef.current = Date.now();
      frameCountRef.current = 0;

      processFrame();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed to start camera: ${errorMessage}`);
      throw err;
    }
  }, [initFaceLandmarker]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setState((prev) => ({
      ...prev,
      isRunning: false,
      isFocusedNow: false,
      isDistracted: false,
      distractionReason: "",
    }));
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceLandmarker = faceLandmarkerRef.current;

    if (!video || !canvas || !faceLandmarker || video.paused || video.ended) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    const timestamp = Date.now();
    const results = faceLandmarker.detectForVideo(video, timestamp);

    let isFocused = false;
    let reason = "NO FACE";
    let earDataForDisplay = { leftEar: 0, rightEar: 0, avgEar: 0 };
    let avgHGazeRatio = 0.5;
    let avgVGazeRatio = 0.5;
    let hOnScreen = false;
    let vOnScreen = false;
    let onScreen = false;
    let euler = null;
    let centered = false;
    let eyesOpen = false;
    let eyeData: EyeData | null = null;
    let gazePosition: { x: number; y: number } | null = null;
    let earData = { leftEar: 0, rightEar: 0, avgEar: 0 };
    let landmarks = null;
    let headPoseData: HeadPoseData | null = null;

    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      landmarks = results.faceLandmarks[0];

      eyeData = getEyeLandmarks(landmarks, width, height);
      earData = calculateEyeAspectRatio(landmarks, width, height);
      headPoseData = estimateHeadPose(landmarks, width, height);
      gazePosition = getCombinedGazePosition(eyeData);

      earDataForDisplay = earData;

      const leftGazeRatio = calculateGazeRatio(
        eyeData.leftEye,
        eyeData.leftIris
      );
      const rightGazeRatio = calculateGazeRatio(
        eyeData.rightEye,
        eyeData.rightIris
      );
      avgHGazeRatio = (leftGazeRatio + rightGazeRatio) / 2;

      const leftVGazeRatio = calculateVerticalGazeRatio(
        eyeData.leftEye,
        eyeData.leftIris
      );
      const rightVGazeRatio = calculateVerticalGazeRatio(
        eyeData.rightEye,
        eyeData.rightIris
      );
      avgVGazeRatio = (leftVGazeRatio + rightVGazeRatio) / 2;

      // Gaze detection - note: camera sees mirror image
      // Looking LEFT (screen left) = iris moves RIGHT in video = HIGHER ratio
      // Looking RIGHT (screen right) = iris moves LEFT in video = LOWER ratio
      hOnScreen =
        avgHGazeRatio > H_GAZE_ONSCREEN_MIN && avgHGazeRatio < H_GAZE_ONSCREEN_MAX;
      vOnScreen =
        avgVGazeRatio > V_GAZE_ONSCREEN_MIN && avgVGazeRatio < V_GAZE_ONSCREEN_MAX;
      onScreen = hOnScreen && vOnScreen;

      euler = headPoseData.eulerAngles;
      centered = euler
        ? Math.abs(euler.yaw) < MAX_HEAD_YAW && Math.abs(euler.pitch) < MAX_HEAD_PITCH
        : false;

      eyesOpen = earData.avgEar >= EYE_OPEN_THRESHOLD;

      isFocused = onScreen && centered && eyesOpen;

      if (!onScreen) reason = "LOOKING AWAY";
      else if (!centered) reason = "HEAD TURNED";
      else if (!eyesOpen) reason = "EYES CLOSED";

      if (state.showLandmarks) {
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 1;

        eyeData.leftEye.forEach((point, i) => {
          const tx = width - point.x;
          const ty = point.y;
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        });
        ctx.closePath();
        ctx.stroke();

        eyeData.rightEye.forEach((point, i) => {
          const tx = width - point.x;
          const ty = point.y;
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        });
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(width - eyeData.leftIris.x, eyeData.leftIris.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(width - eyeData.rightIris.x, eyeData.rightIris.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      const blinkData: BlinkData = {
        leftEar: earData.leftEar,
        rightEar: earData.rightEar,
        avgEar: earData.avgEar,
        blinkDetected: false,
        blinkCount: 0,
        leftBlink: false,
        rightBlink: false,
        bothBlink: false,
        eyesClosed: !eyesOpen,
      };

      setState((prev) => ({
        ...prev,
        eyeData,
        blinkData,
        headPoseData,
        gazePosition,
      }));
    }

    if (!isFocused) {
      if (distractionTimerRef.current === 0) {
        distractionTimerRef.current = Date.now();
      }

      if (Date.now() - distractionTimerRef.current > DISTRACTION_THRESHOLD * 1000) {
        setState((prev) => ({
          ...prev,
          isFocusedNow: false,
          isDistracted: true,
          distractionReason: reason,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isFocusedNow: false,
        }));
      }
    } else {
      distractionTimerRef.current = 0;
      setState((prev) => ({
        ...prev,
        isFocusedNow: true,
        isDistracted: false,
        distractionReason: "",
      }));
    }

    const eyeStatus = earDataForDisplay.avgEar >= EYE_OPEN_THRESHOLD ? "OPEN" : "CLOSED";
    const eyeStatusColor = earDataForDisplay.avgEar >= EYE_OPEN_THRESHOLD ? "#00FF00" : "#FF0000";
    
    ctx.fillStyle = eyeStatusColor;
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`EYES: ${eyeStatus} (EAR: ${earDataForDisplay.avgEar.toFixed(3)})`, 20, 80);

    // Gaze direction display - inverted due to canvas flip
    // Higher ratio = looking LEFT, Lower ratio = looking RIGHT
    const gazeDir = avgHGazeRatio > 0.55 ? "LEFT" : avgHGazeRatio < 0.45 ? "RIGHT" : "CENTER";
    ctx.fillStyle = "#FFFF00";
    ctx.font = "bold 16px Arial";
    ctx.fillText(`Gaze: ${gazeDir} (H:${avgHGazeRatio.toFixed(2)} V:${avgVGazeRatio.toFixed(2)})`, 20, 105);

    if (state.isDistracted) {
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, width, height);

      ctx.fillStyle = "#FF0000";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("DISTRACTED!", width / 2, height / 2);

      ctx.font = "24px Arial";
      ctx.fillText(`Reason: ${state.distractionReason}`, width / 2, height / 2 + 40);
    } else if (!isFocused) {
      ctx.fillStyle = "#FFA500";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "left";
      ctx.fillText("LOOKING AWAY", 20, 40);
    } else {
      ctx.fillStyle = "#00FF00";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "left";
      ctx.fillText("FOCUSED", 20, 40);
    }

    frameCountRef.current++;
    const now = Date.now();
    if (now - fpsTimeRef.current >= 1000) {
      setState((prev) => ({
        ...prev,
        fps: frameCountRef.current,
      }));
      frameCountRef.current = 0;
      fpsTimeRef.current = now;
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [state.showLandmarks, state.isCalibrated, state.isDistracted, state.distractionReason]);

  useEffect(() => {
    if (state.isRunning) {
      processFrame();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isRunning, processFrame]);

  const toggleLandmarks = useCallback(() => {
    setState((prev) => ({ ...prev, showLandmarks: !prev.showLandmarks }));
  }, []);

  const resetCalibration = useCallback(() => {
    setState((prev) => ({ ...prev, isCalibrated: false }));
  }, []);

  return {
    state,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    toggleLandmarks,
    resetCalibration,
  };
}
