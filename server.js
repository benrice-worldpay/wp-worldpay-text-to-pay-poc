import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Pusher from 'pusher';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
});

// Worldpay API configuration
const WORLDPAY_API_KEY = process.env.WORLDPAY_API_KEY;
const WORLDPAY_MID = process.env.WORLDPAY_MID;
const WORLDPAY_BASE_URL = 'https://apis.stage.worldpay.com/text-to-pay';

// Helper function for Worldpay API requests
async function worldpayRequest(endpoint, method, body = null) {
  const timestamp = new Date().toISOString();
  const correlationId = crypto.randomUUID();
  
  const headers = {
    'accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WORLDPAY_API_KEY}`,
    'X-WP-Diagnostics-CorrelationId': correlationId,
    'X-WP-Diagnostics-CallerId': 'text-to-pay-poc',
    'X-WP-Timestamp': timestamp
  };
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  try {
    const response = await fetch(`${WORLDPAY_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worldpay API error: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Worldpay API request failed:', error);
    throw error;
  }
}

// API Routes

// Pusher configuration endpoint
app.get('/api/pusher-config', (req, res) => {
  res.json({
    key: process.env.PUSHER_KEY,
    cluster: process.env.PUSHER_CLUSTER || 'us2'
  });
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    
    // Validate phone number format
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format. Use +1234567890' });
    }
    
    const customerData = {
      name,
      contact: {
        phone
      }
    };
    
    console.log('Creating customer:', customerData);
    const customer = await worldpayRequest(`/v1/merchants/${WORLDPAY_MID}/customers`, 'POST', customerData);
    console.log('Customer created:', customer);
    
    res.json(customer);
  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await worldpayRequest(`/v1/merchants/${WORLDPAY_MID}/customers/${id}`, 'GET');
    res.json(customer);
  } catch (error) {
    console.error('Customer fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { customerId, amount, title, reference } = req.body;
    
    if (!customerId || !amount || !title) {
      return res.status(400).json({ error: 'Customer ID, amount, and title are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    const paymentData = {
      totalAmount: amount,
      currency: "USD",
      invoices: [
        {
          title,
          reference: reference || `INV-${Date.now()}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          amount
        }
      ],
      message: {
        text: "Thank you for your business. Please pay your invoice."
      }
    };
    
    console.log('Creating payment:', paymentData);
    const payment = await worldpayRequest(`/v1/merchants/${WORLDPAY_MID}/customers/${customerId}/payments`, 'POST', paymentData);
    console.log('Payment created:', payment);
    
    res.json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for payment updates
app.post('/api/webhooks/payment', (req, res) => {
  try {
    const paymentUpdate = req.body;
    console.log('Webhook received:', paymentUpdate);
    
    // Broadcast the payment update to connected clients
    pusher.trigger('payment-updates', 'payment-updated', {
      payment: paymentUpdate
    });
    
    console.log('Payment update broadcasted via Pusher');
    res.status(200).json({ message: 'Webhook received and processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: {
      hasWorldpayKey: !!WORLDPAY_API_KEY,
      hasWorldpayMid: !!WORLDPAY_MID,
      hasPusherConfig: !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET)
    }
  });
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`
🚀 Worldpay Text-to-Pay POC Server
==================================
Server running on: http://localhost:${PORT}

API Endpoints:
- GET  /api/health - Health check
- GET  /api/pusher-config - Pusher configuration
- POST /api/customers - Create customer
- GET  /api/customers/:id - Get customer
- POST /api/payments - Create payment
- POST /api/webhooks/payment - Payment webhook

Environment Check:
- Worldpay API Key: ${WORLDPAY_API_KEY ? '✅ Set' : '❌ Missing'}
- Worldpay MID: ${WORLDPAY_MID ? '✅ Set' : '❌ Missing'}
- Pusher Config: ${process.env.PUSHER_APP_ID && process.env.PUSHER_KEY ? '✅ Set' : '❌ Missing'}

Pusher Channel: payment-updates
Pusher Event: payment-updated
`);
});
