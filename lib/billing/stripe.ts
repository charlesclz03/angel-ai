import Stripe from 'stripe'

import {
  clearSubscriptionByStripeCustomerId,
  getTierForStripeStatus,
  syncSubscriptionFromStripeSubscription,
} from '@/lib/billing/subscription-sync'
import type { CheckoutPlan, CheckoutSessionResult } from '@/lib/billing/types'
import { prisma } from '@/lib/prisma'

const SUBSCRIPTION_PLANS: CheckoutPlan[] = ['monthly_core', 'monthly_pro']

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    'http://localhost:3000'
  )
}

function getPriceIdForPlan(plan: CheckoutPlan) {
  switch (plan) {
    case 'monthly_core':
      return process.env.STRIPE_PRICE_ID_MONTHLY_CORE?.trim() || null
    case 'monthly_pro':
      return process.env.STRIPE_PRICE_ID_MONTHLY_PRO?.trim() || null
    case 'stellar_insight':
      return process.env.STRIPE_PRICE_ID_STELLAR_INSIGHT?.trim() || null
    case 'midnight_channel':
      return process.env.STRIPE_PRICE_ID_MIDNIGHT_CHANNEL?.trim() || null
    case 'voice_memory':
      return process.env.STRIPE_PRICE_ID_VOICE_MEMORY?.trim() || null
    case 'memory_vault':
      return process.env.STRIPE_PRICE_ID_MEMORY_VAULT?.trim() || null
    case 'telepathic_pings':
      return process.env.STRIPE_PRICE_ID_TELEPATHIC_PINGS?.trim() || null
    default:
      return null
  }
}

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || null
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null
}

export function isStripeCheckoutConfigured() {
  return Boolean(
    getStripeSecretKey() &&
    SUBSCRIPTION_PLANS.some((plan) => Boolean(getPriceIdForPlan(plan)))
  )
}

export function isStripePortalConfigured() {
  return Boolean(getStripeSecretKey())
}

export function createStripeClient() {
  const secretKey = getStripeSecretKey()

  if (!secretKey) {
    return null
  }

  return new Stripe(secretKey)
}

export async function createCheckoutSessionForUser({
  userId,
  userEmail,
  plan,
}: {
  userId: string
  userEmail?: string | null
  plan: CheckoutPlan
}): Promise<CheckoutSessionResult> {
  const stripe = createStripeClient()
  const priceId = getPriceIdForPlan(plan)

  if (!stripe || !priceId) {
    return {
      status: 'billing-unavailable',
      message:
        'Billing is not wired in this environment yet. Add the Stripe checkout env vars before trying again.',
    }
  }

  const baseUrl = getSiteUrl()

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        stripeCustomerId: true,
      },
    })

    let stripeCustomerId = subscription?.stripeCustomerId ?? null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail ?? undefined,
        metadata: {
          userId,
        },
      })

      stripeCustomerId = customer.id

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          tier: 'FREE',
          stripeCustomerId,
        },
        update: {
          stripeCustomerId,
        },
      })
    }

    const isSubscription = SUBSCRIPTION_PLANS.includes(plan)

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        plan,
      },
      ...(isSubscription && {
        subscription_data: {
          metadata: {
            userId,
            plan,
          },
        },
      }),
      success_url: `${baseUrl}/chat?checkout=success&plan=${plan}`,
      cancel_url: `${baseUrl}/chat?checkout=cancel`,
    })

    if (!session.url) {
      return {
        status: 'error',
        message: 'Stripe did not return a checkout URL for this session.',
      }
    }

    return {
      status: 'redirect',
      url: session.url,
    }
  } catch {
    return {
      status: 'error',
      message:
        'The checkout shell could not start right now. The thread is still safe here.',
    }
  }
}

export async function createBillingPortalSessionForUser({
  userId,
}: {
  userId: string
}) {
  const stripe = createStripeClient()

  if (!stripe) {
    return {
      status: 'billing-unavailable',
      message:
        'Billing is not wired in this environment yet. Add the Stripe checkout env vars before trying again.',
    } as const
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      stripeCustomerId: true,
    },
  })

  if (!subscription?.stripeCustomerId) {
    return {
      status: 'error',
      message: 'There is no billing profile to manage for this account yet.',
    } as const
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${getSiteUrl()}/chat?checkout=portal`,
    })

    return {
      status: 'redirect',
      url: session.url,
    } as const
  } catch {
    return {
      status: 'error',
      message:
        'The billing portal could not open right now. The conversation itself is still safe.',
    } as const
  }
}

export async function reconcileSubscriptionForUser(userId: string) {
  const stripe = createStripeClient()

  if (!stripe) {
    return null
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      stripePriceId: true,
      status: true,
      tier: true,
    },
  })

  if (!subscription?.stripeSubscriptionId) {
    return subscription
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    )

    return syncSubscriptionFromStripeSubscription(stripeSubscription)
  } catch {
    return prisma.subscription.update({
      where: { userId },
      data: {
        status: subscription.status ?? 'unknown',
        tier: getTierForStripeStatus(
          subscription.status,
          subscription.stripePriceId
        ),
      },
    })
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.mode !== 'subscription' || !session.subscription) {
      return
    }

    const stripe = createStripeClient()

    if (!stripe) {
      return
    }

    const subscription = await stripe.subscriptions.retrieve(
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id
    )

    await syncSubscriptionFromStripeSubscription(subscription)
    return
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    await syncSubscriptionFromStripeSubscription(
      event.data.object as Stripe.Subscription
    )
    return
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await clearSubscriptionByStripeCustomerId(
      typeof subscription.customer === 'string'
        ? subscription.customer
        : (subscription.customer?.id ?? null)
    )
  }
}
