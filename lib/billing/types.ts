export type CheckoutPlan =
  | 'monthly_core'
  | 'monthly_pro'
  | 'stellar_insight'
  | 'midnight_channel'
  | 'voice_memory'
  | 'memory_vault'
  | 'telepathic_pings'

export type CheckoutSessionResult =
  | {
      status: 'redirect'
      url: string
    }
  | {
      status: 'billing-unavailable' | 'error'
      message: string
    }

export type BillingPortalResult =
  | {
      status: 'redirect'
      url: string
    }
  | {
      status: 'billing-unavailable' | 'error'
      message: string
    }
