"use server"

import nodemailer from "nodemailer"

const EMAIL = process.env.EMAIL || "codetech9227@gmail.com"
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "ysxf ygnf iorx tbew"

interface OTPEntry {
  email: string
  otp: string
  expiresAt: number
  attempts: number
}

const otpStore: Map<string, OTPEntry> = new Map()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL,
    pass: EMAIL_PASSWORD
  }
})

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(email: string): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    if (!email || !email.includes("@")) {
      return { error: "Invalid email address" }
    }

    const existingOTP = otpStore.get(email)
    if (existingOTP) {
      const timeSinceLastOTP = Date.now() - (existingOTP.expiresAt - 5 * 60 * 1000)
      if (timeSinceLastOTP < 60000) {
        return { error: "Please wait 60 seconds before requesting a new OTP" }
      }
    }

    const otp = generateOTP()
    const expiresAt = Date.now() + 5 * 60 * 1000

    otpStore.set(email, { email, otp, expiresAt, attempts: 0 })

    const mailOptions = {
      from: `"LearnAI" <${EMAIL}>`,
      to: email,
      subject: "Your OTP for Account Verification",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #1a1a2e; margin: 0; }
            .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 8px; }
            .footer { text-align: center; color: #666666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LearnAI</h1>
            </div>
            <p>Hello,</p>
            <p>Your One-Time Password (OTP) for account verification is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>Valid for 5 minutes only.</strong></p>
            <p>If you didn't request this OTP, please ignore this email.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LearnAI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)

    return { success: true, message: "OTP sent to your email" }
  } catch (error: any) {
    console.error("Error sending OTP:", error)
    return { error: "Failed to send OTP. Please try again." }
  }
}

export async function verifyOTP(email: string, otp: string): Promise<{ success?: boolean; error?: string; valid?: boolean }> {
  try {
    if (!email || !otp) {
      return { error: "Email and OTP are required" }
    }

    const otpEntry = otpStore.get(email)

    if (!otpEntry) {
      return { error: "No OTP found. Please request a new OTP." }
    }

    if (Date.now() > otpEntry.expiresAt) {
      otpStore.delete(email)
      return { error: "OTP has expired. Please request a new one." }
    }

    if (otpEntry.attempts >= 5) {
      otpStore.delete(email)
      return { error: "Too many attempts. Please request a new OTP." }
    }

    if (otpEntry.otp !== otp) {
      otpEntry.attempts += 1
      otpStore.set(email, otpEntry)
      return { valid: false, error: `Incorrect OTP. ${5 - otpEntry.attempts} attempts remaining.` }
    }

    otpStore.delete(email)
    return { success: true, valid: true }
  } catch (error: any) {
    console.error("Error verifying OTP:", error)
    return { error: "Failed to verify OTP" }
  }
}

export async function resendOTP(email: string): Promise<{ success?: boolean; error?: string }> {
  otpStore.delete(email)
  return sendOTP(email)
}
