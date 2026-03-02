"use client"

import { ref, set, get, ref as dbRef, remove } from 'firebase/database'
import { realtimeDb } from './firebase'

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
    if (!userId) {
      console.error('ProgressStorage: userId is required!')
      return ''
    }
    return `video_progress_${courseId}_${userId}_${videoId}`
  }

  private static getCourseProgressKey(userId: string, courseId: string): string {
    if (!userId) {
      console.error('ProgressStorage: userId is required!')
      return ''
    }
    return `course_progress_${courseId}_${userId}`
  }

  private static getSessionTimeKey(userId: string, courseId: string, videoId: string): string {
    if (!userId) {
      console.error('ProgressStorage: userId is required!')
      return ''
    }
    return `sessionTime_${courseId}_${userId}_${videoId}`
  }

  static saveVideoProgress(userId: string, courseId: string, videoId: string, data: Partial<VideoProgressData>) {
    if (typeof window === 'undefined' || !userId) {
      console.warn('ProgressStorage: Cannot save - no userId')
      return
    }

    const key = this.getVideoProgressKey(userId, courseId, videoId)
    if (!key) return

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
    if (typeof window === 'undefined' || !userId) return null

    const key = this.getVideoProgressKey(userId, courseId, videoId)
    if (!key) return null

    const data = localStorage.getItem(key)
    
    if (!data) return null
    
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing video progress from localStorage:', error)
      return null
    }
  }

  static saveCourseProgress(userId: string, courseId: string, data: any) {
    if (typeof window === 'undefined' || !userId) {
      console.warn('ProgressStorage: Cannot save course progress - no userId')
      return
    }
    const key = this.getCourseProgressKey(userId, courseId)
    if (!key) return
    
    localStorage.setItem(key, JSON.stringify(data))
  }

  static getRawCourseProgress(userId: string, courseId: string): any | null {
    if (typeof window === 'undefined' || !userId) {
      console.warn('ProgressStorage: Cannot get course progress - no userId')
      return null
    }
    const key = this.getCourseProgressKey(userId, courseId)
    if (!key) return null
    
    const data = localStorage.getItem(key)
    if (!data) return null
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing course progress:', error)
      return null
    }
  }

  static saveSessionTime(userId: string, courseId: string, videoId: string, time: number) {
    if (typeof window === 'undefined' || !userId) return
    const key = this.getSessionTimeKey(userId, courseId, videoId)
    if (!key) return
    localStorage.setItem(key, time.toString())
  }

  static getSessionTime(userId: string, courseId: string, videoId: string): number {
    if (typeof window === 'undefined' || !userId) return 0
    const key = this.getSessionTimeKey(userId, courseId, videoId)
    if (!key) return 0
    const data = localStorage.getItem(key)
    return data ? parseInt(data, 10) || 0 : 0
  }

  static deleteSessionTime(userId: string, courseId: string, videoId: string) {
    if (typeof window === 'undefined' || !userId) return
    const key = this.getSessionTimeKey(userId, courseId, videoId)
    if (!key) return
    localStorage.removeItem(key)
  }

  static clearAllProgress(userId: string) {
    if (typeof window === 'undefined' || !userId) return
    
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes(`_${userId}_`)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log('Cleared progress key:', key)
    })
  }

  static clearOldSharedProgress() {
    if (typeof window === 'undefined') return
    
    console.log('Checking for old shared progress data...')
    
    const oldKeys: string[] = []
    const courseIds = ['web-development', 'app-development', 'game-development']
    
    for (const courseId of courseIds) {
      const oldKey = `course_progress_${courseId}`
      if (localStorage.getItem(oldKey)) {
        oldKeys.push(oldKey)
      }
    }
    
    if (oldKeys.length > 0) {
      console.log('Found old shared progress data:', oldKeys)
      oldKeys.forEach(key => {
        localStorage.removeItem(key)
        console.log('Removed old shared key:', key)
      })
      console.log('Old shared progress data cleared!')
    } else {
      console.log('No old shared progress data found')
    }
  }
}
