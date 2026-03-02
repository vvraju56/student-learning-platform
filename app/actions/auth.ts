"use server"

import { auth, db, realtimeDb } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { ref, set, get, remove } from "firebase/database"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: 'codetech9227@gmail.com',
    pass: 'ysxfygnfiorxtbew'
  }
})

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(email: string) {
  if (!email) return { error: "Email is required" }

  const otp = generateOTP()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
  
  // Replace dots in email for Firebase Realtime DB path
  const safeEmail = email.replace(/\./g, '_')

  try {
    // Store in Realtime Database instead of Firestore
    try {
      if (!realtimeDb) {
        console.warn("Realtime DB not available, creating OTP without storage")
      } else {
        await set(ref(realtimeDb, `otps/${safeEmail}`), {
          otp,
          expiresAt
        })
      }
    } catch (dbErr: any) {
      console.error("Realtime DB Error:", dbErr)
      // Continue even if storage fails
    }

    const mailOptions = {
      from: '"MEGA Learning Platform" <codetech9227@gmail.com>',
      to: email,
      subject: "Verify Your Email - OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #00d4ff; text-align: center;">Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for signing up with MEGA Learning Platform. Your verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a1a2e; background: #f4f4f4; padding: 10px 20px; border-radius: 5px;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 MEGA Learning Platform</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (err: any) {
    console.error("Email Sending Error:", err)
    return { error: `Email Error: ${err.message || "Failed to send verification email"}` }
  }
}

export async function verifyOTPAndSignup(formData: FormData, otpValue: string) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string

  if (!email || !password || !username || !otpValue) {
    return { error: "Missing fields" }
  }

  const safeEmail = email.replace(/\./g, '_')

  try {
    if (!realtimeDb) throw new Error("Realtime DB not available")
    
    const otpRef = ref(realtimeDb, `otps/${safeEmail}`)
    const snapshot = await get(otpRef)

    if (!snapshot.exists()) {
      return { error: "OTP expired or not found. Please request a new one." }
    }

    const { otp, expiresAt } = snapshot.val()

    if (Date.now() > expiresAt) {
      await remove(otpRef)
      return { error: "OTP expired. Please request a new one." }
    }

    if (otp !== otpValue) {
      return { error: "Invalid verification code. Please try again." }
    }

    // OTP is valid, proceed with signup
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile
    await updateProfile(user, { displayName: username })

    // Create profile
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

    // Cleanup OTP
    await remove(otpRef)

    return { success: true }
  } catch (err: any) {
    console.error("Signup verification error:", err)
    if (err.code === "auth/email-already-in-use") {
      return { error: "This email is already registered. Please log in." }
    }
    return { error: err.message || "An unexpected error occurred during verification." }
  }
}
