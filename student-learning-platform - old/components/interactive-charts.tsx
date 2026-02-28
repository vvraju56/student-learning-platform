"use client"

import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Brush,
  ReferenceLine
} from 'recharts'
import { Filter, BarChart3, LineChartIcon, AreaChartIcon, RefreshCw, Download } from 'lucide-react'

interface ChartDataPoint {
  date: string
  studyTime: number
  focusScore: number
  attentionScore: number
  postureScore: number
  videoCount: number
  quizScore: number
  breaks: number
  efficiency: number
}

interface InteractiveChartsProps {
  data: ChartDataPoint[]
  onFilterChange?: (filters: any) => void
}

export function InteractiveCharts({ data, onFilterChange }: InteractiveChartsProps) {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'composed'>('line')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['studyTime', 'focusScore', 'attentionScore'])
  const [timeRange, setTimeRange] = useState({ start: 0, end: data.length - 1 })
  const [showAverage, setShowAverage] = useState(true)
  const [showTrends, setShowTrends] = useState(true)

  const availableMetrics = [
    { key: 'studyTime', label: 'Study Time', color: '#3b82f6', unit: 'hours' },
    { key: 'focusScore', label: 'Focus Score', color: '#10b981', unit: '%' },
    { key: 'attentionScore', label: 'Attention Score', color: '#f59e0b', unit: '%' },
    { key: 'postureScore', label: 'Posture Score', color: '#ef4444', unit: '%' },
    { key: 'videoCount', label: 'Videos Watched', color: '#8b5cf6', unit: 'count' },
    { key: 'quizScore', label: 'Quiz Scores', color: '#ec4899', unit: '%' },
    { key: 'breaks', label: 'Breaks Taken', color: '#6366f1', unit: 'count' },
    { key: 'efficiency', label: 'Learning Efficiency', color: '#14b8a6', unit: '%' }
  ]

  const filteredData = data.slice(timeRange.start, timeRange.end + 1)

  // Calculate average line
  const calculateAverage = (metricKey: string) => {
    const values = filteredData.map(d => d[metricKey as keyof ChartDataPoint] as number)
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  // Calculate trend line
  const calculateTrend = (metricKey: string) => {
    const values = filteredData.map(d => d[metricKey as keyof ChartDataPoint] as number)
    const n = values.length
    const sumX = values.reduce((sum, _, i) => sum + i, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0)
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return values.map((_, i) => slope * i + intercept)
  }

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    )
  }

  const exportChartData = () => {
    const exportData = {
      chartType,
      selectedMetrics,
      timeRange,
      data: filteredData,
      averages: Object.fromEntries(
        selectedMetrics.map(metric => [metric, calculateAverage(metric)])
      ),
      trends: Object.fromEntries(
        selectedMetrics.map(metric => [metric, calculateTrend(metric)])
      ),
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chart-data-${chartType}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}{
                availableMetrics.find(m => m.key === entry.dataKey)?.unit
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetrics.map((metric) => {
              const metricInfo = availableMetrics.find(m => m.key === metric)
              return (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={metricInfo?.color}
                  fill={metricInfo?.color}
                  fillOpacity={0.3}
                  name={metricInfo?.label}
                  strokeWidth={2}
                />
              )
            })}
            {showAverage && selectedMetrics.map((metric) => {
              const avg = calculateAverage(metric)
              const metricInfo = availableMetrics.find(m => m.key === metric)
              return (
                <ReferenceLine
                  key={`avg-${metric}`}
                  y={avg}
                  stroke={metricInfo?.color}
                  strokeDasharray="5 5"
                  label={`Avg: ${avg.toFixed(1)}`}
                />
              )
            })}
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetrics.map((metric) => {
              const metricInfo = availableMetrics.find(m => m.key === metric)
              return (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={metricInfo?.color}
                  name={metricInfo?.label}
                  radius={[4, 4, 0, 0]}
                />
              )
            })}
          </BarChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetrics.map((metric, index) => {
              const metricInfo = availableMetrics.find(m => m.key === metric)
              const isArea = index % 2 === 0
              const isLine = index % 2 === 1
              
              if (isArea) {
                return (
                  <Area
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={metricInfo?.color}
                    fill={metricInfo?.color}
                    fillOpacity={0.3}
                    name={metricInfo?.label}
                    strokeWidth={2}
                  />
                )
              }
              
              if (isLine) {
                return (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={metricInfo?.color}
                    name={metricInfo?.label}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )
              }
              
              return (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={metricInfo?.color}
                  name={metricInfo?.label}
                  radius={[4, 4, 0, 0]}
                />
              )
            })}
          </ComposedChart>
        )

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetrics.map((metric) => {
              const metricInfo = availableMetrics.find(m => m.key === metric)
              return (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={metricInfo?.color}
                  name={metricInfo?.label}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )
            })}
            {showTrends && selectedMetrics.map((metric) => {
              const trendData = calculateTrend(metric)
              const metricInfo = availableMetrics.find(m => m.key === metric)
              return (
                <Line
                  key={`trend-${metric}`}
                  dataKey={(_, index) => trendData[index]}
                  stroke={metricInfo?.color}
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  name={`${metricInfo?.label} Trend`}
                />
              )
            })}
          </LineChart>
        )
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-white">Interactive Analytics</h3>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-2 rounded ${chartType === 'area' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <AreaChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('composed')}
              className={`p-2 rounded ${chartType === 'composed' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Options */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={showAverage}
                onChange={(e) => setShowAverage(e.target.checked)}
                className="rounded"
              />
              Average
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={showTrends}
                onChange={(e) => setShowTrends(e.target.checked)}
                className="rounded"
              />
              Trends
            </label>
          </div>

          {/* Export Button */}
          <button
            onClick={exportChartData}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Select Metrics
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableMetrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedMetrics.includes(metric.key)
                  ? 'text-white border-2'
                  : 'text-gray-400 border border-gray-600 hover:border-gray-500'
              }`}
              style={{
                borderColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                backgroundColor: selectedMetrics.includes(metric.key) ? `${metric.color}20` : undefined
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: metric.color }}
                ></div>
                {metric.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Time Range Selector */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Time Range</h4>
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Brush
              dataKey="date"
              height={30}
              stroke="#3b82f6"
              startIndex={timeRange.start}
              endIndex={timeRange.end}
              onChange={(newRange: any) => {
                if (newRange && newRange.startIndex !== undefined && newRange.endIndex !== undefined) {
                  setTimeRange({ start: newRange.startIndex, end: newRange.endIndex })
                  onFilterChange?.({ timeRange: { start: newRange.startIndex, end: newRange.endIndex } })
                }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {selectedMetrics.map((metric) => {
          const metricInfo = availableMetrics.find(m => m.key === metric)
          const values = filteredData.map(d => d[metric as keyof ChartDataPoint] as number)
          const avg = calculateAverage(metric)
          const max = Math.max(...values)
          const min = Math.min(...values)
          
          return (
            <div key={metric} className="bg-gray-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: metricInfo?.color }}
                ></div>
                <span className="text-sm text-gray-300">{metricInfo?.label}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Avg:</span>
                  <span className="text-white font-medium">
                    {avg.toFixed(1)}{metricInfo?.unit}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Range:</span>
                  <span className="text-white font-medium">
                    {min.toFixed(0)}-{max.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}