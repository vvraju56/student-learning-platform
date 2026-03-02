"use client"

import { useEffect, useRef } from "react"
import { auth } from "@/lib/firebase"
import { saveAlertToFirebase } from "@/lib/firebase"

interface TabVisibilityTrackerProps {
  onTabSwitch?: () => void
  maxWarnings?: number
  userId?: string
  courseId?: string
  videoId?: string
}

export function TabVisibilityTracker({ 
  onTabSwitch, 
  maxWarnings = 3,
  userId,
  courseId,
  videoId
}: TabVisibilityTrackerProps) {
  const warningCount = useRef(0)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        warningCount.current += 1

        // Save tab switch alert to Firebase
        if (auth.currentUser && userId) {
          saveAlertToFirebase(userId, {
            type: "tab_switch_detected",
            message: `Tab switched - Warning ${warningCount.current}/${maxWarnings}`,
            courseId: courseId || '',
            videoId: videoId || ''
          }).catch(error => console.error("Error saving tab switch alert to Firebase:", error))
        }

        toast({
          title: "Warning: Tab Switch Detected",
          description: `You switched tabs (${warningCount.current}/${maxWarnings}). Repeated violations may affect your score.`,
          variant: "destructive",
        })

        onTabSwitch?.()

        if (warningCount.current >= maxWarnings) {
          // Log maximum warnings reached to Firebase
          if (auth.currentUser && userId) {
            saveAlertToFirebase(userId, {
              type: "max_warnings_reached",
              message: `Maximum tab switch warnings reached (${maxWarnings}). Activity logged.`,
              courseId: courseId || '',
              videoId: videoId || ''
            }).catch(error => console.error("Error saving max warnings alert to Firebase:", error))
          }

        console.warn(`Tab Switch Detected: ${warningCount.current}/${maxWarnings}`)
        alert(`Warning: You switched tabs (${warningCount.current}/${maxWarnings}). Repeated violations may affect your score.`)

        onTabSwitch?.()

        if (warningCount.current >= maxWarnings) {
          alert("Maximum Warnings Reached: Your activity has been logged. Please stay on this tab.")
        }
      } else {
        // Tab is visible again - log focus restored
        if (auth.currentUser && userId && warningCount.current > 0) {
          saveAlertToFirebase(userId, {
            type: "tab_focus_restored",
            message: "User returned to tab - focus restored",
            courseId: courseId || '',
            videoId: videoId || ''
          }).catch(error => console.error("Error saving focus restored alert to Firebase:", error))
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [onTabSwitch, maxWarnings, userId, courseId, videoId])

  return null
}
