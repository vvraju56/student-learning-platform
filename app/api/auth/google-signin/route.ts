import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Generate a mock Google user response for preview mode
    // In production, this would validate the Google ID token
    const googleUser = {
      uid: "google_" + Date.now(),
      email: "user@example.com",
      displayName: "Google User",
      photoURL: "https://via.placeholder.com/150",
    }

    // Store in localStorage
    // The client will handle persistence

    return NextResponse.json({ user: googleUser }, { status: 200 })
  } catch (error) {
    console.error(" Google sign-in error:", error)
    return NextResponse.json({ error: "Google sign-in failed" }, { status: 500 })
  }
}
