"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../lib/firebase"
import { SmartDashboard } from "../../components/smart-dashboard"
import { MonitoringProvider } from "../../contexts/monitoring-context"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)
      setProfile({
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" 
           style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <MonitoringProvider userId={user?.uid}>
      <SmartDashboard user={user} profile={profile} handleLogout={handleLogout} />
    </MonitoringProvider>
  )
}