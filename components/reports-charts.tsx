"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { format } from "date-fns"

type ReportsChartsProps = {
  quizData: { score: number; created_at: string }[]
  alertsData: { type: string; created_at: string }[]
}

export function ReportsCharts({ quizData, alertsData }: ReportsChartsProps) {
  // Process Quiz Data
  const processedQuizData = quizData.map((item) => ({
    date: format(new Date(item.created_at), "MM/dd"),
    score: item.score,
  }))

  // Process Alerts Data - Aggregate by date
  const alertsByDate: { [key: string]: { posture: number; attention: number } } = {}

  alertsData.forEach((alert) => {
    const date = format(new Date(alert.created_at), "MM/dd")
    if (!alertsByDate[date]) {
      alertsByDate[date] = { posture: 0, attention: 0 }
    }
    if (alert.type === "posture") alertsByDate[date].posture++
    else alertsByDate[date].attention++
  })

  const processedAlertsData = Object.keys(alertsByDate)
    .map((date) => ({
      date,
      posture: alertsByDate[date].posture,
      attention: alertsByDate[date].attention,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Quiz Performance History</CardTitle>
          <CardDescription>Your scores over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {processedQuizData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedQuizData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">No quiz data available</div>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Alerts Breakdown</CardTitle>
          <CardDescription>Daily posture and attention alerts</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {processedAlertsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedAlertsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="posture" fill="#f97316" name="Posture" />
                <Bar dataKey="attention" fill="#ef4444" name="Attention" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No alerts data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
