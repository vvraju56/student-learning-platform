import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get("next") ?? "/dashboard"

  // Firebase handles auth state automatically, no callback needed
  return NextResponse.redirect(`${origin}${next}`)
}
