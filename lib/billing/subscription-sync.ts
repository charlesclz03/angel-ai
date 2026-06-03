import type Stripe from 'stripe'

import { prisma } from '@/lib/prisma'

export function getTierForStripePriceId(
  priceId: string | null | undefined
): 'CORE' | 'PRO' {
  const proPriceId = process.env.STRIPE_PRICE_ID_MONTHLY_PRO?.trim()

  if (proPriceId && priceId === proPriceId) {
    return 'PRO'
  }

  return 'CORE'
}

export function getTierForStripeStatus(
  status: string | null | undefined,
  priceId?: string | null
) {
  if (!status) {
    return 'FREE'
  }

  if (!['active', 'trialing', 'past_due'].includes(status)) {
    return 'FREE'
  }

  return getTierForStripePriceId(priceId)
}

export async function syncSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription
) {
  const userId =
    subscription.metadata?.userId?.trim() ||
    (await findUserIdByCustomer(subscription.customer))

  if (!userId) {
    return null
  }

  const priceId = getStripePriceId(subscription)

  return prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: getStripeCustomerId(subscription.customer),
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: getCurrentPeriodEnd(subscription),
      status: subscription.status,
      tier: getTierForStripeStatus(subscription.status, priceId),
    },
    update: {
      stripeCustomerId: getStripeCustomerId(subscription.customer),
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: getCurrentPeriodEnd(subscription),
      status: subscription.status,
      tier: getTierForStripeStatus(subscription.status, priceId),
    },
  })
}

export async function clearSubscriptionByStripeCustomerId(
  stripeCustomerId: string | null
) {
  if (!stripeCustomerId) {
    return null
  }

  return prisma.subscription.updateMany({
    where: { stripeCustomerId },
    data: {
      status: 'canceled',
      tier: 'FREE',
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  })
}

async function findUserIdByCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer
) {
  const stripeCustomerId = getStripeCustomerId(customer)

  if (!stripeCustomerId) {
    return null
  }

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId },
    select: { userId: true },
  })

  return subscription?.userId ?? null
}

function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (!customer) {
    return null
  }

  if (typeof customer === 'string') {
    return customer
  }

  return customer.id ?? null
}

function getStripePriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const currentPeriodEnd = Number(
    (
      subscription as Stripe.Subscription & {
        current_period_end?: number | null
      }
    ).current_period_end ?? 0
  )

  return currentPeriodEnd > 0 ? new Date(currentPeriodEnd * 1000) : null
}
