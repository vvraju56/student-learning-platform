"use client"

import { useState, useCallback } from "react"
import { auth } from "@/lib/firebase"
import { ref, set, get, update } from "firebase/database"

interface ViolationThresholds {
  maxTabSwitch: number
  maxFaceMissing: number
  maxAutoPause: number
  minWatchPercentage: number
  maxSkipPercentage: number
}

interface CompletionResult {
  isCompleted: boolean
  completionPercentage: number
  violations: {
    tabSwitch: number
    faceMissing: number
    autoPause: number
    excessiveSkipping: number
  }
  reasons: string[]
  canRetry: boolean
  retryAfterMinutes?: number
}

interface VideoData {
  courseId: string
  videoId: string
  totalDuration: number
  validWatchTime: number
  skippedSegments: Array<{ start: number; end: number; duration: number }>
  violations: {
    tabSwitch: number
    faceMissing: number
    autoPause: number
  }
}

const DEFAULT_THRESHOLDS: ViolationThresholds = {
  maxTabSwitch: 10,
  maxFaceMissing: 10,
  maxAutoPause: 10,
  minWatchPercentage: 90,
  maxSkipPercentage: 30
}

export function useVideoCompletionLogic(
  thresholds: Partial<ViolationThresholds> = {}
) {
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  const userId = auth.currentUser?.uid

  // Calculate completion status based on all factors
  const calculateCompletion = useCallback(async (
    videoData: VideoData
  ): Promise<CompletionResult> => {
    setIsProcessing(true)
    
    const completionPercentage = Math.round((videoData.validWatchTime / videoData.totalDuration) * 100)
    const skipPercentage = calculateSkipPercentage(videoData.skippedSegments, videoData.totalDuration)
    
    const result: CompletionResult = {
      isCompleted: false,
      completionPercentage,
      violations: {
        ...videoData.violations,
        excessiveSkipping: skipPercentage > finalThresholds.maxSkipPercentage ? 1 : 0
      },
      reasons: [],
      canRetry: true
    }

    // Check each completion requirement
    if (completionPercentage < finalThresholds.minWatchPercentage) {
      result.reasons.push(
        `Must watch at least ${finalThresholds.minWatchPercentage}% of video (${completionPercentage}% watched)`
      )
    }

    if (videoData.violations.tabSwitch > finalThresholds.maxTabSwitch) {
      result.reasons.push(
        `Too many tab switches (${videoData.violations.tabSwitch} > ${finalThresholds.maxTabSwitch})`
      )
    }

    if (videoData.violations.faceMissing > finalThresholds.maxFaceMissing) {
      result.reasons.push(
        `Face not detected too many times (${videoData.violations.faceMissing} > ${finalThresholds.maxFaceMissing})`
      )
    }

    if (videoData.violations.autoPause > finalThresholds.maxAutoPause) {
      result.reasons.push(
        `Too many automatic pauses (${videoData.violations.autoPause} > ${finalThresholds.maxAutoPause})`
      )
    }

    if (skipPercentage > finalThresholds.maxSkipPercentage) {
      result.reasons.push(
        `Excessive video skipping (${skipPercentage}% skipped > ${finalThresholds.maxSkipPercentage}%)`
      )
    }

    // Determine if video is completed
    result.isCompleted = result.reasons.length === 0

    // Set retry restrictions for severe violations
    if (videoData.violations.tabSwitch > 20 || videoData.violations.faceMissing > 20) {
      result.canRetry = false
      result.retryAfterMinutes = 60 // 1 hour cooldown
    } else if (videoData.violations.tabSwitch > 15 || videoData.violations.faceMissing > 15) {
      result.retryAfterMinutes = 30 // 30 minute cooldown
    }

    setCompletionResult(result)
    setIsProcessing(false)
    
    return result
  }, [finalThresholds])

  // Calculate percentage of skipped content
  const calculateSkipPercentage = useCallback((skippedSegments: any[], totalDuration: number): number => {
    if (!skippedSegments || skippedSegments.length === 0) return 0
    
    const totalSkippedTime = skippedSegments.reduce((total, segment) => total + segment.duration, 0)
    return Math.round((totalSkippedTime / totalDuration) * 100)
  }, [])

  // Mark video as completed in Firebase
  const markVideoCompleted = useCallback(async (
    courseId: string,
    videoId: string,
    completionData: CompletionResult
  ): Promise<boolean> => {
    if (!userId || !completionData.isCompleted) return false

    try {
      const videoPath = `users/${userId}/videos/${courseId}_${videoId}`
      const videoRef = ref(window.realtimeDb, videoPath)
      
      // Get current video data
      const snapshot = await get(videoRef)
      const currentData = snapshot.exists() ? snapshot.val() : {}
      
      // Mark as completed with completion details
      await update(videoRef, {
        ...currentData,
        completed: true,
        completedAt: Date.now(),
        completionPercentage: completionData.completionPercentage,
        finalViolations: completionData.violations,
        completionData: {
          ...completionData,
          completedAt: new Date().toISOString()
        }
      })

      console.log('✅ Video marked as completed:', videoId)
      return true
      
    } catch (error) {
      console.error('Error marking video as completed:', error)
      return false
    }
  }, [userId])

  // Track skipped video segments
  const trackSkippedSegment = useCallback((
    fromTime: number,
    toTime: number,
    currentSkippedSegments: Array<{ start: number; end: number; duration: number }> = []
  ) => {
    const skippedSegment = {
      start: fromTime,
      end: toTime,
      duration: toTime - fromTime
    }
    
    return [...currentSkippedSegments, skippedSegment]
  }, [])

  // Check if user is currently on cooldown
  const checkCooldownStatus = useCallback(async (
    courseId: string,
    videoId: string
  ): Promise<{ isOnCooldown: boolean; cooldownEndsAt?: number }> => {
    if (!userId) return { isOnCooldown: false }
    
    try {
      const videoPath = `users/${userId}/videos/${courseId}_${videoId}`
      const videoRef = ref(window.realtimeDb, videoPath)
      const snapshot = await get(videoRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        const lastFailureTime = data.lastFailureAt
        const cooldownMinutes = data.retryAfterMinutes || 0
        
        if (lastFailureTime && cooldownMinutes > 0) {
          const cooldownEndsAt = lastFailureTime + (cooldownMinutes * 60 * 1000)
          const now = Date.now()
          
          if (now < cooldownEndsAt) {
            return {
              isOnCooldown: true,
              cooldownEndsAt
            }
          }
        }
      }
      
      return { isOnCooldown: false }
    } catch (error) {
      console.error('Error checking cooldown status:', error)
      return { isOnCooldown: false }
    }
  }, [userId])

  // Save failed completion attempt (for cooldown tracking)
  const saveFailedAttempt = useCallback(async (
    courseId: string,
    videoId: string,
    completionData: CompletionResult
  ): Promise<void> => {
    if (!userId || completionData.isCompleted) return

    try {
      const videoPath = `users/${userId}/videos/${courseId}_${videoId}`
      const videoRef = ref(window.realtimeDb, videoPath)
      
      await update(videoRef, {
        lastFailureAt: Date.now(),
        retryAfterMinutes: completionData.retryAfterMinutes || 0,
        lastCompletionResult: completionData
      })
      
    } catch (error) {
      console.error('Error saving failed attempt:', error)
    }
  }, [userId])

  // Get completion summary for UI display
  const getCompletionSummary = useCallback((videoData: VideoData): {
    isEligible: boolean
    issues: string[]
    score: number
  } => {
    const completionPercentage = Math.round((videoData.validWatchTime / videoData.totalDuration) * 100)
    const skipPercentage = calculateSkipPercentage(videoData.skippedSegments, videoData.totalDuration)
    
    const issues: string[] = []
    let score = 100
    
    if (completionPercentage < finalThresholds.minWatchPercentage) {
      issues.push(`Watch time: ${completionPercentage}% (need ${finalThresholds.minWatchPercentage}%)`)
      score -= (finalThresholds.minWatchPercentage - completionPercentage)
    }
    
    if (videoData.violations.tabSwitch > finalThresholds.maxTabSwitch) {
      issues.push(`Tab switches: ${videoData.violations.tabSwitch} (max ${finalThresholds.maxTabSwitch})`)
      score -= (videoData.violations.tabSwitch - finalThresholds.maxTabSwitch) * 5
    }
    
    if (videoData.violations.faceMissing > finalThresholds.maxFaceMissing) {
      issues.push(`Face missing: ${videoData.violations.faceMissing} (max ${finalThresholds.maxFaceMissing})`)
      score -= (videoData.violations.faceMissing - finalThresholds.maxFaceMissing) * 3
    }
    
    if (videoData.violations.autoPause > finalThresholds.maxAutoPause) {
      issues.push(`Auto-pauses: ${videoData.violations.autoPause} (max ${finalThresholds.maxAutoPause})`)
      score -= (videoData.violations.autoPause - finalThresholds.maxAutoPause) * 2
    }
    
    if (skipPercentage > finalThresholds.maxSkipPercentage) {
      issues.push(`Skipping: ${skipPercentage}% (max ${finalThresholds.maxSkipPercentage}%)`)
      score -= (skipPercentage - finalThresholds.maxSkipPercentage)
    }
    
    return {
      isEligible: issues.length === 0,
      issues,
      score: Math.max(0, Math.min(100, score))
    }
  }, [finalThresholds, calculateSkipPercentage])

  return {
    completionResult,
    isProcessing,
    calculateCompletion,
    markVideoCompleted,
    trackSkippedSegment,
    checkCooldownStatus,
    saveFailedAttempt,
    getCompletionSummary
  }
}