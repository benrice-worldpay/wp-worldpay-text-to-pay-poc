# Worldpay Text-to-Pay

A web application for sending Text-to-Pay invoices to customers using Worldpay's API.

## Overview

This application allows businesses to:
- Create and send Text-to-Pay invoices to customers
- Track payment status in real-time
- View transaction history
- Export payment data

## Prerequisites

- Node.js 18+ and npm
- Worldpay API credentials (API Key and Merchant ID)
- Pusher account for real-time updates

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Set up environment variables (see below)
4. Start the application:
   \`\`\`
   npm run dev
   \`\`\`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

\`\`\`
# Worldpay API Credentials
WORLDPAY_API_KEY=your_worldpay_api_key
WORLDPAY_MID=your_worldpay_merchant_id

# Pusher Configuration (required for real-time updates)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster

# Server Port (optional, defaults to 3000)
PORT=3000
\`\`\`

## Setting Up Pusher

1. Create a free account at [pusher.com](https://pusher.com)
2. Create a new Channels app
3. Copy your app credentials to the `.env` file
4. Set up a webhook in your Pusher dashboard pointing to `/api/webhooks/payment`

## Worldpay Configuration

1. Ensure you have API access to Worldpay's Text-to-Pay service
2. Configure your Worldpay webhook to point to `/api/webhooks/payment`

## Usage

1. Fill out the invoice form with customer and payment details
2. Send the Text-to-Pay invoice
3. The customer will receive a text message with payment instructions
4. Track payment status in real-time through the application
5. View transaction history and payment details

## Features

- Real-time payment status updates
- Transaction history
- Payment details view
- Data export functionality
- Mobile-responsive design
