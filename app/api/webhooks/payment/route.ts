import { type NextRequest, NextResponse } from "next/server"
import { pusher } from "@/lib/pusher"

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json()
    console.log("=== WEBHOOK RECEIVED ===")
    console.log("Full webhook data:", JSON.stringify(webhookData, null, 2))

    // Extract payment details from the webhook
    const { eventType, data } = webhookData

    if (eventType === "texttopay.conversation.status" && data?.paymentDetails) {
      const { paymentDetails, customerId, merchantId } = data
      const { id: paymentId, status, lastUpdatedDateTime } = paymentDetails

      console.log(`=== PROCESSING PAYMENT UPDATE ===`)
      console.log(`Payment ID: ${paymentId}`)
      console.log(`Status: ${status}`)
      console.log(`Customer: ${customerId}`)

      // Broadcast the payment update to connected clients
      const pusherPayload = {
        paymentId,
        customerId,
        merchantId,
        status,
        lastUpdatedDateTime,
        eventType,
      }

      console.log("=== BROADCASTING TO PUSHER ===")
      console.log("Payload:", JSON.stringify(pusherPayload, null, 2))

      await pusher.trigger("payment-updates", "payment-updated", pusherPayload)

      console.log("=== PUSHER BROADCAST SUCCESSFUL ===")
      return NextResponse.json({
        message: "Webhook received and processed",
        processed: true,
        paymentId,
        status,
      })
    } else {
      console.log("=== WEBHOOK NOT PROCESSED ===")
      console.log("Event type:", eventType)
      console.log("Has payment details:", !!data?.paymentDetails)
      return NextResponse.json({ message: "Webhook received but not processed", processed: false })
    }
  } catch (error) {
    console.error("=== WEBHOOK ERROR ===", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
