"use client"

import { useEyeMonitoring } from "./use-eye-monitoring"
import { useRef } from "react"

export function useVideoMonitoring(rules: any = {}) {
  const videoIframeRef = useRef<HTMLIFrameElement>(null)
  const { states, violations, validWatchTime, startMonitoring, stopMonitoring, pauseVideo, resumeVideo } = useEyeMonitoring(videoIframeRef)

  return {
    monitoringState: {
      isActive: states.monitoringActive,
      cameraEnabled: states.cameraActive,
      faceDetected: states.faceDetected && states.isFocusedNow,
      tabActive: states.tabVisible,
      violations: {
        tabSwitch: violations.tabSwitchCount,
        faceMissing: violations.faceMissingCount,
        autoPause: violations.autoPauseCount
      }
    },
    isMonitoringValid: states.isFocusedNow && states.tabVisible,
    startMonitoring,
    stopMonitoring,
    trackAutoPause: () => {}, // Handled automatically by useEyeMonitoring
    canCompleteVideo: () => !violations.videoInvalidated,
    getViolationSummary: () => ({
      ...violations,
      withinLimits: !violations.videoInvalidated
    }),
    monitoringRules: rules,
    validWatchTime
  }
}
