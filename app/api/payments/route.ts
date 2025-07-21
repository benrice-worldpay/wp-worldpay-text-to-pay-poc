import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { customerId, amount, title, reference } = await request.json()
    console.log("Creating payment:", { customerId, amount, title, reference })

    if (!customerId || !amount || !title) {
      return NextResponse.json({ error: "Customer ID, amount, and title are required" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    const paymentData = {
      totalAmount: amount,
      currency: "USD",
      invoices: [
        {
          title,
          reference: reference || `INV-${Date.now()}`,
          invoiceDate: new Date().toISOString().split("T")[0],
          amount,
        },
      ],
      message: {
        text: "Thank you for your business. Please pay your invoice.",
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

    console.log(
      "Calling Worldpay API:",
      `${WORLDPAY_BASE_URL}/v1/merchants/${WORLDPAY_MID}/customers/${customerId}/payments`,
    )

    const response = await fetch(`${WORLDPAY_BASE_URL}/v1/merchants/${WORLDPAY_MID}/customers/${customerId}/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify(paymentData),
    })

    console.log("Worldpay response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Worldpay API error:", errorText)
      throw new Error(`Worldpay API error: ${response.status} - ${errorText}`)
    }

    const payment = await response.json()
    console.log("Payment created successfully:", payment)
    return NextResponse.json(payment)
  } catch (error) {
    console.error("Payment creation error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
