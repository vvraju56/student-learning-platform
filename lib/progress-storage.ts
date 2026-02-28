"use client"

interface VideoProgressData {
  videoId: string
  videoTitle?: string
  courseId: string
  lastWatchedTime: number
  lastPosition: number
  totalDuration: number
  completed: boolean
  validWatchTime: number
  thumbnail?: string
  watchDate: string
  videoIndex?: number
  moduleNumber?: number
}

export class ProgressStorage {
  private static getVideoProgressKey(userId: string, courseId: string, videoId: string): string {
    return `video_progress_${courseId}_${userId}_${videoId}`
  }

  static saveVideoProgress(userId: string, courseId: string, videoId: string, data: Partial<VideoProgressData>) {
    if (typeof window === 'undefined') return

    const key = this.getVideoProgressKey(userId, courseId, videoId)
    const existingData = this.getVideoProgress(userId, courseId, videoId)
    
    const updatedData: VideoProgressData = {
      ...existingData,
      ...data,
      videoId,
      courseId,
      watchDate: new Date().toISOString(),
      lastWatchedTime: Date.now()
    }

    localStorage.setItem(key, JSON.stringify(updatedData))
    console.log('Progress saved to localStorage:', key, updatedData)
  }

  static getVideoProgress(userId: string, courseId: string, videoId: string): VideoProgressData | null {
    if (typeof window === 'undefined') return null

    const key = this.getVideoProgressKey(userId, courseId, videoId)
    const data = localStorage.getItem(key)
    
    if (!data) return null
    
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing video progress from localStorage:', error)
      return null
    }
  }

  static getAllVideoProgress(userId: string): Array<VideoProgressData & { courseId: string }> {
    if (typeof window === 'undefined') return []

    const progressData: Array<VideoProgressData & { courseId: string }> = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('video_progress_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          
          const keyParts = key.split('_')
          if (keyParts.length >= 5 && keyParts[3] === userId) {
            progressData.push({
              ...data,
              courseId: keyParts[2]
            })
          }
        } catch (error) {
          console.error('Error parsing progress data from localStorage:', error)
        }
      }
    }
    
    return progressData
  }

  static getCourseProgress(userId: string, courseId: string): {
    totalVideos: number
    completedVideos: number
    totalWatchTime: number
    recentVideos: VideoProgressData[]
    overallProgress: number
  } {
    const allProgress = this.getAllVideoProgress(userId)
    const courseProgress = allProgress.filter(p => p.courseId === courseId)
    
    const completedVideos = courseProgress.filter(p => p.completed).length
    const totalWatchTime = courseProgress.reduce((sum, p) => sum + (p.validWatchTime || 0), 0)
    const recentVideos = courseProgress
      .sort((a, b) => new Date(b.lastWatchedTime).getTime() - new Date(a.lastWatchedTime).getTime())
      .slice(0, 10)
    
    // Calculate overall progress based on completed videos and partial progress
    let totalProgress = 0
    courseProgress.forEach(video => {
      if (video.completed) {
        totalProgress += 100
      } else if (video.totalDuration > 0) {
        const partialProgress = (video.validWatchTime || 0) / video.totalDuration * 100
        totalProgress += Math.min(partialProgress, 99) // Cap at 99% for incomplete videos
      }
    })
    
    const overallProgress = courseProgress.length > 0 ? Math.round(totalProgress / courseProgress.length) : 0

    return {
      totalVideos: courseProgress.length,
      completedVideos,
      totalWatchTime,
      recentVideos,
      overallProgress
    }
  }

  static getContinueLearningData(userId: string): {
    mostRecentCourse: string | null
    mostRecentVideo: VideoProgressData | null
    inProgressVideos: VideoProgressData[]
    recentVideos: VideoProgressData[]
  } {
    const allProgress = this.getAllVideoProgress(userId)
    
    const sortedByTime = allProgress.sort((a, b) => 
      new Date(b.lastWatchedTime).getTime() - new Date(a.lastWatchedTime).getTime()
    )
    
    const inProgressVideos = allProgress.filter(p => !p.completed)
    const recentVideos = sortedByTime.slice(0, 6)
    
    const mostRecentVideo = sortedByTime[0] || null
    const mostRecentCourse = mostRecentVideo?.courseId || null

    return {
      mostRecentCourse,
      mostRecentVideo,
      inProgressVideos,
      recentVideos
    }
  }

  static deleteVideoProgress(userId: string, courseId: string, videoId: string) {
    if (typeof window === 'undefined') return

    const key = this.getVideoProgressKey(userId, courseId, videoId)
    localStorage.removeItem(key)
  }

  static clearAllProgress(userId: string) {
    if (typeof window === 'undefined') return

    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('video_progress_') && key.includes(`_${userId}_`)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`Cleared ${keysToRemove.length} progress entries for user ${userId}`)
  }

  // Debug function to view all stored progress
  static debugStorage(userId: string) {
    if (typeof window === 'undefined') return

    console.log('=== localStorage Debug for User:', userId, '===')
    
    const allProgress = this.getAllVideoProgress(userId)
    console.log('Total video progress entries:', allProgress.length)
    
    const byCourse: Record<string, VideoProgressData[]> = {}
    allProgress.forEach(progress => {
      if (!byCourse[progress.courseId]) {
        byCourse[progress.courseId] = []
      }
      byCourse[progress.courseId].push(progress)
    })
    
    Object.entries(byCourse).forEach(([courseId, videos]) => {
      const completed = videos.filter(v => v.completed).length
      console.log(`Course ${courseId}: ${videos.length} videos, ${completed} completed`)
      videos.forEach(video => {
        console.log(`  - ${video.videoId}: ${video.completed ? '✅' : '⏳'} ${Math.round((video.validWatchTime || 0) / video.totalDuration * 100)}%`)
      })
    })
    
    const continueData = this.getContinueLearningData(userId)
    console.log('Continue Learning Data:', continueData)
  }
}