import { NextResponse } from "next/server"
import { createAdminUser } from "@/app/actions/admin"

export async function POST() {
  const result = await createAdminUser()
  return NextResponse.json(result)
}
