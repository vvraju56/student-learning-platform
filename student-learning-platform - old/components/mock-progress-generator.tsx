"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProgressStorage } from '@/lib/progress-storage'

interface MockProgressGeneratorProps {
  userId: string
}

export function MockProgressGenerator({ userId }: MockProgressGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateMockProgress = () => {
    setIsGenerating(true)

    // Mock data for testing
    const mockData = [
      {
        courseId: 'web-dev',
        videos: [
          { videoId: 'web-dev-1', title: 'Introduction to HTML', completed: true, watchTime: 1800, duration: 1800 },
          { videoId: 'web-dev-2', title: 'CSS Fundamentals', completed: true, watchTime: 1600, duration: 1800 },
          { videoId: 'web-dev-3', title: 'JavaScript Basics', completed: true, watchTime: 2100, duration: 2400 },
          { videoId: 'web-dev-4', title: 'DOM Manipulation', completed: false, watchTime: 900, duration: 1800 },
          { videoId: 'web-dev-5', title: 'Event Handling', completed: false, watchTime: 600, duration: 1500 }
        ]
      },
      {
        courseId: 'android-dev',
        videos: [
          { videoId: 'android-dev-1', title: 'Android Studio Setup', completed: true, watchTime: 1200, duration: 1200 },
          { videoId: 'android-dev-2', title: 'First Android App', completed: true, watchTime: 1800, duration: 1800 },
          { videoId: 'android-dev-3', title: 'Layouts and Views', completed: false, watchTime: 800, duration: 1600 }
        ]
      },
      {
        courseId: 'game-dev',
        videos: [
          { videoId: 'game-dev-1', title: 'Unity Basics', completed: true, watchTime: 2400, duration: 2400 },
          { videoId: 'game-dev-2', title: 'Game Objects', completed: false, watchTime: 600, duration: 1800 }
        ]
      }
    ]

    // Save mock progress data
    mockData.forEach(course => {
      course.videos.forEach((video, index) => {
        ProgressStorage.saveVideoProgress(userId, course.courseId, video.videoId, {
          videoId: video.videoId,
          videoTitle: video.title,
          courseId: course.courseId,
          lastWatchedTime: Date.now() - (index * 60000), // Stagger the timestamps
          lastPosition: video.watchTime,
          totalDuration: video.duration,
          completed: video.completed,
          validWatchTime: video.watchTime,
          videoIndex: index,
          moduleNumber: 1
        })
      })
    })

    console.log('Mock progress data generated!')
    ProgressStorage.debugStorage(userId)

    setTimeout(() => setIsGenerating(false), 1000)
  }

  const clearAllProgress = () => {
    ProgressStorage.clearAllProgress(userId)
    console.log('All progress cleared!')
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-50">
      <h4 className="text-sm font-semibold text-white mb-3">Debug: Progress Generator</h4>
      <div className="flex gap-2">
        <Button
          onClick={generateMockProgress}
          disabled={isGenerating}
          size="sm"
          className="text-xs"
        >
          {isGenerating ? 'Generating...' : 'Generate Mock Progress'}
        </Button>
        <Button
          onClick={clearAllProgress}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Clear All
        </Button>
      </div>
    </div>
  )
}