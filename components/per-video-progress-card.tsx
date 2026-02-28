"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, AlertTriangle, Eye, Pause, Zap, Clock } from "lucide-react"

interface VideoProgressData {
  videoId: string
  title: string
  progress: number
  watchTime: number
  duration: number
  violations: {
    tabSwitches: number
    faceMissingEvents: number
    autoPauses: number
    skipCount: number
  }
  lastSyncTime: number
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0m"
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

function ViolationBadge({ label, count, icon: Icon, color }: { label: string; count: number; icon: any; color: string }) {
  if (count === 0) return null
  
  const colorClasses: Record<string, string> = {
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30"
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${colorClasses[color] || colorClasses.red}`}>
      <Icon className="w-3 h-3" />
      <span className="font-medium">{label}: {count}</span>
    </div>
  )
}

export function PerVideoProgressCard({ video }: { video: VideoProgressData }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const progressPercent = Math.min(100, Math.max(0, video.progress))
  const totalViolations = video.violations.tabSwitches + video.violations.faceMissingEvents + video.violations.autoPauses + video.violations.skipCount
  
  // Color based on progress
  let progressColor = "bg-red-500"
  if (progressPercent >= 80) progressColor = "bg-green-500"
  else if (progressPercent >= 50) progressColor = "bg-yellow-500"
  else if (progressPercent >= 25) progressColor = "bg-blue-500"
  
  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
      {/* Compact view */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-900/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left section: Title and progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-sm truncate text-gray-100">{video.title}</h4>
              {totalViolations > 0 && (
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              )}
            </div>
            
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                <div 
                  className={`${progressColor} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-400 w-10 text-right">{Math.round(progressPercent)}%</span>
            </div>
          </div>
          
          {/* Right section: Stats and expand button */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs text-gray-500">Duration</div>
              <div className="text-sm font-medium text-gray-300">{formatTime(video.duration)}</div>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>
      
      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-4 bg-gray-900/20 space-y-4">
          {/* Watch time section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Clock className="w-3 h-3" />
                Watch Time
              </div>
              <div className="text-lg font-bold text-blue-400">{formatTime(video.watchTime)}</div>
              <div className="text-xs text-gray-500 mt-1">of {formatTime(video.duration)}</div>
            </div>
            
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Zap className="w-3 h-3" />
                Completion
              </div>
              <div className="text-lg font-bold text-green-400">{Math.round(progressPercent)}%</div>
              <div className="text-xs text-gray-500 mt-1">Progress</div>
            </div>
          </div>
          
          {/* Violations section */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Monitoring Violations</div>
            <div className="flex flex-wrap gap-2">
              <ViolationBadge 
                label="Tab Switches"
                count={video.violations.tabSwitches}
                icon={() => <AlertTriangle className="w-3 h-3" />}
                color="red"
              />
              <ViolationBadge 
                label="Face Missing"
                count={video.violations.faceMissingEvents}
                icon={() => <Eye className="w-3 h-3" />}
                color="yellow"
              />
              <ViolationBadge 
                label="Auto-Pauses"
                count={video.violations.autoPauses}
                icon={() => <Pause className="w-3 h-3" />}
                color="orange"
              />
              <ViolationBadge 
                label="Skips"
                count={video.violations.skipCount}
                icon={() => <Zap className="w-3 h-3" />}
                color="purple"
              />
            </div>
            {totalViolations === 0 && (
              <div className="text-xs text-green-400 font-medium">✓ No violations detected</div>
            )}
          </div>
          
          {/* Last sync time */}
          <div className="text-xs text-gray-500 border-t border-gray-800 pt-3">
            Last synced: {video.lastSyncTime ? new Date(video.lastSyncTime).toLocaleTimeString() : "Never"}
          </div>
        </div>
      )}
    </div>
  )
}

export function VideoProgressGrid({ videos }: { videos: VideoProgressData[] }) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No video data available yet. Start watching videos to see progress here.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {videos.map((video) => (
        <PerVideoProgressCard key={video.videoId} video={video} />
      ))}
    </div>
  )
}
