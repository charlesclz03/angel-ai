'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { requireServerAuthSession } from '@/lib/auth'
import {
  getSocialPkceCookieName,
  getSocialStateCookieName,
} from '@/lib/social/cookies'
import {
  deleteImportedSocialDataForUser,
  disconnectSocialAccountForUser,
  prepareSocialConnect,
  rescanSocialAccountForUser,
} from '@/lib/social/service'
import type {
  SocialActionResult,
  SocialConnectStartResult,
  SocialPlatformKey,
} from '@/lib/social/types'

export async function startSocialConnect(
  platform: SocialPlatformKey
): Promise<SocialConnectStartResult> {
  await requireServerAuthSession(
    'Please sign in before connecting social apps.'
  )

  const prepared = prepareSocialConnect(platform)

  if (prepared.result.status !== 'redirect' || !prepared.state) {
    return prepared.result
  }

  const cookieStore = await cookies()

  cookieStore.set(getSocialStateCookieName(platform), prepared.state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })

  if (prepared.codeVerifier) {
    cookieStore.set(getSocialPkceCookieName(platform), prepared.codeVerifier, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 10,
    })
  }

  return prepared.result
}

export async function rescanSocialAccount(
  platform: SocialPlatformKey
): Promise<SocialActionResult> {
  const session = await requireServerAuthSession(
    'Please sign in before rescanning social context.'
  )
  const result = await rescanSocialAccountForUser(session.user.id, platform)

  revalidatePath('/chat')
  revalidatePath('/onboarding')

  return result
}

export async function disconnectSocialAccount(
  platform: SocialPlatformKey
): Promise<SocialActionResult> {
  const session = await requireServerAuthSession(
    'Please sign in before disconnecting social context.'
  )
  const result = await disconnectSocialAccountForUser(session.user.id, platform)

  revalidatePath('/chat')
  revalidatePath('/onboarding')

  return result
}

export async function deleteImportedSocialData(
  platform: SocialPlatformKey
): Promise<SocialActionResult> {
  const session = await requireServerAuthSession(
    'Please sign in before deleting imported social context.'
  )
  const result = await deleteImportedSocialDataForUser(
    session.user.id,
    platform
  )

  revalidatePath('/chat')
  revalidatePath('/onboarding')

  return result
}
