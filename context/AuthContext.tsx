"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "../lib/supabase"

interface User {
  uid: string
  email: string
  username: string
  mobileNumber: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  register: (email: string, username: string, password: string, mobileNumber: string) => Promise<boolean>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  loginWithGoogle: async () => false,
  register: async () => false,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUserStr = localStorage.getItem("currentUser")
    if (currentUserStr) {
      try {
        setUser(JSON.parse(currentUserStr))
      } catch (error) {
        console.error(" Error loading user:", error)
      }
    }
    setLoading(false)
  }, [])

  const register = async (
    email: string,
    username: string,
    password: string,
    mobileNumber: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, mobileNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(" Registration error:", errorData)
        return false
      }

      const data = await response.json()
      const newUser = data.user

      // Store in localStorage for preview mode
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      if (!users.find((u: any) => u.email === email)) {
        users.push({ ...newUser, password })
        localStorage.setItem("users", JSON.stringify(users))
      }

      localStorage.setItem("currentUser", JSON.stringify(newUser))
      setUser(newUser)
      return true
    } catch (error) {
      console.error(" Registration error:", error)
      return false
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        console.error(" Login failed")
        return false
      }

      const data = await response.json()
      const userObj = data.user

      localStorage.setItem("currentUser", JSON.stringify(userObj))
      setUser(userObj)
      return true
    } catch (error) {
      try {
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const foundUser = users.find((u: any) => u.email === email && u.password === password)
        if (foundUser) {
          const userObj = {
            uid: foundUser.uid,
            email: foundUser.email,
            username: foundUser.username,
            mobileNumber: foundUser.mobileNumber,
          }
          localStorage.setItem("currentUser", JSON.stringify(userObj))
          setUser(userObj)
          return true
        }
      } catch (fallbackError) {
        console.error(" Login error:", fallbackError)
      }
      return false
    }
  }

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/google-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        console.error(" Google sign-in failed")
        return false
      }

      const data = await response.json()
      const userObj = {
        uid: data.user.uid || "google_" + Date.now(),
        email: data.user.email,
        username: data.user.displayName || data.user.email.split("@")[0],
        mobileNumber: "",
      }

      try {
        const { error } = await supabase.from("users").upsert({
          id: userObj.uid,
          email: userObj.email,
          name: userObj.username,
        })
        if (error) console.error(" Supabase user sync error:", error)
      } catch (sbError) {
        console.error(" Supabase error:", sbError)
      }

      localStorage.setItem("currentUser", JSON.stringify(userObj))
      setUser(userObj)
      return true
    } catch (error) {
      console.error(" Google sign-in error:", error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    localStorage.removeItem("currentUser")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
