import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getServerAuthSession } from '@/lib/auth'
import {
  getSocialPkceCookieName,
  getSocialStateCookieName,
} from '@/lib/social/cookies'
import {
  connectSocialAccountForUser,
  getSocialReturnPathForUser,
} from '@/lib/social/service'
import { toSocialPlatformKey } from '@/lib/social/types'

interface CallbackRouteContext {
  params: Promise<{
    platform: string
  }>
}

export async function GET(request: Request, context: CallbackRouteContext) {
  const { platform: rawPlatform } = await context.params
  const platform = toSocialPlatformKey(rawPlatform)

  if (!platform) {
    return NextResponse.redirect(
      new URL('/onboarding?social_error=invalid', request.url)
    )
  }

  const session = await getServerAuthSession()
  const returnPath = session?.user?.id
    ? await getSocialReturnPathForUser(session.user.id)
    : '/onboarding'
  const url = new URL(request.url)
  const providerError = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get(
    getSocialStateCookieName(platform)
  )?.value
  const codeVerifier = cookieStore.get(getSocialPkceCookieName(platform))?.value

  cookieStore.delete(getSocialStateCookieName(platform))
  cookieStore.delete(getSocialPkceCookieName(platform))

  if (providerError) {
    return NextResponse.redirect(
      new URL(
        `${returnPath}?social=${platform}&social_error=${encodeURIComponent(providerError)}`,
        request.url
      )
    )
  }

  if (
    !session?.user?.id ||
    !code ||
    !state ||
    !expectedState ||
    state !== expectedState
  ) {
    return NextResponse.redirect(
      new URL(
        `${returnPath}?social=${platform}&social_error=callback`,
        request.url
      )
    )
  }

  try {
    const result = await connectSocialAccountForUser({
      userId: session.user.id,
      platform,
      code,
      codeVerifier,
    })

    revalidatePath('/chat')
    revalidatePath('/onboarding')

    return NextResponse.redirect(
      new URL(
        `${returnPath}?social=${platform}&social_status=${result.status}`,
        request.url
      )
    )
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : 'The social callback failed.'

    return NextResponse.redirect(
      new URL(
        `${returnPath}?social=${platform}&social_error=${encodeURIComponent(message)}`,
        request.url
      )
    )
  }
}
