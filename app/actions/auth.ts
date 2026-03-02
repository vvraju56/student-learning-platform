"use server"

import { auth, db, realtimeDb } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"

export async function signup(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string

  if (!email || !password || !username) {
    return { error: "All fields are required" }
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await updateProfile(user, { displayName: username })

    const profileData = {
      id: user.uid,
      username,
      email,
      full_name: "",
      total_videos_watched: 0,
      total_quizzes_passed: 0,
      average_focus_score: 0,
      average_posture_score: 0,
      study_streak: 0,
      last_study_date: null,
      created_at: new Date().toISOString()
    }

    await setDoc(doc(db, "profiles", user.uid), profileData)

    return { success: true }
  } catch (err: any) {
    console.error("Signup error:", err)
    if (err.code === "auth/email-already-in-use") {
      return { error: "This email is already registered. Please log in." }
    }
    if (err.code === "auth/weak-password") {
      return { error: "Password should be at least 6 characters." }
    }
    return { error: err.message || "An unexpected error occurred." }
  }
}
