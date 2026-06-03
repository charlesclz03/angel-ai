import type { PushPreferenceRecord } from '@/lib/push/preferences'
import {
  buildNotificationPreferencesState,
  isWithinQuietHours,
} from '@/lib/push/preferences'

export type PushDeliveryDeferralReason = 'DISABLED' | 'QUIET_HOURS' | null

export function resolvePushDeliveryDeferral({
  preferences,
  timeZone,
  now = new Date(),
}: {
  preferences: PushPreferenceRecord | null
  timeZone: string | null
  now?: Date
}): PushDeliveryDeferralReason {
  const notificationPreferences = buildNotificationPreferencesState({
    preferences,
    timeZone,
  })

  if (!notificationPreferences.enabled) {
    return 'DISABLED'
  }

  if (
    isWithinQuietHours({
      quietHoursStart: notificationPreferences.quietHoursStart,
      quietHoursEnd: notificationPreferences.quietHoursEnd,
      timeZone: notificationPreferences.timeZone,
      now,
    })
  ) {
    return 'QUIET_HOURS'
  }

  return null
}
