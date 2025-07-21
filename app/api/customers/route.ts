import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json()
    console.log("Creating customer:", { name, phone })

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^\+\d{10,15}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number format. Use +1234567890" }, { status: 400 })
    }

    const customerData = {
      name,
      contact: {
        phone,
      },
    }

    // Check if environment variables are set
    const WORLDPAY_API_KEY = process.env.WORLDPAY_API_KEY
    const WORLDPAY_MID = process.env.WORLDPAY_MID

    if (!WORLDPAY_API_KEY || !WORLDPAY_MID) {
      console.error("Missing Worldpay credentials")
      return NextResponse.json({ error: "Worldpay credentials not configured" }, { status: 500 })
    }

    const WORLDPAY_BASE_URL = "https://apis.stage.worldpay.com/text-to-pay"

    const timestamp = new Date().toISOString()
    const correlationId = crypto.randomUUID()

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${WORLDPAY_API_KEY}`,
      "X-WP-Diagnostics-CorrelationId": correlationId,
      "X-WP-Diagnostics-CallerId": "text-to-pay-poc",
      "X-WP-Timestamp": timestamp,
    }

    console.log("Calling Worldpay API:", `${WORLDPAY_BASE_URL}/v1/merchants/${WORLDPAY_MID}/customers`)

    const response = await fetch(`${WORLDPAY_BASE_URL}/v1/merchants/${WORLDPAY_MID}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify(customerData),
    })

    console.log("Worldpay response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Worldpay API error:", errorText)
      throw new Error(`Worldpay API error: ${response.status} - ${errorText}`)
    }

    const customer = await response.json()
    console.log("Customer created successfully:", customer)
    return NextResponse.json(customer)
  } catch (error) {
    console.error("Customer creation error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
