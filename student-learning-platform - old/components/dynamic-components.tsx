import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Loading component
const VideoPlayerLoader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-muted-foreground">Loading video player...</span>
  </div>
)

// Dynamic imports for heavy components
export const DynamicVideoPlayer = dynamic(
  () => import('./video-player-monitored'),
  {
    loading: VideoPlayerLoader,
    ssr: false,
  }
)

export const DynamicAIComponent = dynamic(
  () => import('./ai-monitoring-component'),
  {
    loading: () => <div className="p-4 text-center">Loading AI monitoring...</div>,
    ssr: false,
  }
)

export const DynamicAIComponentV2 = dynamic(
  () => import('./ai-monitoring-component-v2'),
  {
    loading: () => <div className="p-4 text-center">Loading AI monitoring...</div>,
    ssr: false,
  }
)

// Dynamic imports for dashboard components
export const DynamicDashboard = dynamic(
  () => import('../app/dashboard/page'),
  {
    loading: () => <div className="p-8 text-center">Loading dashboard...</div>,
    ssr: true,
  }
)