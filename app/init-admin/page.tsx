"use client"

import { useState } from "react"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

export default function InitAdminPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")
  const router = useRouter()

  const ADMIN_EMAIL = "admin@123.in"
  const ADMIN_PASS = "admin123"

  const createAdmin = async () => {
    setLoading(true)
    setStatus("Initializing admin creation...")
    
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS)
      const user = userCredential.user
      
      setStatus("Auth account created. Updating profile...")
      await updateProfile(user, { displayName: "Mega" })

      // 2. Create Profile & User documents
      const profileData = {
        id: user.uid,
        username: "Mega",
        email: ADMIN_EMAIL,
        full_name: "Mega Admin",
        role: "admin",
        total_videos_watched: 0,
        total_quizzes_passed: 0,
        average_focus_score: 0,
        average_posture_score: 0,
        study_streak: 0,
        last_study_date: null,
        created_at: new Date().toISOString()
      }

      setStatus("Saving Firestore data...")
      await Promise.all([
        setDoc(doc(db, "profiles", user.uid), profileData),
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: ADMIN_EMAIL,
          username: "Mega",
          role: "admin",
          createdAt: profileData.created_at,
          deleted: false,
          deletedAt: null,
          restoreBefore: null
        })
      ])

      setStatus("✅ Admin created successfully! Redirecting to login...")
      setTimeout(() => router.push("/auth?mode=signin"), 2000)
    } catch (error: any) {
      console.error(error)
      if (error.code === "auth/email-already-in-use") {
        setStatus("⚠️ Admin email already exists. You can try to log in.")
      } else {
        setStatus("❌ Error: " + error.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-sans p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl shadow-2xl border border-cyan-500/30">
        <h1 className="text-3xl font-bold mb-6 text-center text-cyan-400 tracking-tight">Admin Initialization</h1>
        <p className="text-gray-400 mb-8 text-center text-sm">
          Click the button below to initialize the admin account with credentials:
          <br/><span className="text-white font-mono mt-2 block">admin@123.in / admin123</span>
        </p>
        
        <button
          onClick={createAdmin}
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold transition-all disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Admin Account"}
        </button>

        {status && (
          <div className={`mt-6 p-4 rounded text-sm text-center ${status.includes("✅") ? "bg-green-500/20 text-green-400" : "bg-cyan-500/10 text-cyan-300"}`}>
            {status}
          </div>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push("/auth?mode=signin")}
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
