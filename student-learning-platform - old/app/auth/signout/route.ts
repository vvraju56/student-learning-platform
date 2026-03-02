import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  await signOut(auth)

  const url = new URL(request.url)
  return NextResponse.redirect(new URL("/login", url.origin))
}
