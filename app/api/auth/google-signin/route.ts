import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // NOTE: This is a mock implementation for preview mode.
    // In a production environment, you would validate the Google ID token
    // received from the client and extract the user's actual profile information
    // from the token's payload. Replace this mock with a real authentication flow.
    const googleUser = {
      uid: "google_" + Date.now(),
      email: "user@example.com",
      displayName: "Mock Google User - [Replace with actual user name from token]",
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
