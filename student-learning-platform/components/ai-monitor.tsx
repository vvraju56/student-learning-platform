"use client"

import { useEffect, useRef, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, VideoOff } from "lucide-react"

const ALERT_COOLDOWN = 10000 // 10 seconds between alerts of same type

export function AiMonitor({ userId }: { userId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [status, setStatus] = useState<"Active" | "Inactive">("Inactive")
  const lastAlertTime = useRef<{ [key: string]: number }>({})
  const database = db
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null)

  const startMonitoring = async () => {
    if (!videoRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      videoRef.current.srcObject = stream
      setIsMonitoring(true)
      setStatus("Active")

      // Simple periodic check to log monitoring status
      monitoringInterval.current = setInterval(async () => {
        await logAlert("monitoring", "Student is being monitored")
      }, 30000) // Log every 30 seconds
    } catch (err) {
      console.error("Error accessing webcam:", err)
      alert("Could not access webcam. Please allow permissions.")
    }
  }

  const stopMonitoring = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current)
      monitoringInterval.current = null
    }

    setIsMonitoring(false)
    setStatus("Inactive")
  }

  const logAlert = async (type: string, message: string) => {
    const now = Date.now()
    if (now - (lastAlertTime.current[type] || 0) < ALERT_COOLDOWN) return

    lastAlertTime.current[type] = now

    if (!database) return

    // Add to Firestore alerts collection
    await addDoc(collection(database, "alerts"), {
      user_id: userId,
      type,
      message,
      resolved: false,
      timestamp: new Date().toISOString()
    })
  }

  useEffect(() => {
    return () => {
      stopMonitoring()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Face Monitoring
          <Badge variant={status === "Active" ? "default" : "secondary"}>{status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            src=""
            className={`w-full h-full object-cover ${!isMonitoring ? "hidden" : ""}`}
          />
          {!isMonitoring && (
            <div className="text-muted-foreground flex flex-col items-center">
              <VideoOff className="h-12 w-12 mb-2" />
              <p>Camera Off</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isMonitoring ? (
            <Button onClick={startMonitoring} className="w-full">
              Start Monitoring
              <Video className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={stopMonitoring} variant="destructive" className="w-full">
              Stop Monitoring
              <VideoOff className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          <p>
            <strong>Monitoring Features:</strong>
          </p>
          <ul className="list-disc list-inside">
            <li>Live video feed capture</li>
            <li>Session activity logging</li>
            <li>Real-time status updates</li>
          </ul>
          <p className="mt-2 text-xs italic">
            Note: Advanced AI features like posture detection can be enabled with additional configuration.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
