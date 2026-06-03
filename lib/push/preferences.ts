import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface NotificationPreferencesState {
  enabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  timeZone: string
}

export interface UpdateNotificationPreferencesInput {
  enabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

export interface PushPreferenceRecord {
  pushNotificationsEnabled: boolean
  pushQuietHoursStart: string | null
  pushQuietHoursEnd: string | null
}

type PushPreferenceWriter = Pick<Prisma.TransactionClient, 'userPreferences'>

export async function updateNotificationPreferencesForUser(
  userId: string,
  input: UpdateNotificationPreferencesInput,
  db: PushPreferenceWriter = prisma
) {
  const quietHoursStart = normalizeQuietHourValue(input.quietHoursStart)
  const quietHoursEnd = normalizeQuietHourValue(input.quietHoursEnd)
  const shouldPersistQuietHours =
    quietHoursStart !== null &&
    quietHoursEnd !== null &&
    quietHoursStart !== quietHoursEnd

  return db.userPreferences.upsert({
    where: { userId },
    update: {
      pushNotificationsEnabled: input.enabled,
      pushQuietHoursStart: shouldPersistQuietHours ? quietHoursStart : null,
      pushQuietHoursEnd: shouldPersistQuietHours ? quietHoursEnd : null,
    },
    create: {
      userId,
      pushNotificationsEnabled: input.enabled,
      pushQuietHoursStart: shouldPersistQuietHours ? quietHoursStart : null,
      pushQuietHoursEnd: shouldPersistQuietHours ? quietHoursEnd : null,
    },
  })
}

export function buildNotificationPreferencesState({
  preferences,
  timeZone,
}: {
  preferences?: PushPreferenceRecord | null
  timeZone?: string | null
}): NotificationPreferencesState {
  return {
    enabled: preferences?.pushNotificationsEnabled ?? true,
    quietHoursStart: preferences?.pushQuietHoursStart ?? null,
    quietHoursEnd: preferences?.pushQuietHoursEnd ?? null,
    timeZone: timeZone?.trim() || 'UTC',
  }
}

export function normalizeQuietHourValue(value: string | null | undefined) {
  if (!value?.trim()) {
    return null
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)

  if (!match) {
    throw new Error('Quiet hours must use HH:MM format.')
  }

  const hours = Number.parseInt(match[1] ?? '', 10)
  const minutes = Number.parseInt(match[2] ?? '', 10)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error('Quiet hours must stay within a 24-hour clock.')
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function isWithinQuietHours({
  quietHoursStart,
  quietHoursEnd,
  timeZone,
  now = new Date(),
}: {
  quietHoursStart: string | null
  quietHoursEnd: string | null
  timeZone: string
  now?: Date
}) {
  const startMinutes = toMinutes(quietHoursStart)
  const endMinutes = toMinutes(quietHoursEnd)

  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes === endMinutes
  ) {
    return false
  }

  const currentMinutes = getLocalMinutes(now, timeZone)

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

function toMinutes(value: string | null) {
  if (!value) {
    return null
  }

  const [hours, minutes] = value.split(':').map((part) => Number(part))

  if (
    hours == null ||
    minutes == null ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null
  }

  return hours * 60 + minutes
}

function getLocalMinutes(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timeZone || 'UTC',
  })

  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? '0'
  )

  return hour * 60 + minute
}
