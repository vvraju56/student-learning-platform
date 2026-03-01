"use server"

import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

export async function signupWithGmail(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string

  if (!email || !password || !username) {
    return { error: "Missing fields" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" }
  }

  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/
  if (!specialCharRegex.test(password)) {
    return { error: "Password must contain at least one special character" }
  }

  try {
    const profileRef = doc(db, "profiles", email)
    const profileSnap = await getDoc(profileRef)
    
    if (profileSnap.exists()) {
      const existingData = profileSnap.data()
      if (!existingData.emailVerified) {
        return { needsVerification: true, email, message: "Please verify your email to complete registration" }
      }
      return { error: "This email is already registered. Please log in." }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await updateProfile(user, { displayName: username })

    const profileData = {
      id: user.uid,
      username,
      email,
      emailVerified: false,
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
    console.error("Unexpected signup error:", err)
    if (err.code === "auth/email-already-in-use") {
      return { error: "This email is already registered. Please log in." }
    }
    if (err.code === "auth/weak-password") {
      return { error: "Password is too weak." }
    }
    return { error: err.message || "An unexpected error occurred during signup." }
  }
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true, message: "Password reset email sent" }
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      return { error: "No account found with this email" }
    }
    return { error: "Failed to send reset email" }
  }
}
