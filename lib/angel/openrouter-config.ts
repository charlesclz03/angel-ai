export const OPENROUTER_CORE_MODEL = 'openai/gpt-5-mini-medium'
export const OPENROUTER_PRO_MODEL = 'google/gemini-3.1-pro'
export const OPENROUTER_FALLBACK_MODEL = OPENROUTER_CORE_MODEL

export type SubscriptionTier = 'FREE' | 'CORE' | 'PRO'

export function getModelForTier(tier: string | null | undefined): string {
  switch (tier) {
    case 'PRO':
      return OPENROUTER_PRO_MODEL
    case 'CORE':
      return OPENROUTER_CORE_MODEL
    default:
      return OPENROUTER_FALLBACK_MODEL
  }
}

export function getOpenRouterApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY?.trim() || null
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(getOpenRouterApiKey())
}
