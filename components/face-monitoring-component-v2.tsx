"use client"

import React from "react"
import FaceMonitoringComponentMain from "./face-monitoring-system"

export function FaceMonitoringComponentV2({ videoRef }: { videoRef: React.RefObject<any> }) {
  return (
    <FaceMonitoringComponentMain
      videoRef={videoRef}
      userId="user"
      courseId="course"
      videoId="video"
    />
  )
}
