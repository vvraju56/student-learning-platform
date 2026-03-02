"use client"

import { useState, useEffect } from 'react'
import { Activity, Brain, Eye, Timer, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface MetricData {
  label: string
  value: number | string
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  icon: React.ReactNode
}

interface RealTimeMetricsProps {
  isActive?: boolean
}

export function RealTimeMetrics({ isActive = true }: RealTimeMetricsProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      label: 'Focus Score',
      value: 85,
      unit: '%',
      trend: 'up',
      trendValue: 5,
      status: 'excellent',
      icon: <Brain className="w-5 h-5" />
    },
    {
      label: 'Attention Level',
      value: 78,
      unit: '%',
      trend: 'stable',
      trendValue: 0,
      status: 'good',
      icon: <Eye className="w-5 h-5" />
    },
    {
      label: 'Posture Quality',
      value: 82,
      unit: '%',
      trend: 'up',
      trendValue: 3,
      status: 'good',
      icon: <Activity className="w-5 h-5" />
    },
    {
      label: 'Session Duration',
      value: 45,
      unit: 'min',
      trend: 'up',
      trendValue: 12,
      status: 'excellent',
      icon: <Timer className="w-5 h-5" />
    },
    {
      label: 'Task Completion',
      value: 92,
      unit: '%',
      trend: 'up',
      trendValue: 8,
      status: 'excellent',
      icon: <Target className="w-5 h-5" />
    },
    {
      label: 'Learning Efficiency',
      value: 88,
      unit: '%',
      trend: 'down',
      trendValue: -2,
      status: 'good',
      icon: <TrendingUp className="w-5 h-5" />
    }
  ])

  const [realTimeAlerts, setRealTimeAlerts] = useState([
    { id: 1, type: 'warning', message: 'Posture slouching detected', timestamp: new Date() },
    { id: 2, type: 'info', message: 'Focus score improved by 5%', timestamp: new Date() }
  ])

  // Simulate real-time metric updates
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const variation = (Math.random() - 0.5) * 10
        const newValue = typeof metric.value === 'number' 
          ? Math.max(0, Math.min(100, metric.value + variation))
          : metric.value

        const newTrend = variation > 2 ? 'up' : variation < -2 ? 'down' : 'stable'
        const newTrendValue = Math.abs(variation)

        let newStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'good'
        if (typeof newValue === 'number') {
          if (newValue >= 85) newStatus = 'excellent'
          else if (newValue >= 70) newStatus = 'good'
          else if (newValue >= 50) newStatus = 'warning'
          else newStatus = 'critical'
        }

        return {
          ...metric,
          value: Math.round(newValue as number),
          trend: newTrend,
          trendValue: Math.round(newTrendValue),
          status: newStatus
        }
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [isActive])

  // Add new real-time alerts
  useEffect(() => {
    if (!isActive) return

    const alertInterval = setInterval(() => {
      const alertTypes = [
        { type: 'warning', message: 'Tab switch detected - focus lost' },
        { type: 'info', message: 'Attention level improving' },
        { type: 'warning', message: 'Posture adjustment needed' },
        { type: 'success', message: 'Learning goal achieved' },
        { type: 'info', message: 'Session efficiency increasing' }
      ]

      const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      
      setRealTimeAlerts(prev => [
        {
          id: Date.now(),
          type: randomAlert.type,
          message: randomAlert.message,
          timestamp: new Date()
        },
        ...prev.slice(0, 4) // Keep only last 5 alerts
      ])
    }, 8000)

    return () => clearInterval(alertInterval)
  }, [isActive])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'good': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />
      case 'info': return <Activity className="w-4 h-4 text-blue-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-900/20 border-green-400/30 text-green-300'
      case 'warning': return 'bg-yellow-900/20 border-yellow-400/30 text-yellow-300'
      case 'info': return 'bg-blue-900/20 border-blue-400/30 text-blue-300'
      default: return 'bg-gray-900/20 border-gray-400/30 text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border ${getStatusColor(metric.status)} transition-all duration-500 hover:scale-105`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                {metric.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs ${
                metric.trend === 'up' ? 'text-green-400' : 
                metric.trend === 'down' ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {metric.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {metric.trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
                {metric.trend !== 'stable' && `${metric.trendValue}%`}
                {metric.trend === 'stable' && 'Stable'}
              </div>
            </div>
            
            <div>
              <p className="text-2xl font-bold">
                {metric.value}
                <span className="text-sm font-normal ml-1 opacity-70">{metric.unit}</span>
              </p>
              <p className="text-sm mt-1 opacity-80">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Alerts Feed */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Alerts
          </h3>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {realTimeAlerts.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recent alerts</p>
          ) : (
            realTimeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertStyle(alert.type)} flex items-start gap-3`}
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overall Performance Score */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Overall Performance Score</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">
                {Math.round(metrics.reduce((acc, m) => acc + (typeof m.value === 'number' ? m.value : 0), 0) / metrics.length)}
              </span>
              <span className="text-xl text-gray-400">/100</span>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              Based on current real-time metrics
            </p>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              isActive ? 'bg-green-400/20 text-green-400' : 'bg-gray-400/20 text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`}></div>
              <span className="text-sm font-medium">
                {isActive ? 'Live Tracking' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Updates every 3 seconds
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 bg-gray-700/50 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-400 to-purple-400"
            style={{
              width: `${metrics.reduce((acc, m) => acc + (typeof m.value === 'number' ? m.value : 0), 0) / metrics.length}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}