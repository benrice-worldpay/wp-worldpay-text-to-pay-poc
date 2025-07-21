import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: {
      hasWorldpayKey: !!process.env.WORLDPAY_API_KEY,
      hasWorldpayMid: !!process.env.WORLDPAY_MID,
      hasPusherConfig: !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET),
    },
  })
}
