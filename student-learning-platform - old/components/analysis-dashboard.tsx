"use client"

import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Activity, Clock, Target, AlertTriangle, Settings } from 'lucide-react'
import { RealTimeMetrics } from './realtime-metrics'
import { InteractiveCharts } from './interactive-charts'
import { ReportExporter } from './report-exporter'
import { AdvancedFilter } from './advanced-filter'

interface AnalysisData {
  date: string
  studyTime: number
  videosWatched: number
  quizScores: number
  attentionScore: number
  postureScore: number
  sessionsCompleted: number
}

interface CoursePerformance {
  course: string
  completed: number
  total: number
  avgScore: number
  timeSpent: number
  engagement: number
}

interface WeeklyData {
  day: string
  hours: number
  efficiency: number
  breaks: number
  focusTime: number
}

interface AlertData {
  type: 'attention' | 'posture' | 'tab_switch' | 'low_engagement'
  count: number
  severity: 'low' | 'medium' | 'high'
}

interface TestResult {
  testName: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  passed: boolean
  date: string
  category?: string
}

interface TestResultAnalysis {
  totalTests: number
  passedTests: number
  failedTests: number
  averageScore: number
  highestScore: number
  lowestScore: number
  averageTimeSpent: number
  passRate: number
  categoryBreakdown?: { category: string; avgScore: number; count: number }[]
  trendAnalysis?: { improving: boolean; trendPercentage: number }
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

export function AnalysisDashboard() {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testResultAnalysis, setTestResultAnalysis] = useState<TestResultAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRealTime, setShowRealTime] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'metrics' | 'export'>('overview')

  // Mock data generation based on existing student data patterns
  useEffect(() => {
    generateMockData()
  }, [dateRange])

  const generateMockData = () => {
    setIsLoading(true)
    
    // Generate 30 days of mock data
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const data: AnalysisData[] = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        studyTime: Math.floor(Math.random() * 8) + 1,
        videosWatched: Math.floor(Math.random() * 5) + 1,
        quizScores: Math.floor(Math.random() * 30) + 70,
        attentionScore: Math.floor(Math.random() * 20) + 75,
        postureScore: Math.floor(Math.random() * 25) + 70,
        sessionsCompleted: Math.floor(Math.random() * 4) + 1
      })
    }
    
    setAnalysisData(data)
    
    // Generate course performance data
    setCoursePerformance([
      {
        course: 'Web Development',
        completed: 12,
        total: 20,
        avgScore: 85,
        timeSpent: 48,
        engagement: 92
      },
      {
        course: 'App Development', 
        completed: 8,
        total: 15,
        avgScore: 78,
        timeSpent: 32,
        engagement: 85
      },
      {
        course: 'Game Development',
        completed: 5,
        total: 18,
        avgScore: 82,
        timeSpent: 28,
        engagement: 88
      }
    ])
    
    // Generate weekly data
    setWeeklyData([
      { day: 'Mon', hours: 6.5, efficiency: 85, breaks: 3, focusTime: 5.2 },
      { day: 'Tue', hours: 7.2, efficiency: 88, breaks: 2, focusTime: 6.1 },
      { day: 'Wed', hours: 5.8, efficiency: 82, breaks: 4, focusTime: 4.3 },
      { day: 'Thu', hours: 8.1, efficiency: 91, breaks: 2, focusTime: 7.2 },
      { day: 'Fri', hours: 6.9, efficiency: 86, breaks: 3, focusTime: 5.8 },
      { day: 'Sat', hours: 4.5, efficiency: 78, breaks: 5, focusTime: 3.2 },
      { day: 'Sun', hours: 5.2, efficiency: 80, breaks: 4, focusTime: 3.8 }
    ])
    
    // Generate alerts data
    setAlerts([
      { type: 'attention', count: 12, severity: 'medium' },
      { type: 'posture', count: 8, severity: 'low' },
      { type: 'tab_switch', count: 25, severity: 'high' },
      { type: 'low_engagement', count: 5, severity: 'medium' }
    ])
    
    // Generate test results data
    const mockTestResults: TestResult[] = [
      {
        testName: 'HTML Fundamentals Quiz',
        score: 92,
        totalQuestions: 20,
        correctAnswers: 18,
        timeSpent: 15,
        passed: true,
        date: '2024-01-15',
        category: 'Web Development'
      },
      {
        testName: 'CSS Layout Assessment',
        score: 78,
        totalQuestions: 25,
        correctAnswers: 19,
        timeSpent: 22,
        passed: true,
        date: '2024-01-18',
        category: 'Web Development'
      },
      {
        testName: 'JavaScript Basics',
        score: 85,
        totalQuestions: 30,
        correctAnswers: 26,
        timeSpent: 28,
        passed: true,
        date: '2024-01-20',
        category: 'Web Development'
      },
      {
        testName: 'React Components Quiz',
        score: 68,
        totalQuestions: 20,
        correctAnswers: 14,
        timeSpent: 18,
        passed: true,
        date: '2024-01-22',
        category: 'Web Development'
      },
      {
        testName: 'Android Studio Setup Test',
        score: 55,
        totalQuestions: 15,
        correctAnswers: 8,
        timeSpent: 12,
        passed: false,
        date: '2024-01-25',
        category: 'App Development'
      },
      {
        testName: 'Kotlin Basics Assessment',
        score: 72,
        totalQuestions: 20,
        correctAnswers: 14,
        timeSpent: 25,
        passed: true,
        date: '2024-01-28',
        category: 'App Development'
      },
      {
        testName: 'Game Physics Quiz',
        score: 88,
        totalQuestions: 18,
        correctAnswers: 16,
        timeSpent: 20,
        passed: true,
        date: '2024-01-30',
        category: 'Game Development'
      },
      {
        testName: 'Unity Basics Test',
        score: 65,
        totalQuestions: 22,
        correctAnswers: 14,
        timeSpent: 30,
        passed: true,
        date: '2024-02-01',
        category: 'Game Development'
      }
    ]
    
    setTestResults(mockTestResults)
    
    // Generate test result analysis
    const analysis = analyzeTestResults(mockTestResults)
    setTestResultAnalysis(analysis)
    
    setTimeout(() => setIsLoading(false), 500)
  }
  
  const analyzeTestResults = (results: TestResult[]): TestResultAnalysis => {
    if (results.length === 0) {
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        averageTimeSpent: 0,
        passRate: 0,
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    }
    
    const totalTests = results.length
    const passedTests = results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    const scores = results.map(r => r.score)
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalTests
    const highestScore = Math.max(...scores)
    const lowestScore = Math.min(...scores)
    const averageTimeSpent = results.reduce((a, b) => a + b.timeSpent, 0) / totalTests
    const passRate = (passedTests / totalTests) * 100
    
    // Category breakdown
    const categoryMap = new Map<string, { scores: number[]; count: number }>()
    results.forEach(r => {
      if (r.category) {
        if (!categoryMap.has(r.category)) {
          categoryMap.set(r.category, { scores: [], count: 0 })
        }
        const cat = categoryMap.get(r.category)!
        cat.scores.push(r.score)
        cat.count++
      }
    })
    
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count
    }))
    
    // Trend analysis (compare first half vs second half)
    const halfPoint = Math.floor(results.length / 2)
    const firstHalfAvg = results.slice(0, halfPoint).reduce((a, b) => a + b.score, 0) / halfPoint
    const secondHalfAvg = results.slice(halfPoint).reduce((a, b) => a + b.score, 0) / (results.length - halfPoint)
    const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    const improving = trendPercentage > 0
    
    // Identify strengths and weaknesses
    const strengths: string[] = []
    const weaknesses: string[] = []
    const recommendations: string[] = []
    
    categoryBreakdown.forEach(cat => {
      if (cat.avgScore >= 80) {
        strengths.push(`Strong performance in ${cat.category} (${cat.avgScore.toFixed(1)}% average)`)
      } else if (cat.avgScore < 70) {
        weaknesses.push(`${cat.category} needs improvement (${cat.avgScore.toFixed(1)}% average)`)
        recommendations.push(`Focus more study time on ${cat.category} concepts`)
      }
    })
    
    if (passRate < 100) {
      recommendations.push('Review failed test questions to understand knowledge gaps')
    }
    
    if (averageTimeSpent > 25) {
      recommendations.push('Work on improving test-taking speed through practice')
    } else if (averageTimeSpent < 15) {
      weaknesses.push('May be rushing through tests without careful review')
      recommendations.push('Take more time to review answers before submitting')
    }
    
    if (improving) {
      strengths.push(`Improving trend (+${trendPercentage.toFixed(1)}% score improvement)`)
    } else {
      recommendations.push('Focus on consistent study habits to improve performance')
    }
    
    if (averageScore >= 75) {
      strengths.push('Overall good academic performance')
    } else {
      recommendations.push('Consider seeking additional help or tutoring')
    }
    
    return {
      totalTests,
      passedTests,
      failedTests,
      averageScore,
      highestScore,
      lowestScore,
      averageTimeSpent,
      passRate,
      categoryBreakdown,
      trendAnalysis: { improving, trendPercentage },
      strengths,
      weaknesses,
      recommendations
    }
  }

  const exportReport = () => {
    const reportData = {
      dateRange,
      analysisData,
      coursePerformance,
      weeklyData,
      alerts,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analysis data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Analysis Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Comprehensive learning analytics and performance insights</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'charts', label: 'Charts' },
                { id: 'metrics', label: 'Real-time' },
                { id: 'export', label: 'Export' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`px-4 py-2 rounded-md transition-all ${
                    activeSection === tab.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Settings */}
            <button
              onClick={() => setShowRealTime(!showRealTime)}
              className={`p-2 rounded-lg transition-colors ${
                showRealTime ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filter */}
        <AdvancedFilter
          onFilterChange={(filters) => {
            console.log('Filters updated:', filters)
          }}
          onReset={() => {
            console.log('Filters reset')
          }}
        />

        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <>
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +12%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {analysisData.reduce((acc, day) => acc + day.studyTime, 0)}h
                </h3>
                <p className="text-gray-400 text-sm">Total Study Time</p>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Activity className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-sm text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +8%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {analysisData.reduce((acc, day) => acc + day.videosWatched, 0)}
                </h3>
                <p className="text-gray-400 text-sm">Videos Completed</p>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-sm text-red-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    -3%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {Math.round(analysisData.reduce((acc, day) => acc + day.quizScores, 0) / analysisData.length)}%
                </h3>
                <p className="text-gray-400 text-sm">Average Quiz Score</p>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                  </div>
                  <span className="text-sm text-yellow-400">
                    {alerts.reduce((acc, alert) => acc + alert.count, 0)} total
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {alerts.filter(a => a.severity === 'high').length}
                </h3>
                <p className="text-gray-400 text-sm">High Priority Alerts</p>
              </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Study Time Trend */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Study Time Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analysisData}>
                    <defs>
                      <linearGradient id="studyTimeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="studyTime" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#studyTimeGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Metrics Radar */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analysisData.slice(-7)}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="date" stroke="#9ca3af" />
                    <PolarRadiusAxis stroke="#9ca3af" />
                    <Radar 
                      name="Attention Score" 
                      dataKey="attentionScore" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6} 
                    />
                    <Radar 
                      name="Posture Score" 
                      dataKey="postureScore" 
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.6} 
                    />
                    <Legend />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Course Performance & Weekly Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Course Performance */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Course Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={coursePerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="course" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Legend />
                    <Bar dataKey="avgScore" fill="#3b82f6" name="Avg Score %" />
                    <Bar dataKey="engagement" fill="#10b981" name="Engagement %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Activity Pattern */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Weekly Activity Pattern</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#8b5cf6" 
                      strokeWidth={2} 
                      name="Study Hours"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      name="Efficiency %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Alerts Pie Chart */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Alerts Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={alerts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({type, count}) => `${type}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {alerts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Alert Details */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">Alert Breakdown</h3>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.type} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getSeverityColor(alert.severity) }}
                        ></div>
                        <div>
                          <p className="text-white font-medium capitalize">
                            {alert.type.replace('_', ' ')}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Severity: <span className="capitalize">{alert.severity}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{alert.count}</p>
                        <p className="text-gray-400 text-sm">occurrences</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'charts' && (
          <div className="mb-8">
            <InteractiveCharts 
              data={analysisData}
              onFilterChange={(filters) => console.log('Chart filters:', filters)}
            />
          </div>
        )}

        {activeSection === 'metrics' && (
          <div className="mb-8">
            <RealTimeMetrics isActive={showRealTime} />
          </div>
        )}

        {activeSection === 'export' && (
          <div className="mb-8">
            <ReportExporter
              data={{
                dateRange,
                summary: {
                  totalStudyTime: analysisData.reduce((acc, day) => acc + day.studyTime, 0),
                  totalVideos: analysisData.reduce((acc, day) => acc + day.videosWatched, 0),
                  avgQuizScore: Math.round(analysisData.reduce((acc, day) => acc + day.quizScores, 0) / analysisData.length),
                  totalAlerts: alerts.reduce((acc, alert) => acc + alert.count, 0),
                  totalTests: testResults.length,
                  testPassRate: testResultAnalysis ? testResultAnalysis.passRate.toFixed(1) + '%' : '0%'
                },
                metrics: [],
                charts: analysisData,
                alerts: alerts,
                recommendations: [
                  'Increase study time by 20% to reach learning goals',
                  'Focus on posture improvement during study sessions',
                  'Take regular breaks to maintain attention levels',
                  'Review quiz materials to improve scores',
                  ...(testResultAnalysis?.recommendations || [])
                ],
                testResults: testResults,
                testResultAnalysis: testResultAnalysis || undefined
              }}
              onExport={(format, data) => {
                console.log(`Report exported in ${format} format:`, data)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}