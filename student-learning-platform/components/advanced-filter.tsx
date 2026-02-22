"use client"

import { useState } from 'react'
import { Filter, Calendar, Users, Target, Clock, ChevronDown, X, RefreshCw } from 'lucide-react'

interface FilterOptions {
  dateRange: {
    start: Date | null
    end: Date | null
    preset: string
  }
  courses: string[]
  metrics: string[]
  performance: {
    minScore: number
    maxScore: number
  }
  timeSpent: {
    minHours: number
    maxHours: number
  }
  alertLevel: string[]
  sessionType: string[]
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  onReset: () => void
  availableCourses?: string[]
  availableMetrics?: string[]
}

export function AdvancedFilter({ 
  onFilterChange, 
  onReset, 
  availableCourses = ['Web Development', 'App Development', 'Game Development'],
  availableMetrics = ['Study Time', 'Focus Score', 'Attention Score', 'Posture Score', 'Quiz Scores', 'Learning Efficiency']
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState(0)
  
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: null,
      end: null,
      preset: '30d'
    },
    courses: [],
    metrics: [],
    performance: {
      minScore: 0,
      maxScore: 100
    },
    timeSpent: {
      minHours: 0,
      maxHours: 24
    },
    alertLevel: [],
    sessionType: []
  })

  const datePresets = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom range' }
  ]

  const alertLevels = [
    { value: 'high', label: 'High Priority', color: 'text-red-400 bg-red-400/10' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-400 bg-yellow-400/10' },
    { value: 'low', label: 'Low Priority', color: 'text-green-400 bg-green-400/10' }
  ]

  const sessionTypes = [
    { value: 'focused', label: 'Focused Sessions' },
    { value: 'distracted', label: 'Distracted Sessions' },
    { value: 'break', label: 'Break Sessions' },
    { value: 'deep_work', label: 'Deep Work Sessions' }
  ]

  const updateFilter = (category: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [category]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
    updateActiveFilterCount(newFilters)
  }

  const updateDateRange = (preset: string) => {
    const today = new Date()
    let start: Date | null = null
    let end: Date | null = null

    switch (preset) {
      case '7d':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
    }

    updateFilter('dateRange', { ...filters.dateRange, preset, start, end })
  }

  const toggleCourse = (course: string) => {
    const newCourses = filters.courses.includes(course)
      ? filters.courses.filter(c => c !== course)
      : [...filters.courses, course]
    updateFilter('courses', newCourses)
  }

  const toggleMetric = (metric: string) => {
    const newMetrics = filters.metrics.includes(metric)
      ? filters.metrics.filter(m => m !== metric)
      : [...filters.metrics, metric]
    updateFilter('metrics', newMetrics)
  }

  const toggleAlertLevel = (level: string) => {
    const newAlertLevels = filters.alertLevel.includes(level)
      ? filters.alertLevel.filter(l => l !== level)
      : [...filters.alertLevel, level]
    updateFilter('alertLevel', newAlertLevels)
  }

  const toggleSessionType = (type: string) => {
    const newSessionTypes = filters.sessionType.includes(type)
      ? filters.sessionType.filter(t => t !== type)
      : [...filters.sessionType, type]
    updateFilter('sessionType', newSessionTypes)
  }

  const updateActiveFilterCount = (currentFilters: FilterOptions) => {
    let count = 0
    if (currentFilters.courses.length > 0) count++
    if (currentFilters.metrics.length > 0) count++
    if (currentFilters.alertLevel.length > 0) count++
    if (currentFilters.sessionType.length > 0) count++
    if (currentFilters.performance.minScore > 0 || currentFilters.performance.maxScore < 100) count++
    if (currentFilters.timeSpent.minHours > 0 || currentFilters.timeSpent.maxHours < 24) count++
    if (currentFilters.dateRange.preset !== '30d') count++
    
    setActiveFilters(count)
  }

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      dateRange: {
        start: null,
        end: null,
        preset: '30d'
      },
      courses: [],
      metrics: [],
      performance: { minScore: 0, maxScore: 100 },
      timeSpent: { minHours: 0, maxHours: 24 },
      alertLevel: [],
      sessionType: []
    }
    
    setFilters(defaultFilters)
    setActiveFilters(0)
    onReset()
    onFilterChange(defaultFilters)
  }

  const getActiveFilterTags = () => {
    const tags: Array<{ category: string; value: string }> = []
    
    if (filters.dateRange.preset !== '30d') {
      const preset = datePresets.find(p => p.value === filters.dateRange.preset)
      tags.push({ category: 'Date Range', value: preset?.label || 'Custom' })
    }
    
    filters.courses.forEach(course => tags.push({ category: 'Course', value: course }))
    filters.metrics.forEach(metric => tags.push({ category: 'Metric', value: metric }))
    filters.alertLevel.forEach(level => tags.push({ category: 'Alert', value: level }))
    filters.sessionType.forEach(type => tags.push({ category: 'Session', value: type }))
    
    if (filters.performance.minScore > 0 || filters.performance.maxScore < 100) {
      tags.push({ 
        category: 'Score', 
        value: `${filters.performance.minScore}-${filters.performance.maxScore}%` 
      })
    }
    
    return tags
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl">
      {/* Filter Toggle Bar */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium">Advanced Filters</span>
            {activeFilters > 0 && (
              <span className="px-2 py-1 bg-blue-500 rounded-full text-xs">
                {activeFilters}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Active Filter Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {getActiveFilterTags().map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs flex items-center gap-1"
              >
                <span className="opacity-70">{tag.category}:</span>
                {tag.value}
              </span>
            ))}
            {activeFilters > 0 && (
              <button
                onClick={handleReset}
                className="px-2 py-1 text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="border-t border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Date Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </h4>
              <div className="space-y-2">
                {datePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateDateRange(preset.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      filters.dateRange.preset === preset.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Courses */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Courses
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableCourses.map((course) => (
                  <label
                    key={course}
                    className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.courses.includes(course)}
                      onChange={() => toggleCourse(course)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    {course}
                  </label>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Metrics
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableMetrics.map((metric) => (
                  <label
                    key={metric}
                    className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.metrics.includes(metric)}
                      onChange={() => toggleMetric(metric)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    {metric}
                  </label>
                ))}
              </div>
            </div>

            {/* Performance Score Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Performance Score</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Min Score: {filters.performance.minScore}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.performance.minScore}
                    onChange={(e) => updateFilter('performance', {
                      ...filters.performance,
                      minScore: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Max Score: {filters.performance.maxScore}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.performance.maxScore}
                    onChange={(e) => updateFilter('performance', {
                      ...filters.performance,
                      maxScore: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Time Spent Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Time Spent</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Min Hours: {filters.timeSpent.minHours}</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={filters.timeSpent.minHours}
                    onChange={(e) => updateFilter('timeSpent', {
                      ...filters.timeSpent,
                      minHours: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Max Hours: {filters.timeSpent.maxHours}</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={filters.timeSpent.maxHours}
                    onChange={(e) => updateFilter('timeSpent', {
                      ...filters.timeSpent,
                      maxHours: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Alert Levels */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Alert Levels</h4>
              <div className="space-y-2">
                {alertLevels.map((level) => (
                  <label
                    key={level.value}
                    className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.alertLevel.includes(level.value)}
                      onChange={() => toggleAlertLevel(level.value)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`px-2 py-1 rounded-full text-xs ${level.color}`}>
                      {level.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Session Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Session Types
              </h4>
              <div className="space-y-2">
                {sessionTypes.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.sessionType.includes(type.value)}
                      onChange={() => toggleSessionType(type.value)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              {activeFilters} filters active
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}