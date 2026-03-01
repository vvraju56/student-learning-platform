"use server"

import { db } from "@/lib/firebase"
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore"
import { sendOTP, verifyOTP as verifyOTPService, resendOTP as resendOTPService } from "@/lib/otp-service"

export async function requestOTP(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  const result = await sendOTP(email)
  return result
}

export async function verifyEmailOTP(formData: FormData) {
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string

  if (!email || !otp) {
    return { error: "Email and OTP are required" }
  }

  const result = await verifyOTPService(email, otp)

  if (result.valid) {
    const profileRef = doc(db, "email_verifications", email)
    const profileSnap = await getDoc(profileRef)
    
    if (profileSnap.exists()) {
      await updateDoc(profileRef, { emailVerified: true })
    } else {
      await setDoc(profileRef, { 
        email, 
        emailVerified: true, 
        createdAt: new Date().toISOString() 
      })
    }

    return { success: true, message: "Email verified successfully!" }
  }

  return { error: result.error }
}

export async function resendOTP(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  const result = await resendOTPService(email)
  return result
}
