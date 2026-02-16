"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportsCharts } from "@/components/reports-charts"
import { AlertCircle, Brain, CheckCircle, BarChart3, Clock, TrendingUp } from "lucide-react"

export default function ReportsPage() {
  const [quizData, setQuizData] = useState<{ score: number; created_at: string }[]>([])
  const [alertsData, setAlertsData] = useState<{ type: string; created_at: string }[]>([])

  useEffect(() => {
    // Mock data for demonstration - replace with Firebase data later
    setQuizData([
      { score: 85, created_at: "2025-02-08T10:00:00Z" },
      { score: 92, created_at: "2025-02-09T14:30:00Z" },
      { score: 78, created_at: "2025-02-10T16:45:00Z" },
      { score: 88, created_at: "2025-02-11T09:15:00Z" },
    ])

    setAlertsData([
      { type: "posture", created_at: "2025-02-08T10:30:00Z" },
      { type: "attention", created_at: "2025-02-08T11:15:00Z" },
      { type: "posture", created_at: "2025-02-09T15:20:00Z" },
      { type: "attention", created_at: "2025-02-09T16:45:00Z" },
      { type: "posture", created_at: "2025-02-10T17:00:00Z" },
    ])
  }, [])

  const totalAlerts = alertsData.length
  const avgQuizScore = quizData.length > 0 
    ? Math.round(quizData.reduce((sum, item) => sum + item.score, 0) / quizData.length)
    : 0

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quiz Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgQuizScore}%</div>
            <p className="text-xs text-muted-foreground">
              Based on {quizData.length} quizzes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Good engagement level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
          <ReportsCharts quizData={quizData} alertsData={alertsData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest learning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quizData.slice(0, 3).map((quiz, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Quiz Completed</span>
                    </div>
                    <div className="text-sm font-medium">{quiz.score}%</div>
                  </div>
                ))}
                {quizData.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent quiz activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Summary</CardTitle>
              <CardDescription>Types of recent alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-sm">Posture Alerts</span>
                  </div>
                  <span className="text-sm font-medium">
                    {alertsData.filter(a => a.type === "posture").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-sm">Attention Alerts</span>
                  </div>
                  <span className="text-sm font-medium">
                    {alertsData.filter(a => a.type === "attention").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* 
Reports page will be updated with:
- Firebase alert logs
- Session analytics
- Progress charts
- Focus time tracking
- Violation reports
- Course completion statistics
*/