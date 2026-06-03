import { Button } from '@/components/atoms/Button'
import type { ChatCheckoutStatus } from '@/lib/angel/chat-state'
import type { CheckoutPlan } from '@/lib/billing/types'

type SubscriptionCheckoutPlan = Extract<
  CheckoutPlan,
  'monthly_core' | 'monthly_pro'
>

interface ReadOnlyPaywallCardProps {
  checkoutStatus: ChatCheckoutStatus
  checkoutPlanInFlight: SubscriptionCheckoutPlan | null
  isOpeningPortal: boolean
  onCheckout: (plan: SubscriptionCheckoutPlan) => void
  onPortal: () => void
}

export function ReadOnlyPaywallCard({
  checkoutStatus,
  checkoutPlanInFlight,
  isOpeningPortal,
  onCheckout,
  onPortal,
}: ReadOnlyPaywallCardProps) {
  const isBillingUnavailable = checkoutStatus === 'BILLING_UNAVAILABLE'

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-accent-primary/30 bg-accent-primary/8 p-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
          Read-only renewal
        </p>
        <h3 className="font-display text-3xl tracking-[-0.04em] text-text-primary">
          This thread is paused at the threshold.
        </h3>
      </div>

      <p className="text-sm leading-7 text-text-secondary">
        The continuity message and your latest exchange stay visible here, but
        the composer is resting until continuity is renewed.
      </p>

      <p className="text-sm leading-7 text-text-secondary">
        {getCheckoutStatusMessage(checkoutStatus)}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          onClick={() => onCheckout('monthly_core')}
          isLoading={checkoutPlanInFlight === 'monthly_core'}
          disabled={Boolean(checkoutPlanInFlight) || isBillingUnavailable}
        >
          {isBillingUnavailable
            ? 'Core unavailable'
            : checkoutPlanInFlight === 'monthly_core'
              ? 'Opening Core'
              : 'Continue with Core (EUR 9.99)'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onCheckout('monthly_pro')}
          isLoading={checkoutPlanInFlight === 'monthly_pro'}
          disabled={Boolean(checkoutPlanInFlight) || isBillingUnavailable}
        >
          {isBillingUnavailable
            ? 'Pro unavailable'
            : checkoutPlanInFlight === 'monthly_pro'
              ? 'Opening Pro'
              : 'Continue with Pro (EUR 19.99)'}
        </Button>
      </div>

      <div className="grid gap-3 rounded-[1.5rem] border border-white/8 bg-background/20 p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Angel Core
          </p>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            Ongoing continuity, stronger memory carryover, and the daily thread
            reopened at EUR 9.99 per month.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Angel Pro
          </p>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            The same continuity layer with the deepest live reasoning at EUR
            19.99 per month.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          type="button"
          variant="glass"
          onClick={onPortal}
          isLoading={isOpeningPortal}
          disabled={isOpeningPortal}
        >
          Manage billing
        </Button>
      </div>
    </div>
  )
}

function getCheckoutStatusMessage(checkoutStatus: ChatCheckoutStatus) {
  if (checkoutStatus === 'RETURNED_SUCCESS') {
    return 'Checkout came back successfully. The conversation should unlock as soon as the subscription state sync finishes.'
  }

  if (checkoutStatus === 'RETURNED_CANCELED') {
    return 'Checkout was canceled. The thread stays readable, and renewal can wait until it feels right.'
  }

  if (checkoutStatus === 'BILLING_UNAVAILABLE') {
    return 'Billing is not wired in this local environment yet, so Core and Pro cannot open until `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY_CORE`, `STRIPE_PRICE_ID_MONTHLY_PRO`, and `STRIPE_WEBHOOK_SECRET` are set.'
  }

  return 'Renew continuity to move this thread back into active conversation mode.'
}
