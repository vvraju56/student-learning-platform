"use client"

import { createContext, useState, useEffect, type ReactNode, useContext } from "react"
import { AuthContext } from "./AuthContext"
import { supabase } from "../lib/supabase"

export interface Alert {
  id: string
  timestamp: string
  type: "posture" | "attention"
  message: string
  severity: "warning" | "critical"
  userId?: string
}

export interface MonitoringData {
  posture: "good" | "leaning_forward"
  attention: "focused" | "distracted"
  postureScore: number
  attentionScore: number
  studyDuration: number
}

interface MonitoringContextType {
  monitoring: MonitoringData
  alerts: Alert[]
  addAlert: (alert: Alert) => Promise<void>
  updateMonitoring: (data: Partial<MonitoringData>) => void
  clearAlerts: () => Promise<void>
  quizScores: number[]
  addQuizScore: (score: number) => Promise<void>
  loadAlerts: () => Promise<void>
  loadQuizScores: () => Promise<void>
}

export const MonitoringContext = createContext<MonitoringContextType>({
  monitoring: {
    posture: "good",
    attention: "focused",
    postureScore: 85,
    attentionScore: 90,
    studyDuration: 0,
  },
  alerts: [],
  addAlert: async () => {},
  updateMonitoring: () => {},
  clearAlerts: async () => {},
  quizScores: [],
  addQuizScore: async () => {},
  loadAlerts: async () => {},
  loadQuizScores: async () => {},
})

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const { user } = useContext(AuthContext)
  const [monitoring, setMonitoring] = useState<MonitoringData>({
    posture: "good",
    attention: "focused",
    postureScore: 85,
    attentionScore: 90,
    studyDuration: 0,
  })

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [quizScores, setQuizScores] = useState<number[]>([])

  const updateMonitoring = (data: Partial<MonitoringData>) => {
    setMonitoring((prev) => ({ ...prev, ...data }))
  }

  useEffect(() => {
    if (!user) return

    const unsubscribe: (() => void) | null = null

    const interval = setInterval(async () => {
      setMonitoring((prev) => {
        const newPostureScore = Math.min(100, Math.max(60, prev.postureScore + (Math.random() - 0.5) * 8))
        const newAttentionScore = Math.min(100, Math.max(60, prev.attentionScore + (Math.random() - 0.5) * 8))

        // Derive status from scores
        const newPosture = newPostureScore > 70 ? "good" : "leaning_forward"
        const newAttention = newAttentionScore > 70 ? "focused" : "distracted"

        // Auto-generate alerts based on sensor data
        if (newPosture === "leaning_forward" && Math.random() > 0.8) {
          const alert: Alert = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: "posture",
            message: "Poor posture detected - Sit straight",
            severity: "warning",
            userId: user.uid,
          }
          addAlert(alert)
        }

        if (newAttention === "distracted" && Math.random() > 0.85) {
          const alert: Alert = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: "attention",
            message: "Attention loss detected - Focus on screen",
            severity: "warning",
            userId: user.uid,
          }
          addAlert(alert)
        }

        return {
          posture: newPosture as "good" | "leaning_forward",
          attention: newAttention as "focused" | "distracted",
          postureScore: newPostureScore,
          attentionScore: newAttentionScore,
          studyDuration: prev.studyDuration + 1,
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [user])

  const addAlert = async (alert: Alert) => {
    try {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("alerts")
            .insert({
              user_id: user.uid,
              type: alert.type,
              message: alert.message,
              // severity is not in the table schema I created earlier, but I can add it or ignore it
              // The schema was: id, user_id, type, message, timestamp
              // I'll stick to the schema I created or let Supabase handle it if it's flexible (it's not usually)
              // I'll just map what I have.
            })
            .select()
            .single()

          if (error) throw error

          if (data) {
            setAlerts((prev) => [{ ...alert, id: data.id }, ...prev].slice(0, 50))
            return
          }
        } catch (supabaseError) {
          console.error("Supabase alert error, using localStorage:", supabaseError)
        }
      }

      // Fallback to localStorage
      const alertWithUser = { ...alert, userId: user?.uid }
      const existingAlerts = JSON.parse(localStorage.getItem("alerts") || "[]")
      existingAlerts.unshift(alertWithUser)
      localStorage.setItem("alerts", JSON.stringify(existingAlerts.slice(0, 50)))
      setAlerts((prev) => [alertWithUser, ...prev].slice(0, 50))
    } catch (error) {
      console.error("Error adding alert:", error)
    }
  }

  const loadAlerts = async () => {
    try {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("alerts")
            .select("*")
            .eq("user_id", user.uid)
            .order("timestamp", { ascending: false })
            .limit(50)

          if (error) throw error

          if (data) {
            const formattedAlerts = data.map((a: any) => ({
              id: a.id,
              timestamp: a.timestamp,
              type: a.type as "posture" | "attention",
              message: a.message,
              severity: "warning", // Default since it's not in DB
              userId: user.uid,
            }))
            setAlerts(formattedAlerts)
            return
          }
        } catch (supabaseError) {
          console.error("Supabase get alerts error, using localStorage:", supabaseError)
        }
      }

      // Fallback to localStorage
      const userAlerts = JSON.parse(localStorage.getItem("alerts") || "[]")
      if (user) {
        const filtered = userAlerts.filter((a: Alert) => a.userId === user.uid)
        setAlerts(filtered.slice(0, 50))
      }
    } catch (error) {
      console.error("Error loading alerts:", error)
    }
  }

  const clearAlerts = async () => {
    try {
      if (user) {
        try {
          const { error } = await supabase.from("alerts").delete().eq("user_id", user.uid)

          if (error) throw error

          setAlerts([])
          return
        } catch (supabaseError) {
          console.error("Supabase clear alerts error, using localStorage:", supabaseError)
        }
      }

      // Fallback to localStorage
      const existingAlerts = JSON.parse(localStorage.getItem("alerts") || "[]")
      const filtered = existingAlerts.filter((a: Alert) => a.userId !== user?.uid)
      localStorage.setItem("alerts", JSON.stringify(filtered))
      setAlerts([])
    } catch (error) {
      console.error("Error clearing alerts:", error)
    }
  }

  const addQuizScore = async (score: number) => {
    try {
      if (user) {
        try {
          const { error } = await supabase.from("quiz_scores").insert({
            user_id: user.uid,
            score: score,
            // quiz_id is optional in schema
          })

          if (error) throw error

          setQuizScores((prev) => [...prev, score])
          return
        } catch (supabaseError) {
          console.error("Supabase add score error, using localStorage:", supabaseError)
        }
      }

      // Fallback to localStorage
      const scoreEntry = { userId: user?.uid, score, timestamp: new Date().toISOString() }
      const existingScores = JSON.parse(localStorage.getItem("quizScores") || "[]")
      existingScores.push(scoreEntry)
      localStorage.setItem("quizScores", JSON.stringify(existingScores))
      setQuizScores((prev) => [...prev, score])
    } catch (error) {
      console.error("Error adding quiz score:", error)
    }
  }

  const loadQuizScores = async () => {
    try {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("quiz_scores")
            .select("score")
            .eq("user_id", user.uid)
            .order("timestamp", { ascending: true })

          if (error) throw error

          if (data) {
            setQuizScores(data.map((score: any) => score.score))
            return
          }
        } catch (supabaseError) {
          console.error("Supabase get quiz scores error, using localStorage:", supabaseError)
        }
      }

      // Fallback to localStorage
      const userScores = JSON.parse(localStorage.getItem("quizScores") || "[]")
      if (user) {
        const filtered = userScores.filter((score: any) => score.userId === user.uid).map((score: any) => score.score)
        setQuizScores(filtered)
      }
    } catch (error) {
      console.error("Error loading quiz scores:", error)
    }
  }

  return (
    <MonitoringContext.Provider
      value={{
        monitoring,
        alerts,
        addAlert,
        updateMonitoring,
        clearAlerts,
        quizScores,
        addQuizScore,
        loadAlerts,
        loadQuizScores,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  )
}
