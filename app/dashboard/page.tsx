"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../lib/firebase"
import { SmartDashboard } from "../../components/smart-dashboard"
import { MonitoringProvider } from "../../contexts/monitoring-context"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth?mode=signin")
        return
      }

      // Redirect admin to admin panel
      if (currentUser.email === "admin@123.in") {
        router.push("/admin")
        return
      }

      // SECURITY CHECK: Ensure user profile still exists and is not deleted
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        const profileDoc = await getDoc(doc(db, "profiles", currentUser.uid))
        
        const exists = userDoc.exists() || profileDoc.exists()
        const isDeleted = userDoc.data()?.deleted === true || profileDoc.data()?.deleted === true

        if (!exists || isDeleted) {
          await signOut(auth)
          router.push("/auth?mode=signin")
          return
        }

        setUser(currentUser)
        setProfile(profileDoc.exists() ? profileDoc.data() : {
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL
        })
      } catch (err) {
        console.error("Dashboard auth check error:", err)
      }
      
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