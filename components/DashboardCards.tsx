import type { MonitoringData } from "@/context/MonitoringContext"

interface DashboardCardsProps {
  monitoring: MonitoringData
}

export default function DashboardCards({ monitoring }: DashboardCardsProps) {
  const postureWidth = `${Math.max(0, Math.min(100, monitoring.postureScore))}%`
  const attentionWidth = `${Math.max(0, Math.min(100, monitoring.attentionScore))}%`

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Posture Card */}
      <div
        className={`rounded-lg shadow-lg p-8 text-white transition ${
          monitoring.posture === "good"
            ? "bg-gradient-to-br from-green-400 to-green-600"
            : "bg-gradient-to-br from-orange-400 to-orange-600"
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold opacity-90">Posture Status</h3>
            <p className="text-4xl font-bold mt-2">{monitoring.posture === "good" ? "✓ Good" : "⚠ Leaning Forward"}</p>
          </div>
          <span className="text-5xl opacity-80">{monitoring.posture === "good" ? "🧘" : "😟"}</span>
        </div>
        <div className="mt-6">
          <p className="text-sm opacity-90 mb-2">Posture Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white bg-opacity-30 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: postureWidth }}></div>
            </div>
            <span className="font-semibold">{Math.round(monitoring.postureScore)}%</span>
          </div>
        </div>
      </div>

      {/* Attention Card */}
      <div
        className={`rounded-lg shadow-lg p-8 text-white transition ${
          monitoring.attention === "focused"
            ? "bg-gradient-to-br from-blue-400 to-blue-600"
            : "bg-gradient-to-br from-yellow-400 to-yellow-600"
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold opacity-90">Attention Status</h3>
            <p className="text-4xl font-bold mt-2">
              {monitoring.attention === "focused" ? "✓ Focused" : "⚠ Distracted"}
            </p>
          </div>
          <span className="text-5xl opacity-80">{monitoring.attention === "focused" ? "🎯" : "😐"}</span>
        </div>
        <div className="mt-6">
          <p className="text-sm opacity-90 mb-2">Attention Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white bg-opacity-30 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: attentionWidth }}></div>
            </div>
            <span className="font-semibold">{Math.round(monitoring.attentionScore)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
