"use client"

import { useEffect, useState } from "react"
import { useEyeMonitoring } from "@/hooks/use-eye-monitoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  CameraOff, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Focus,
  Maximize2,
  Scan,
  MonitorOff
} from "lucide-react"

const VIOLATION_LIMIT = 10

interface FaceMonitoringProps {
  videoRef: React.RefObject<HTMLIFrameElement | null>
  userId: string
  courseId: string
  videoId: string
  onProgressUpdate?: (validTime: number) => void
  externalPauseCondition?: boolean
  onPauseRequest?: () => void
  onResumeRequest?: () => void
  onActionsReady?: (actions: { setVideoPlaying: (p: boolean) => void }) => void
}

export default function FaceMonitoringComponent({ 
  videoRef, 
  userId, 
  courseId, 
  videoId,
  onProgressUpdate,
  externalPauseCondition = false,
  onPauseRequest,
  onResumeRequest,
  onActionsReady
}: FaceMonitoringProps) {
  const { 
    states, 
    violations, 
    validWatchTime, 
    pauseCountdown,
    startMonitoring, 
    stopMonitoring, 
    pauseVideo, 
    resumeVideo, 
    setVideoPlaying,
    canvasRef, 
    toggleLandmarks 
  } = useEyeMonitoring(videoRef, externalPauseCondition, onPauseRequest, onResumeRequest)

  useEffect(() => {
    onActionsReady?.({ setVideoPlaying })
  }, [setVideoPlaying, onActionsReady])

  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    console.log('FaceMonitoring: validWatchTime=', validWatchTime, 'externalPauseCondition=', externalPauseCondition, 'videoPlaying=', states.videoPlaying, 'faceDetected=', states.faceDetected)
    onProgressUpdate?.(validWatchTime)
  }, [validWatchTime, onProgressUpdate, externalPauseCondition, states.videoPlaying, states.faceDetected])

  const getStatusColor = (active: boolean) => 
    active ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"

  const getAttentionColor = (isFocused: boolean, isDistracted: boolean) => {
    if (isDistracted) return "text-red-600 bg-red-50 border-red-200"
    if (isFocused) return "text-green-600 bg-green-50 border-green-200"
    return "text-amber-600 bg-amber-50 border-amber-200"
  }

  const getViolationColor = (count: number) => {
    if (count >= 10) return "text-red-600"
    if (count >= 5) return "text-amber-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-2">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-600" />
              <span>Video Monitoring</span>
            </div>
            {states.monitoringActive && (
              <Badge variant={states.isFocusedNow ? "success" : "destructive"} className="animate-pulse">
                {states.isFocusedNow ? "Monitoring" : "Attention Lost"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {states.monitoringActive && showPreview && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-slate-200 shadow-inner group">
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
              {!states.cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                  <div className="text-center">
                    <Scan className="h-8 w-8 text-blue-500 mx-auto animate-spin mb-2" />
                    <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Initializing AI...</p>
                  </div>
                </div>
              )}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-mono flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${states.faceDetected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  FACE: {states.faceDetected ? 'DETECTED' : 'MISSING'}
                </div>
              </div>
              {states.monitoringActive && (pauseCountdown !== null || states.isDistracted || (!states.isFocusedNow && states.faceDetected)) && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-600/20 backdrop-blur-[2px]">
                   <div className="px-4 py-2 bg-red-600 text-white font-bold rounded shadow-lg animate-bounce flex flex-col items-center gap-1">
                     <div className="flex items-center gap-2 text-sm">
                       <AlertTriangle className="h-4 w-4" />
                       {pauseCountdown !== null ? `PAUSING IN ${pauseCountdown.toFixed(1)}s` : states.isDistracted ? "ATTENTION REQUIRED" : "LOOK AT THE SCREEN"}
                     </div>
                     {pauseCountdown !== null && (
                       <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden mt-1">
                         <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${(pauseCountdown / 3) * 100}%` }} />
                       </div>
                     )}
                   </div>
                </div>
              )}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="xs" variant="secondary" className="h-7 text-[10px]" onClick={toggleLandmarks}>Toggle Landmarks</Button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {!states.monitoringActive ? (
              <Button onClick={startMonitoring} className="flex-1 bg-blue-600 hover:bg-blue-700"><Camera className="h-4 w-4 mr-2" />Start Tracker</Button>
            ) : (
              <Button onClick={stopMonitoring} variant="destructive" className="flex-1"><CameraOff className="h-4 w-4 mr-2" />Stop Tracking</Button>
            )}
            {states.monitoringActive && <Button variant="outline" size="icon" onClick={() => setShowPreview(!showPreview)}><Maximize2 className="h-4 w-4" /></Button>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2 rounded border flex flex-col gap-1 ${getStatusColor(states.faceDetected)}`}>
              <div className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /><span className="text-[11px] font-bold uppercase tracking-wider">Detection</span></div>
              <span className="text-xs font-medium">{states.faceDetected ? "Face Detected" : "Searching..."}</span>
            </div>
            <div className={`p-2 rounded border flex flex-col gap-1 ${getAttentionColor(states.isFocusedNow, states.isDistracted)}`}>
              <div className="flex items-center gap-1.5"><Focus className="h-3.5 w-3.5" /><span className="text-[11px] font-bold uppercase tracking-wider">Attention</span></div>
              <span className="text-xs font-medium">{states.isDistracted ? "Distracted!" : states.isFocusedNow ? "Focused" : "Looking Away"}</span>
              {states.monitoringActive && <div className="mt-1 pt-1 border-t border-current/10 font-mono text-[9px] grid grid-cols-2 gap-x-2 opacity-70"><span>G: {states.gazeX.toFixed(2)},{states.gazeY.toFixed(2)}</span><span>H: {states.headYaw.toFixed(0)}°,{states.headPitch.toFixed(0)}°</span></div>}
            </div>
            <div className={`p-2 rounded border flex flex-col gap-1 ${getStatusColor(states.tabVisible)}`}>
              <div className="flex items-center gap-1.5"><MonitorOff className="h-3.5 w-3.5" /><span className="text-[11px] font-bold uppercase tracking-wider">Tab Focus</span></div>
              <span className="text-xs font-medium">{states.tabVisible ? "Active" : "Tab Switched"}</span>
            </div>
            <div className={`p-2 rounded border flex flex-col gap-1 ${getStatusColor(states.videoPlaying)}`}>
              <div className="flex items-center gap-1.5">{states.videoPlaying ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}<span className="text-[11px] font-bold uppercase tracking-wider">Video</span></div>
              <span className="text-xs font-medium">{states.videoPlaying ? "Playing" : "Auto-Paused"}</span>
            </div>
          </div>
          <div className="p-4 rounded-lg border-2 border-blue-100 bg-blue-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 rounded-full text-white"><Clock className="h-5 w-5" /></div><div><p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Valid Watch Time</p><p className="text-2xl font-black text-blue-900 leading-none mt-1">{Math.floor(validWatchTime / 60)}m {validWatchTime % 60}s</p></div></div>
            {states.monitoringActive && !states.isFocusedNow && <div className="text-[10px] text-red-600 font-bold bg-red-100 px-2 py-1 rounded animate-pulse">STALLED</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
