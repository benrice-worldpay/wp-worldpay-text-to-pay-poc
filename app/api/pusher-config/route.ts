import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    key: process.env.PUSHER_KEY,
    cluster: process.env.PUSHER_CLUSTER || "us2",
  })
}
