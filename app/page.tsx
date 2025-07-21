"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import {
  CreditCard,
  CheckCircle,
  Clock,
  DollarSign,
  Smartphone,
  FileText,
  Trash2,
  Download,
  Eye,
  Plus,
  Wifi,
  WifiOff,
  X,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react"

interface Invoice {
  title: string
  amount: number
  reference: string
  date: string
  status: string
  id?: string
}

interface Customer {
  id: string
  name: string
  contact: {
    phone: string
  }
}

interface Payment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  invoiceTitle: string
  invoiceReference: string
  amount: number
  status: string
  date: string
}

interface Activity {
  id: number
  message: string
  type: string
  timestamp: string
}

export default function TextToPayApp() {
  // State management
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Form states
  const [invoiceTitle, setInvoiceTitle] = useState("")
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [showPaymentStatus, setShowPaymentStatus] = useState(false)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedPayments = localStorage.getItem("payments")
    const savedCustomers = localStorage.getItem("customers")
    const savedActivities = localStorage.getItem("activity")

    if (savedPayments) setPayments(JSON.parse(savedPayments))
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers))
    if (savedActivities) setActivities(JSON.parse(savedActivities))

    // Initialize Pusher connection
    initializePusher()
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("payments", JSON.stringify(payments))
  }, [payments])

  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers))
  }, [customers])

  useEffect(() => {
    localStorage.setItem("activity", JSON.stringify(activities))
  }, [activities])

  // Initialize Pusher connection
  const initializePusher = async () => {
    try {
      // Get Pusher configuration from server
      const response = await fetch("/api/pusher-config")
      const config = await response.json()

      // Import Pusher dynamically
      const Pusher = (await import("pusher-js")).default

      const pusher = new Pusher(config.key, {
        cluster: config.cluster,
        forceTLS: true,
      })

      const channel = pusher.subscribe("payment-updates")

      // Connection state handlers
      pusher.connection.bind("connected", () => {
        setIsConnected(true)
        // Removed the activity log for connection
      })

      pusher.connection.bind("disconnected", () => {
        setIsConnected(false)
        addActivity("Disconnected from real-time updates", "warning")
      })

      channel.bind("payment-updated", (data: any) => {
        console.log("Payment update received:", data)

        const { paymentId, status, customerId } = data

        // Update payments state using functional update
        setPayments((prevPayments) => {
          const matchingPayment = prevPayments.find((p) => p.id === paymentId)

          if (matchingPayment) {
            console.log(`Found matching payment: ${paymentId}, updating status to: ${status}`)

            const newStatus = status === "completed" ? "Completed" : status

            // Update the payments array
            const updatedPayments = prevPayments.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))

            // Show notification and add activity
            const customerName = matchingPayment.customerName
            if (status === "completed") {
              triggerConfetti()
              addActivity(`🎉 Payment completed for ${customerName}!`, "success")
            } else {
              showNotification(`Payment status updated to ${status} for ${customerName}`, "info")
              addActivity(`Payment status updated to ${status} for ${customerName}`, "info")
            }

            return updatedPayments
          } else {
            console.log(`No matching payment found for ID: ${paymentId}`)
            return prevPayments
          }
        })

        // Update current invoice if it matches
        setCurrentInvoice((prev) => {
          if (prev && prev.id === paymentId) {
            console.log("Updating current invoice status")
            const newStatus = status === "completed" ? "Completed" : status
            return { ...prev, status: newStatus }
          }
          return prev
        })

        // Update selected payment if it matches
        setSelectedPayment((prev) => {
          if (prev && prev.id === paymentId) {
            const newStatus = status === "completed" ? "Completed" : status
            return { ...prev, status: newStatus }
          }
          return prev
        })
      })

      console.log("Pusher initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Pusher:", error)
      setIsConnected(false)
    }
  }

  // Helper functions
  const showNotification = (message: string, type = "info") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const addActivity = (message: string, type = "info") => {
    const activity: Activity = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
    }
    setActivities((prev) => [activity, ...prev.slice(0, 9)])
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const viewPaymentDetails = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId)
    if (payment) {
      setSelectedPayment(payment)
    }
  }

  const triggerConfetti = () => {
    // Create confetti container
    const confettiContainer = document.createElement("div")
    confettiContainer.style.position = "fixed"
    confettiContainer.style.top = "0"
    confettiContainer.style.left = "0"
    confettiContainer.style.width = "100%"
    confettiContainer.style.height = "100%"
    confettiContainer.style.pointerEvents = "none"
    confettiContainer.style.zIndex = "9999"
    document.body.appendChild(confettiContainer)

    // Create multiple confetti pieces
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div")
      confetti.style.position = "absolute"
      confetti.style.width = "10px"
      confetti.style.height = "10px"
      confetti.style.backgroundColor = ["#FF1F3E", "#4C12A1", "#3BCFF0", "#FD8D62", "#A18CDE"][
        Math.floor(Math.random() * 5)
      ]
      confetti.style.left = Math.random() * 100 + "%"
      confetti.style.top = "-10px"
      confetti.style.borderRadius = "50%"
      confetti.style.animation = `confetti-fall ${2 + Math.random() * 3}s linear forwards`
      confettiContainer.appendChild(confetti)
    }

    // Add CSS animation
    if (!document.getElementById("confetti-styles")) {
      const style = document.createElement("style")
      style.id = "confetti-styles"
      style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-10px) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `
      document.head.appendChild(style)
    }

    // Clean up after animation
    setTimeout(() => {
      document.body.removeChild(confettiContainer)
    }, 5000)
  }

  // Handle phone number input with smart US formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "")

    // If empty, set to empty
    if (digitsOnly === "") {
      setCustomerPhone("")
      return
    }

    // If starts with 1 and has more digits, assume it's a US number with country code
    if (digitsOnly.startsWith("1") && digitsOnly.length > 1) {
      setCustomerPhone("+" + digitsOnly)
    }
    // If it's 10 digits and doesn't start with 1, assume it's a US number without country code
    else if (digitsOnly.length <= 10 && !digitsOnly.startsWith("1")) {
      setCustomerPhone("+1" + digitsOnly)
    }
    // If it's more than 10 digits and doesn't start with 1, assume international
    else if (digitsOnly.length > 10 && !digitsOnly.startsWith("1")) {
      setCustomerPhone("+" + digitsOnly)
    }
    // If it's just "1", show "+1"
    else if (digitsOnly === "1") {
      setCustomerPhone("+1")
    }
    // Default case
    else {
      setCustomerPhone("+" + digitsOnly)
    }
  }

  // Statistics calculations
  const totalPayments = payments.length
  const completedPayments = payments.filter((p) => p.status === "Completed").length
  const pendingPayments = payments.filter((p) => p.status === "Pending").length
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0) / 100

  // Event handlers
  const handleSendTextToPay = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountDollars = Number.parseFloat(invoiceAmount)

    if (!invoiceTitle || isNaN(amountDollars) || amountDollars <= 0) {
      showNotification("Please enter a valid title and amount greater than $0.00", "error")
      return
    }

    if (!customerName || !customerPhone) {
      showNotification("Please enter customer name and phone number", "error")
      return
    }

    const phoneRegex = /^\+\d{10,15}$/
    if (!phoneRegex.test(customerPhone)) {
      showNotification("Please enter a valid phone number with country code (e.g., +1234567890)", "error")
      return
    }

    setIsLoading(true)

    try {
      const amount = Math.round(amountDollars * 100)
      const invoiceNumber = `INV-${Date.now()}`
      const invoiceDate = new Date().toLocaleDateString()

      // Create customer via API
      const customerResponse = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: customerName, phone: customerPhone }),
      })

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json()
        throw new Error(errorData.error || "Failed to create customer")
      }

      const customer = await customerResponse.json()
      console.log("Customer created:", customer)

      setCurrentCustomer(customer)
      setCustomers((prev) => [...prev, customer])

      // Create payment via API
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customer.id,
          amount: amount,
          title: invoiceTitle,
          reference: invoiceNumber,
        }),
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        throw new Error(errorData.error || "Failed to create payment")
      }

      const payment = await paymentResponse.json()
      console.log("Payment created:", payment)

      // Create invoice and payment records
      const invoice: Invoice = {
        title: invoiceTitle,
        amount,
        reference: invoiceNumber,
        date: invoiceDate,
        status: "Pending",
        id: payment.id,
      }

      const paymentRecord: Payment = {
        id: payment.id || `pay_${Date.now()}`,
        customerId: customer.id,
        customerName,
        customerPhone,
        invoiceTitle: invoiceTitle,
        invoiceReference: invoiceNumber,
        amount: amount,
        status: "Pending",
        date: new Date().toISOString(),
      }

      setCurrentInvoice(invoice)
      setPayments((prev) => [...prev, paymentRecord])

      // Show payment status
      setShowPaymentStatus(true)

      // Reset forms
      setInvoiceTitle("")
      setInvoiceAmount("")
      setCustomerName("")
      setCustomerPhone("")

      showNotification("Text-to-Pay invoice sent successfully!", "success")
      addActivity(
        `Text-to-Pay sent to ${customerName} (${customerPhone}) - ${invoiceTitle} $${amountDollars.toFixed(2)}`,
        "success",
      )
    } catch (error) {
      console.error("Error:", error)
      showNotification(`Error: ${(error as Error).message}`, "error")
      addActivity(`Error sending payment request: ${(error as Error).message}`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setPayments([])
      setCustomers([])
      setActivities([])
      setCurrentInvoice(null)
      setCurrentCustomer(null)
      setShowPaymentStatus(false)
      setSelectedPayment(null)

      localStorage.removeItem("payments")
      localStorage.removeItem("customers")
      localStorage.removeItem("activity")

      showNotification("All data cleared successfully", "success")
      addActivity("All data cleared", "warning")
    }
  }

  const exportData = () => {
    const data = {
      customers,
      payments,
      activities,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `worldpay-text-to-pay-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)

    showNotification("Data exported successfully", "success")
    addActivity("Data exported", "info")
  }

  const createNewInvoice = () => {
    setCurrentInvoice(null)
    setCurrentCustomer(null)
    setShowPaymentStatus(false)
    setInvoiceTitle("")
    setInvoiceAmount("")
    setCustomerName("")
    setCustomerPhone("")
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      {/* Header with gradient background */}
      <div
        className="text-white p-4"
        style={{
          background: "linear-gradient(135deg, #A1BCDE 0%, #4C12A1 50%, #1B1B6F 100%)",
        }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <Image src="/w-purple-monogram.svg" alt="Worldpay" width={48} height={48} className="rounded-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "Blinker, sans-serif" }}>
                Worldpay Text-to-Pay
              </h1>
              <p className="text-sm opacity-90">Demo Application</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-300" />
                <span className="text-sm">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-300" />
                <span className="text-sm">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="bg-[#FEE7DE] border-l-4 border-[#FD8D62] p-4">
        <div className="container mx-auto flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-[#FD8D62]" />
          <div>
            <p className="text-[#1B1B6F] font-semibold">Demonstration Application Only</p>
            <p className="text-sm text-[#1B1B6F]">
              This is an example application showcasing the Worldpay Text-to-Pay platform capabilities. Not for
              production use.
            </p>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-32 right-4 z-50">
          <Alert
            className={`${
              notification.type === "error"
                ? "border-[#FF1F3E] bg-red-50"
                : notification.type === "success"
                  ? "border-[#4C12A1] bg-[#1B1B6F] text-white"
                  : notification.type === "warning"
                    ? "border-[#FD8D62] bg-yellow-50"
                    : "border-[#3BCFF0] bg-blue-50"
            }`}
          >
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#1B1B6F]" style={{ fontFamily: "Blinker, sans-serif" }}>
                  Payment Details
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-[#505050]">Customer Name</Label>
                  <p className="text-lg text-[#1B1B6F]">{selectedPayment.customerName}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#505050]">Phone Number</Label>
                  <p className="text-lg text-[#1B1B6F]">{selectedPayment.customerPhone}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#505050]">Invoice Title</Label>
                  <p className="text-lg text-[#1B1B6F]">{selectedPayment.invoiceTitle}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#505050]">Invoice Reference</Label>
                  <p className="text-lg font-mono text-sm text-[#1B1B6F]">{selectedPayment.invoiceReference}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#505050]">Amount</Label>
                  <p className="text-2xl font-bold text-[#4C12A1]">${(selectedPayment.amount / 100).toFixed(2)}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#505050]">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={selectedPayment.status === "Completed" ? "default" : "secondary"}
                      className={
                        selectedPayment.status === "Completed"
                          ? "bg-[#4C12A1] text-white"
                          : "bg-[#E5E5E5] text-[#1B1B6F]"
                      }
                    >
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#505050]">Payment ID</Label>
                  <p className="text-sm font-mono bg-[#E7EAF2] p-2 rounded-[20px] break-all text-[#1B1B6F]">
                    {selectedPayment.id}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#505050]">Customer ID</Label>
                  <p className="text-sm font-mono bg-[#E7EAF2] p-2 rounded-[20px] break-all text-[#1B1B6F]">
                    {selectedPayment.customerId}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#505050]">Date Created</Label>
                  <p className="text-lg text-[#1B1B6F]">{new Date(selectedPayment.date).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setSelectedPayment(null)}
                  className="bg-[#FF1F3E] hover:bg-[#e01b37] text-white rounded-[20px]"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-[20px] border-[#E7EAF2]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#505050]">Total Payments</p>
                  <p className="text-2xl font-bold text-[#1B1B6F]" style={{ fontFamily: "Blinker, sans-serif" }}>
                    {totalPayments}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-[#FF1F3E]" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#E7EAF2]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#505050]">Completed</p>
                  <p className="text-2xl font-bold text-[#4C12A1]" style={{ fontFamily: "Blinker, sans-serif" }}>
                    {completedPayments}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-[#4C12A1]" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#E7EAF2]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#505050]">Pending</p>
                  <p className="text-2xl font-bold text-[#FD8D62]" style={{ fontFamily: "Blinker, sans-serif" }}>
                    {pendingPayments}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-[#FD8D62]" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#E7EAF2]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#505050]">Total Amount</p>
                  <p className="text-2xl font-bold text-[#1B1B6F]" style={{ fontFamily: "Blinker, sans-serif" }}>
                    ${totalAmount.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-[#3BCFF0]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="rounded-[20px] border-[#E7EAF2]">
              <CardHeader className="bg-[#F2EEFF] rounded-t-[20px]">
                <CardTitle
                  className="flex items-center space-x-2 text-[#1B1B6F]"
                  style={{ fontFamily: "Blinker, sans-serif" }}
                >
                  <FileText className="h-5 w-5 text-[#4C12A1]" />
                  <span>Create Text-to-Pay Invoice</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Combined Invoice and Text-to-Pay Form */}
                <div>
                  <h3
                    className="text-lg font-semibold mb-4 text-[#1B1B6F]"
                    style={{ fontFamily: "Blinker, sans-serif" }}
                  >
                    Send Text-to-Pay Invoice
                  </h3>
                  <form onSubmit={handleSendTextToPay} className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="invoice-title" className="text-[#1B1B6F] font-medium">
                            Invoice Title
                          </Label>
                          <Input
                            id="invoice-title"
                            value={invoiceTitle}
                            onChange={(e) => setInvoiceTitle(e.target.value)}
                            placeholder="e.g., Monthly Service, Product Purchase"
                            required
                            className="rounded-[20px] border-[#CCD6EA] focus:border-[#FF1F3E] text-[#1B1B6F]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="invoice-amount" className="text-[#1B1B6F] font-medium">
                            Amount ($)
                          </Label>
                          <Input
                            id="invoice-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={invoiceAmount}
                            onChange={(e) => setInvoiceAmount(e.target.value)}
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement
                              if (Number.parseFloat(target.value) < 0) {
                                target.value = ""
                                setInvoiceAmount("")
                              }
                            }}
                            placeholder="10.00"
                            required
                            className="rounded-[20px] border-[#CCD6EA] focus:border-[#FF1F3E] text-[#1B1B6F]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customer-name" className="text-[#1B1B6F] font-medium">
                            Customer Name
                          </Label>
                          <Input
                            id="customer-name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="John Doe"
                            required
                            className="rounded-[20px] border-[#CCD6EA] focus:border-[#FF1F3E] text-[#1B1B6F]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customer-phone" className="text-[#1B1B6F] font-medium">
                            Phone Number
                          </Label>
                          <Input
                            id="customer-phone"
                            type="tel"
                            value={customerPhone}
                            onChange={handlePhoneChange}
                            placeholder="2345678901"
                            required
                            className="rounded-[20px] border-[#CCD6EA] focus:border-[#FF1F3E] text-[#1B1B6F]"
                          />
                          <p className="text-sm text-[#505050] mt-1">
                            Just enter digits - we'll format it as +1XXXXXXXXXX automatically
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Worldpay Test Merchant Contact Information */}
                    <div className="bg-[#F2EEFF] border border-[#A1BCDE] rounded-[20px] p-4">
                      <h4 className="text-[#4C12A1] font-semibold mb-3 flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-[#4C12A1]" />
                        Worldpay Test Merchant Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-[#505050] flex items-center">
                          <Mail className="h-3 w-3 mr-2" />
                          By entering your mobile number, you agree to receive text messages.
                        </p>
                        <p className="text-[#505050]">
                          Standard message and data rates may apply. Message frequency varies.
                        </p>
                        <p className="text-[#505050]">
                          Call 562-567-6776 for help. <span className="font-semibold">Text STOP to cancel.</span>
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full md:w-auto bg-[#FF1F3E] hover:bg-[#e01b37] text-white rounded-[20px] font-semibold"
                      style={{ fontFamily: "Blinker, sans-serif" }}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-4 w-4 mr-2" />
                          Send Text-to-Pay Invoice
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Payment Status */}
                {showPaymentStatus && currentCustomer && currentInvoice && (
                  <div className="border-t border-[#E7EAF2] pt-6">
                    <Card className="border-[#3BCFF0] rounded-[20px]">
                      <CardHeader className="bg-[#DBF8FF] rounded-t-[20px]">
                        <CardTitle
                          className="text-[#1B1B6F] flex items-center"
                          style={{ fontFamily: "Blinker, sans-serif" }}
                        >
                          <Smartphone className="h-5 w-5 mr-2 text-[#3BCFF0]" />
                          Payment Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <Alert className="border-[#3BCFF0] bg-[#DBF8FF] rounded-[20px]">
                          <AlertDescription>
                            <div className="space-y-2 text-[#1B1B6F]">
                              <p>
                                Payment request sent to <strong>{currentCustomer.name}</strong>
                              </p>
                              <p>Phone: {currentCustomer.contact.phone}</p>
                              <p>
                                Invoice: {currentInvoice.title} - ${(currentInvoice.amount / 100).toFixed(2)}
                              </p>
                              <p>
                                Status:{" "}
                                <Badge
                                  variant={currentInvoice.status === "Completed" ? "default" : "secondary"}
                                  className={
                                    currentInvoice.status === "Completed"
                                      ? "bg-[#4C12A1] text-white"
                                      : "bg-[#E5E5E5] text-[#1B1B6F]"
                                  }
                                >
                                  {currentInvoice.status}
                                </Badge>
                              </p>
                              <p className="text-sm text-[#505050]">Payment ID: {currentInvoice.id}</p>
                            </div>
                          </AlertDescription>
                        </Alert>
                        <div className="mt-4 space-x-2">
                          <Button
                            variant="outline"
                            onClick={createNewInvoice}
                            className="border-[#FF1F3E] text-[#FF1F3E] hover:bg-[#FF1F3E] hover:text-white rounded-[20px]"
                            style={{ fontFamily: "Blinker, sans-serif" }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Send Another Invoice
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Test Card Information */}
            <Card className="rounded-[20px] border-[#E7EAF2]">
              <CardHeader>
                <CardTitle className="text-[#1B1B6F]" style={{ fontFamily: "Blinker, sans-serif" }}>
                  Test Card Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-gradient-to-r from-[#4C12A1] to-[#1B1B6F] text-white p-4 rounded-[15px] w-full max-w-[280px] shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs opacity-80">TEST CARD ONLY</p>
                        <p className="font-bold">Worldpay Demo</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white rounded-full mr-1"></div>
                        <div className="w-8 h-8 bg-[#FD8D62] rounded-full opacity-70"></div>
                      </div>
                    </div>
                    <p className="font-mono text-lg tracking-wider mb-3">4444 3333 2222 1111</p>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs opacity-80">VALID THRU</p>
                        <p className="font-mono">12/28</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-80">CVV</p>
                        <p className="font-mono">123</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center font-bold text-[#1B1B6F]">Use this test card on your phone</p>
                  <p className="text-center font-medium text-[#FF1F3E] flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Never use real cards!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="rounded-[20px] border-[#E7EAF2]">
              <CardHeader>
                <CardTitle className="text-[#1B1B6F]" style={{ fontFamily: "Blinker, sans-serif" }}>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  onClick={clearAllData}
                  className="w-full border-[#FD8D62] text-[#FD8D62] hover:bg-[#FD8D62] hover:text-white rounded-[20px]"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
                <Button
                  variant="outline"
                  onClick={exportData}
                  className="w-full border-[#4C12A1] text-[#4C12A1] hover:bg-[#4C12A1] hover:text-white rounded-[20px]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="rounded-[20px] border-[#E7EAF2]">
              <CardHeader>
                <CardTitle className="text-[#1B1B6F]" style={{ fontFamily: "Blinker, sans-serif" }}>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-[#505050] text-sm">No recent activity</p>
                  ) : (
                    activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === "success"
                              ? "bg-[#4C12A1]"
                              : activity.type === "error"
                                ? "bg-[#FF1F3E]"
                                : activity.type === "warning"
                                  ? "bg-[#FD8D62]"
                                  : "bg-[#3BCFF0]"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-[#1B1B6F]">{activity.message}</p>
                          <p className="text-xs text-[#505050]">{getTimeAgo(new Date(activity.timestamp))}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <Card className="mt-6 rounded-[20px] border-[#E7EAF2]">
          <CardHeader>
            <CardTitle className="text-[#1B1B6F]" style={{ fontFamily: "Blinker, sans-serif" }}>
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E7EAF2]">
                    <th className="text-left p-2 text-[#1B1B6F] font-semibold">Customer</th>
                    <th className="text-left p-2 text-[#1B1B6F] font-semibold">Invoice</th>
                    <th className="text-left p-2 text-[#1B1B6F] font-semibold">Amount</th>
                    <th className="text-left p-2 text-[#1B1B6F] font-semibold">Status</th>
                    <th className="text-left p-2 text-[#1B1B6F] font-semibold">Date</th>
                    <th className="text-left p-2 text-[#1B1B6F] font-semibold">Payment ID</th>
                    <th className="text-left p-2 text-[#1B1B6F] font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-4 text-[#505050]">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    payments
                      .slice()
                      .reverse()
                      .map((payment) => (
                        <tr key={payment.id} className="border-b border-[#E7EAF2]">
                          <td className="p-2 text-[#1B1B6F]">{payment.customerName}</td>
                          <td className="p-2 text-[#1B1B6F]">{payment.invoiceTitle}</td>
                          <td className="p-2 text-[#1B1B6F]">${(payment.amount / 100).toFixed(2)}</td>
                          <td className="p-2">
                            <Badge
                              variant={payment.status === "Completed" ? "default" : "secondary"}
                              className={
                                payment.status === "Completed"
                                  ? "bg-[#4C12A1] text-white"
                                  : "bg-[#E5E5E5] text-[#1B1B6F]"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-[#1B1B6F]">{new Date(payment.date).toLocaleDateString()}</td>
                          <td className="p-2 text-xs text-[#505050]">{payment.id}</td>
                          <td className="p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewPaymentDetails(payment.id)}
                              className="border-[#3BCFF0] text-[#3BCFF0] hover:bg-[#3BCFF0] hover:text-white rounded-[20px]"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-[#1B1B6F] text-white p-6 mt-8">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            © 2024 Worldpay, LLC. Worldpay® | This is a demonstration application for the Worldpay Text-to-Pay platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
