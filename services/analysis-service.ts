"use client"

import { CourseReport, UserAnalytics, VideoProgressReport } from "./report-service"

export interface ViolationAnalysis {
  severity: "low" | "medium" | "high"
  message: string
  recommendations: string[]
}

export interface VideoInsights {
  videoId: string
  videoTitle: string
  performanceScore: number // 0-100
  statusMessage: string
  status: "on-track" | "at-risk" | "struggling"
  insights: string[]
  violations: ViolationAnalysis[]
  recommendations: string[]
}

export interface CourseInsights {
  courseId: string
  courseName: string
  healthScore: number // 0-100
  status: "excellent" | "good" | "fair" | "poor"
  overallInsights: string[]
  videoInsights: VideoInsights[]
  recommendations: string[]
  estimatedCompletion: string
}

export interface UserInsights {
  overallScore: number // 0-100
  status: "excellent" | "good" | "fair" | "poor"
  strengths: string[]
  challenges: string[]
  recommendations: string[]
  nextSteps: string[]
  motivationalMessage: string
}

export class AnalysisService {
  /**
   * Analyze a single video's performance
   */
  analyzeVideoPerformance(
    video: VideoProgressReport
  ): VideoInsights {
    const violations: ViolationAnalysis[] = []
    const recommendations: string[] = []
    let performanceScore = 100

    // Analyze completion
    if (video.completionPercentage < 50) {
      performanceScore -= 30
      recommendations.push(
        `Watch more of this video. Currently at ${video.completionPercentage}% completion.`
      )
    } else if (video.completionPercentage < 80) {
      performanceScore -= 15
      recommendations.push(
        `Almost there! Complete the remaining ${100 - video.completionPercentage}% of the video.`
      )
    }

    // Analyze tab switches
    if (video.violations.tabSwitches > 5) {
      violations.push({
        severity: "high",
        message: `Excessive tab switching (${video.violations.tabSwitches} times)`,
        recommendations: [
          "Minimize distractions by closing unnecessary tabs",
          "Keep focused on the learning material",
          "Use full-screen mode to reduce temptation to switch tabs"
        ]
      })
      performanceScore -= 15
    } else if (video.violations.tabSwitches > 2) {
      violations.push({
        severity: "medium",
        message: `Moderate tab switching (${video.violations.tabSwitches} times)`,
        recommendations: [
          "Try to minimize tab switching during learning",
          "Focus on the current video content"
        ]
      })
      performanceScore -= 8
    }

    // Analyze face detection
    if (video.violations.faceMissingEvents > 3) {
      violations.push({
        severity: "high",
        message: `Frequent loss of face detection (${video.violations.faceMissingEvents} times)`,
        recommendations: [
          "Ensure proper lighting in your learning area",
          "Position yourself facing the camera",
          "Keep your face within the camera's view"
        ]
      })
      performanceScore -= 15
    } else if (video.violations.faceMissingEvents > 0) {
      violations.push({
        severity: "medium",
        message: `Some face detection issues (${video.violations.faceMissingEvents} times)`,
        recommendations: [
          "Improve camera positioning",
          "Ensure adequate lighting"
        ]
      })
      performanceScore -= 5
    }

    // Analyze auto-pauses
    if (video.violations.autoPauses > 3) {
      violations.push({
        severity: "medium",
        message: `Video auto-paused ${video.violations.autoPauses} times`,
        recommendations: [
          "Minimize distractions to stay engaged",
          "Take intentional breaks instead of causing auto-pauses",
          "Ensure proper face detection setup"
        ]
      })
      performanceScore -= 10
    }

    // Analyze skipping
    if (video.violations.skipCount > 5) {
      violations.push({
        severity: "medium",
        message: `Significant content skipping (${video.violations.skipCount} skips)`,
        recommendations: [
          "Watch the video sequentially for better understanding",
          "Review skipped sections to ensure comprehension"
        ]
      })
      performanceScore -= 10
    }

    // Ensure score is between 0-100
    performanceScore = Math.max(0, Math.min(100, performanceScore))

    // Determine status
    let status: "on-track" | "at-risk" | "struggling"
    if (performanceScore >= 80) {
      status = "on-track"
    } else if (performanceScore >= 60) {
      status = "at-risk"
    } else {
      status = "struggling"
    }

    const statusMessages: { [key: string]: string } = {
      "on-track":
        "Great job! You're making excellent progress on this video.",
      "at-risk":
        "You're doing okay, but there's room for improvement. Address the issues below.",
      struggling:
        "This video needs attention. Focus on the recommendations to improve."
    }

    const insights: string[] = []
    if (video.isCompleted) {
      insights.push("✓ Video completed successfully")
    } else {
      insights.push(
        `○ Video progress: ${video.completionPercentage}% (${this.formatSeconds(
          video.watchTime
        )} watched)`
      )
    }

    if (video.violations.tabSwitches === 0) {
      insights.push("✓ Excellent focus - no tab switches")
    }
    if (video.violations.faceMissingEvents === 0) {
      insights.push("✓ Consistent face detection - perfect setup")
    }
    if (video.violations.autoPauses === 0) {
      insights.push("✓ No auto-pauses - fully engaged")
    }

    return {
      videoId: video.videoId,
      videoTitle: video.videoTitle,
      performanceScore: Math.round(performanceScore),
      statusMessage: statusMessages[status],
      status,
      insights,
      violations,
      recommendations
    }
  }

  /**
   * Analyze course performance
   */
  analyzeCoursePerformance(report: CourseReport): CourseInsights {
    const videoInsights = report.videos.map((video) =>
      this.analyzeVideoPerformance(video)
    )

    // Calculate health score
    const averageVideoScore =
      videoInsights.length > 0
        ? Math.round(
            videoInsights.reduce(
              (sum, v) => sum + v.performanceScore,
              0
            ) / videoInsights.length
          )
        : 0

    const completionBonus =
      report.overallProgress >= 75
        ? 10
        : report.overallProgress >= 50
          ? 5
          : 0

    let healthScore = Math.min(100, averageVideoScore + completionBonus)

    // Determine status
    let status: "excellent" | "good" | "fair" | "poor"
    if (healthScore >= 85) {
      status = "excellent"
    } else if (healthScore >= 70) {
      status = "good"
    } else if (healthScore >= 50) {
      status = "fair"
    } else {
      status = "poor"
    }

    // Generate insights
    const overallInsights: string[] = []
    const recommendations: string[] = []

    if (report.overallProgress === 100) {
      overallInsights.push("🎉 Course completed!")
    } else if (report.overallProgress >= 75) {
      overallInsights.push(
        `You're almost done! ${100 - report.completedVideos} video(s) remaining.`
      )
    } else if (report.overallProgress >= 50) {
      overallInsights.push("Good progress! Keep up the momentum.")
    } else {
      overallInsights.push("You've started the course. Keep moving forward!")
    }

    const atRiskVideos = videoInsights.filter((v) => v.status !== "on-track")
    if (atRiskVideos.length > 0) {
      overallInsights.push(
        `${atRiskVideos.length} video(s) need attention or improvement.`
      )
      recommendations.push(
        `Focus on improving the following videos: ${atRiskVideos.map((v) => v.videoTitle).join(", ")}`
      )
    }

    const avgTabSwitches =
      report.videos.length > 0
        ? Math.round(
            report.videos.reduce(
              (sum, v) => sum + v.violations.tabSwitches,
              0
            ) / report.videos.length
          )
        : 0

    if (avgTabSwitches > 3) {
      recommendations.push("Reduce tab switching to improve focus")
    }

    if (report.totalViolations > report.videos.length * 5) {
      recommendations.push(
        "Address monitoring setup issues (lighting, camera, etc.)"
      )
    }

    // Generate estimated completion date
    let estimatedCompletion = "Unknown"
    if (report.estimatedCompletionDate) {
      const date = new Date(report.estimatedCompletionDate)
      estimatedCompletion = date.toLocaleDateString()
    }

    return {
      courseId: report.courseId,
      courseName: report.courseName,
      healthScore: Math.round(healthScore),
      status,
      overallInsights,
      videoInsights,
      recommendations,
      estimatedCompletion
    }
  }

  /**
   * Analyze user-wide performance
   */
  analyzeUserPerformance(
    analytics: UserAnalytics,
    courseInsights: CourseInsights[]
  ): UserInsights {
    const strengths: string[] = []
    const challenges: string[] = []
    const recommendations: string[] = []
    const nextSteps: string[] = []

    // Calculate overall score
    const courseHealthScores = courseInsights.map((c) => c.healthScore)
    const avgCourseHealth =
      courseHealthScores.length > 0
        ? Math.round(
            courseHealthScores.reduce((a, b) => a + b, 0) /
              courseHealthScores.length
          )
        : 0

    const completionRatio =
      analytics.totalVideos > 0
        ? (analytics.completedVideos / analytics.totalVideos) * 100
        : 0

    const focusBonus = analytics.focusScore >= 80 ? 10 : 0
    const overallScore = Math.min(100, avgCourseHealth + focusBonus)

    // Analyze strengths
    if (analytics.focusScore >= 80) {
      strengths.push("Excellent focus and concentration skills")
    }
    if (completionRatio >= 75) {
      strengths.push("Consistent course completion rate")
    }
    if (analytics.averageTabSwitches <= 2) {
      strengths.push("Minimal distractions during learning")
    }
    if (analytics.averageFaceMissingEvents === 0) {
      strengths.push("Perfect camera setup and positioning")
    }

    // Analyze challenges
    if (analytics.focusScore < 60) {
      challenges.push("Maintaining focus during learning sessions")
    }
    if (completionRatio < 50) {
      challenges.push("Video completion rates need improvement")
    }
    if (analytics.averageTabSwitches > 5) {
      challenges.push("Frequent tab switching causing distractions")
    }
    if (analytics.averageAutoPauses > 2) {
      challenges.push("Video auto-pauses indicate disengagement")
    }

    // Generate recommendations
    if (analytics.focusScore < 70) {
      recommendations.push("Create a dedicated learning environment")
      recommendations.push("Use time-blocking techniques for focused sessions")
    }

    if (completionRatio < 50) {
      recommendations.push("Set daily learning goals")
      recommendations.push("Break larger courses into smaller chunks")
    }

    // Next steps
    nextSteps.push("Review and complete the next pending video")
    if (courseInsights.length > 0) {
      const closestCourse = courseInsights.reduce((prev, current) =>
        prev.healthScore < current.healthScore ? prev : current
      )
      nextSteps.push(
        `Focus on improving progress in "${closestCourse.courseName}"`
      )
    }
    nextSteps.push("Maintain consistent daily learning habits")

    // Motivational message
    const motivationalMessages = [
      "Keep up the great work! You're making progress.",
      "Your dedication to learning is inspiring. Continue!",
      "Every step forward counts. Keep learning!",
      "You're on your way to mastery. Don't stop now!",
      "Great effort! Success is just around the corner."
    ]

    const randomMessage =
      motivationalMessages[
        Math.floor(Math.random() * motivationalMessages.length)
      ]

    // Determine overall status and adjust message
    let motivationalMessage = randomMessage
    if (overallScore < 50) {
      motivationalMessage =
        "Don't give up! Small improvements each day lead to big results."
    } else if (overallScore >= 90) {
      motivationalMessage =
        "Outstanding performance! You're excelling in your learning journey."
    }

    // Add strengths to recommendations if empty
    if (recommendations.length === 0) {
      recommendations.push("Maintain your current excellent learning habits")
    }

    return {
      overallScore: Math.round(overallScore),
      status:
        overallScore >= 85
          ? "excellent"
          : overallScore >= 70
            ? "good"
            : overallScore >= 50
              ? "fair"
              : "poor",
      strengths: strengths.length > 0 ? strengths : ["You're making progress"],
      challenges:
        challenges.length > 0
          ? challenges
          : ["Continue working towards your goals"],
      recommendations,
      nextSteps,
      motivationalMessage
    }
  }

  /**
   * Helper function to format seconds
   */
  private formatSeconds(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }
}

export const analysisService = new AnalysisService()
