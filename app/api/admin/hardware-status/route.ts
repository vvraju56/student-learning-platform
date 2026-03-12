import { NextRequest, NextResponse } from "next/server"
import { adminRealtime } from "@/lib/firebase-admin"

const ADMIN_EMAIL = "admin@123.in"

type HardwareNode = {
  lastHeartbeat?: number
  [key: string]: any
}

function selectBestDeviceId(nodes: Record<string, HardwareNode>): string | null {
  const entries = Object.entries(nodes)
    .filter(([key, value]) => typeof key === "string" && key.trim().length > 0 && value && typeof value === "object")
    .sort((a, b) => {
      const aHeartbeat = Number(a[1]?.lastHeartbeat) || 0
      const bHeartbeat = Number(b[1]?.lastHeartbeat) || 0
      return bHeartbeat - aHeartbeat
    })

  return entries.length > 0 ? entries[0][0] : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")?.trim()
    const requestedDeviceId = searchParams.get("deviceId")?.trim() || ""
    const adminEmail = searchParams.get("adminEmail")?.trim().toLowerCase()

    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
    }

    if (!adminRealtime) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin Realtime Database is not configured. Add firebase-service-account.json on the server."
        },
        { status: 503 }
      )
    }

    // 1) If a specific device is requested, try it first.
    if (requestedDeviceId) {
      const specificSnapshot = await adminRealtime.ref(`hardwareStatus/${userId}/${requestedDeviceId}`).get()
      if (specificSnapshot.exists()) {
        return NextResponse.json({ success: true, deviceId: requestedDeviceId, status: specificSnapshot.val() })
      }
    }

    // 2) Auto-pick the freshest device for this user.
    const userHardwareSnapshot = await adminRealtime.ref(`hardwareStatus/${userId}`).get()
    if (!userHardwareSnapshot.exists()) {
      return NextResponse.json({ success: true, deviceId: requestedDeviceId || null, status: null })
    }

    const userHardware = userHardwareSnapshot.val() as Record<string, HardwareNode>
    const selectedDeviceId = selectBestDeviceId(userHardware)

    if (!selectedDeviceId) {
      return NextResponse.json({ success: true, deviceId: requestedDeviceId || null, status: null })
    }

    return NextResponse.json({
      success: true,
      deviceId: selectedDeviceId,
      status: userHardware[selectedDeviceId] ?? null
    })
  } catch (error: any) {
    console.error("Admin hardware status API error:", error)
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 })
  }
}
