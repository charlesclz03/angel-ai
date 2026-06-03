import type Stripe from 'stripe'

import {
  createStripeClient,
  getStripeWebhookSecret,
  handleStripeWebhookEvent,
} from '@/lib/billing/stripe'

export async function POST(request: Request) {
  const stripe = createStripeClient()
  const webhookSecret = getStripeWebhookSecret()

  if (!stripe || !webhookSecret) {
    return new Response('Billing webhook is not configured.', { status: 400 })
  }

  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing Stripe signature.', { status: 400 })
  }

  const payload = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch {
    return new Response('Invalid Stripe signature.', { status: 400 })
  }

  await handleStripeWebhookEvent(event)

  return Response.json({ received: true })
}
