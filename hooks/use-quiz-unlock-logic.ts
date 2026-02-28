"use client"

import { useState, useCallback, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { firebaseProgressService, UserCourseData } from "@/services/firebase-progress-service"
import { ref, get } from "firebase/database"

interface QuizUnlockValidation {
  isUnlocked: boolean
  isValid: boolean
  reasons: string[]
  canRetry: boolean
  retryAfterMinutes?: number
  cooldownEndsAt?: number
}

interface QuizRequirements {
  courseCompleted: boolean
  allVideosCompleted: boolean
  validVideoProgress: boolean
  noExcessiveViolations: boolean
  notOnCooldown: boolean
}

export function useQuizUnlockLogic() {
  const [validationStatus, setValidationStatus] = useState<{ [courseId: string]: QuizUnlockValidation }>({})
  const [isValidating, setIsValidating] = useState<{ [courseId: string]: boolean }>({})
  const userId = auth.currentUser?.uid

  // Check if user can access quiz for a specific course
  const validateQuizAccess = useCallback(async (courseId: string): Promise<QuizUnlockValidation> => {
    if (!userId) {
      return {
        isUnlocked: false,
        isValid: false,
        reasons: ['User not authenticated'],
        canRetry: false
      }
    }

    setIsValidating(prev => ({ ...prev, [courseId]: true }))

    try {
      const courseProgress = await firebaseProgressService.getCourseProgress(courseId)
      const validation = await performQuizValidation(courseId, courseProgress)
      
      setValidationStatus(prev => ({ ...prev, [courseId]: validation }))
      
      return validation
    } catch (error) {
      console.error('Error validating quiz access:', error)
      const errorValidation: QuizUnlockValidation = {
        isUnlocked: false,
        isValid: false,
        reasons: ['Validation failed due to error'],
        canRetry: true
      }
      
      setValidationStatus(prev => ({ ...prev, [courseId]: errorValidation }))
      return errorValidation
    } finally {
      setIsValidating(prev => ({ ...prev, [courseId]: false }))
    }
  }, [userId])

  // Perform comprehensive quiz validation
  const performQuizValidation = async (courseId: string, courseData: UserCourseData | null): Promise<QuizUnlockValidation> => {
    const requirements: QuizRequirements = {
      courseCompleted: false,
      allVideosCompleted: false,
      validVideoProgress: false,
      noExcessiveViolations: false,
      notOnCooldown: false
    }

    const reasons: string[] = []

    // 1. Check if course data exists
    if (!courseData) {
      reasons.push('Course progress data not found')
      return {
        isUnlocked: false,
        isValid: false,
        reasons,
        canRetry: true
      }
    }

    // 2. Check if quiz is unlocked (all videos completed)
    requirements.allVideosCompleted = courseData.completedVideos === courseData.totalVideos && courseData.totalVideos > 0
    if (!requirements.allVideosCompleted) {
      reasons.push(`Complete all videos first: ${courseData.completedVideos}/${courseData.totalVideos} completed`)
    }

    // 3. Check if course is marked as having quiz unlocked
    const isQuizUnlocked = courseData.quizUnlocked
    if (!isQuizUnlocked) {
      reasons.push('Quiz not unlocked - complete all course videos')
    }

    // 4. Validate video completion quality
    const videoValidation = await validateVideoCompletionQuality(courseId)
    requirements.validVideoProgress = videoValidation.isValid
    if (!videoValidation.isValid) {
      reasons.push(...videoValidation.reasons)
    }

    // 5. Check for cooldown period
    const cooldownStatus = await checkQuizCooldown(courseId)
    requirements.notOnCooldown = !cooldownStatus.isOnCooldown
    if (cooldownStatus.isOnCooldown) {
      const remainingMinutes = Math.ceil((cooldownStatus.cooldownEndsAt! - Date.now()) / (60 * 1000))
      reasons.push(`Quiz access locked for ${remainingMinutes} minutes due to previous violations`)
    }

    // Determine if quiz is unlocked and valid
    const isUnlocked = isQuizUnlocked && requirements.allVideosCompleted
    const isValid = isUnlocked && requirements.validVideoProgress && requirements.notOnCooldown

    // Check if user can retry
    const canRetry = requirements.validVideoProgress && requirements.notOnCooldown && !isQuizUnlocked

    return {
      isUnlocked,
      isValid,
      reasons,
      canRetry,
      retryAfterMinutes: cooldownStatus.retryAfterMinutes,
      cooldownEndsAt: cooldownStatus.cooldownEndsAt
    }
  }

  // Validate video completion quality
  const validateVideoCompletionQuality = async (courseId: string): Promise<{ isValid: boolean; reasons: string[] }> => {
    if (!userId) return { isValid: false, reasons: ['User not authenticated'] }

    try {
      const videosRef = ref(window.realtimeDb, `users/${userId}/videos`)
      const snapshot = await get(videosRef)
      
      if (!snapshot.exists()) {
        return { isValid: false, reasons: ['No video progress data found'] }
      }

      const videos = snapshot.val()
      const courseVideos = Object.values(videos).filter((video: any) => video.courseId === courseId)
      
      let validCompletions = 0
      let totalVideos = courseVideos.length
      const reasons: string[] = []

      courseVideos.forEach((video: any) => {
        if (video.completed) {
          // Check completion quality
          const hasValidWatchTime = (video.validWatchTime / video.totalDuration) >= 0.9
          const hasAcceptableViolations = 
            (video.violations?.tabSwitch || 0) <= 10 &&
            (video.violations?.faceMissing || 0) <= 10 &&
            (video.violations?.autoPause || 0) <= 10

          if (hasValidWatchTime && hasAcceptableViolations) {
            validCompletions++
          } else {
            reasons.push(`Video ${video.videoId} completion has violations`)
          }
        } else {
          reasons.push(`Video ${video.videoId} not completed`)
        }
      })

      const isValid = validCompletions === totalVideos && totalVideos > 0
      
      if (!isValid) {
        reasons.unshift(`${validCompletions}/${totalVideos} videos properly completed`)
      }

      return { isValid, reasons }
    } catch (error) {
      console.error('Error validating video completion quality:', error)
      return { isValid: false, reasons: ['Failed to validate video completion'] }
    }
  }

  // Check if user is on cooldown for quiz access
  const checkQuizCooldown = async (courseId: string): Promise<{ 
    isOnCooldown: boolean; 
    cooldownEndsAt?: number; 
    retryAfterMinutes?: number 
  }> => {
    if (!userId) return { isOnCooldown: false }

    try {
      const cooldownRef = ref(window.realtimeDb, `users/${userId}/quizCooldown/${courseId}`)
      const snapshot = await get(cooldownRef)
      
      if (snapshot.exists()) {
        const cooldownData = snapshot.val()
        const cooldownEndsAt = cooldownData.endsAt || 0
        const retryAfterMinutes = cooldownData.retryAfterMinutes || 0
        const now = Date.now()
        
        if (now < cooldownEndsAt) {
          return {
            isOnCooldown: true,
            cooldownEndsAt,
            retryAfterMinutes
          }
        }
      }
      
      return { isOnCooldown: false }
    } catch (error) {
      console.error('Error checking cooldown:', error)
      return { isOnCooldown: false }
    }
  }

  // Set quiz cooldown for violations
  const setQuizCooldown = async (courseId: string, minutes: number, reason: string): Promise<boolean> => {
    if (!userId) return false

    try {
      const cooldownRef = ref(window.realtimeDb, `users/${userId}/quizCooldown/${courseId}`)
      const cooldownData = {
        endsAt: Date.now() + (minutes * 60 * 1000),
        retryAfterMinutes: minutes,
        reason,
        setAt: Date.now()
      }
      
      await set(cooldownRef, cooldownData)
      
      // Update validation status
      await validateQuizAccess(courseId)
      
      console.log(`⏰ Quiz cooldown set for ${courseId}: ${minutes} minutes`)
      return true
    } catch (error) {
      console.error('Error setting quiz cooldown:', error)
      return false
    }
  }

  // Unlock quiz after successful video completion
  const unlockQuizForCourse = async (courseId: string): Promise<boolean> => {
    if (!userId) return false

    try {
      // First validate that all videos are properly completed
      const validation = await validateQuizAccess(courseId)
      
      if (!validation.isValid) {
        console.warn('Cannot unlock quiz - validation failed:', validation.reasons)
        return false
      }

      // Update course data to unlock quiz
      const success = await firebaseProgressService.updateCourseProgress(courseId)
      
      if (success) {
        // Update validation status
        await validateQuizAccess(courseId)
        
        // Log quiz unlock
        const unlockLog = {
          courseId,
          unlockedAt: Date.now(),
          unlockedBy: 'video_completion'
        }
        
        console.log('🔓 Quiz unlocked for course:', courseId)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error unlocking quiz:', error)
      return false
    }
  }

  // Check if user can start quiz
  const canStartQuiz = useCallback(async (courseId: string): Promise<{ 
    canStart: boolean; 
    reasons: string[]; 
    requiresAuth?: boolean 
  }> => {
    if (!userId) {
      return { 
        canStart: false, 
        reasons: ['Authentication required'], 
        requiresAuth: true 
      }
    }

    const validation = await validateQuizAccess(courseId)
    
    return {
      canStart: validation.isValid,
      reasons: validation.reasons
    }
  }, [userId, validateQuizAccess])

  // Get quiz access summary for UI
  const getQuizAccessSummary = useCallback((courseId: string) => {
    const validation = validationStatus[courseId]
    const isLoading = isValidating[courseId]

    if (!validation) {
      return {
        status: 'checking' as const,
        message: 'Checking quiz access...',
        canStart: false,
        isLocked: true
      }
    }

    if (isLoading) {
      return {
        status: 'checking' as const,
        message: 'Validating...',
        canStart: false,
        isLocked: true
      }
    }

    if (validation.isValid) {
      return {
        status: 'available' as const,
        message: 'Quiz available - Start now!',
        canStart: true,
        isLocked: false
      }
    }

    if (validation.isUnlocked) {
      return {
        status: 'restricted' as const,
        message: 'Quiz unlocked but access restricted',
        details: validation.reasons.join(', '),
        canStart: false,
        isLocked: true,
        cooldownEndsAt: validation.cooldownEndsAt
      }
    }

    return {
      status: 'locked' as const,
      message: 'Complete all course videos to unlock quiz',
      details: validation.reasons.join(', '),
      canStart: false,
      isLocked: true
    }
  }, [validationStatus, isValidating])

  // Preload validation for all courses
  const preloadAllValidations = useCallback(async (courseIds: string[]) => {
    const validations = await Promise.all(
      courseIds.map(courseId => validateQuizAccess(courseId))
    )
    
    console.log('📋 All quiz validations preloaded')
  }, [validateQuizAccess])

  return {
    validationStatus,
    isValidating,
    validateQuizAccess,
    unlockQuizForCourse,
    setQuizCooldown,
    canStartQuiz,
    getQuizAccessSummary,
    preloadAllValidations
  }
}