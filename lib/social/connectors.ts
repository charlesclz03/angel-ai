import { createHash, randomBytes } from 'crypto'

import type {
  SocialConnector,
  SocialConnectStartResult,
  SocialScanResult,
  SocialTokenBundle,
} from '@/lib/social/types'
import { socialPlatformOrder, type SocialPlatformKey } from '@/lib/social/types'

const META_API_VERSION = 'v20.0'

type FetchOptions = {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  query?: Record<string, string | number | undefined>
  body?: URLSearchParams | string
}

export function getSocialConnector(
  platform: SocialPlatformKey
): SocialConnector {
  return socialConnectorRegistry[platform]
}

export function isSocialConnectorConfigured(platform: SocialPlatformKey) {
  return getSocialConnector(platform).isConfigured()
}

export function getConfiguredSocialPlatforms() {
  return socialPlatformOrder.filter((platform) =>
    isSocialConnectorConfigured(platform)
  )
}

export function createSocialAuthState() {
  return randomBytes(18).toString('base64url')
}

export function createPkceVerifier() {
  return randomBytes(32).toString('base64url')
}

export function createPkceChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

export function getSocialCallbackUrl(platform: SocialPlatformKey) {
  const baseUrl =
    process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!baseUrl) {
    throw new Error(
      'Set NEXTAUTH_URL or NEXT_PUBLIC_SITE_URL before connecting social accounts.'
    )
  }

  return new URL(`/api/social/${platform}/callback`, baseUrl).toString()
}

const socialConnectorRegistry: Record<SocialPlatformKey, SocialConnector> = {
  instagram: {
    platform: 'instagram',
    isConfigured: () =>
      Boolean(
        process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim()
      ),
    getScopes: () => ['public_profile', 'pages_show_list', 'instagram_basic'],
    getAuthorizationUrl(context) {
      if (!this.isConfigured()) {
        return unavailable(
          'Instagram is not configured in this environment yet.'
        )
      }

      return {
        status: 'redirect',
        url: buildUrl(
          `https://www.facebook.com/${META_API_VERSION}/dialog/oauth`,
          {
            client_id: process.env.META_APP_ID,
            redirect_uri: context.redirectUri,
            state: context.state,
            response_type: 'code',
            scope: this.getScopes().join(','),
          }
        ),
      }
    },
    async exchangeCode(code, redirectUri) {
      return exchangeMetaCode(code, redirectUri)
    },
    async scan({ tokens, maxItems }) {
      const me = await fetchJson<{
        data?: Array<{
          id: string
          name?: string
          instagram_business_account?: {
            id: string
            username?: string
            biography?: string
            profile_picture_url?: string
          }
        }>
      }>(`https://graph.facebook.com/${META_API_VERSION}/me/accounts`, {
        query: {
          fields:
            'id,name,instagram_business_account{id,username,biography,profile_picture_url}',
          access_token: tokens.accessToken,
        },
      })

      const instagramAccount = me.data?.find(
        (page) => page.instagram_business_account?.id
      )?.instagram_business_account

      if (!instagramAccount?.id) {
        return {
          status: 'LIMITED',
          limitedReason:
            'This Meta login did not expose an official Instagram Business or Creator account to scan.',
          profile: null,
          content: [],
          grantedScopes: tokens.scopes ?? this.getScopes(),
        } satisfies SocialScanResult
      }

      const media = await fetchJson<{
        data?: Array<{
          id: string
          caption?: string
          media_type?: string
          media_url?: string
          permalink?: string
          timestamp?: string
          thumbnail_url?: string
        }>
      }>(
        `https://graph.facebook.com/${META_API_VERSION}/${instagramAccount.id}/media`,
        {
          query: {
            fields:
              'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url',
            limit: String(maxItems),
            access_token: tokens.accessToken,
          },
        }
      )

      return {
        status: 'READY',
        profile: {
          providerUserId: instagramAccount.id,
          handle: instagramAccount.username ?? null,
          displayName: instagramAccount.username ?? null,
          bio: instagramAccount.biography ?? null,
          headline: 'Instagram creator profile',
          avatarUrl: instagramAccount.profile_picture_url ?? null,
          profileUrl: instagramAccount.username
            ? `https://www.instagram.com/${instagramAccount.username}/`
            : null,
          metadata: null,
        },
        content:
          media.data?.map((item) => ({
            externalId: item.id,
            contentType: item.media_type ?? 'IMAGE',
            title: null,
            textContent: item.caption ?? null,
            permalink: item.permalink ?? null,
            mediaUrl: item.media_url ?? item.thumbnail_url ?? null,
            postedAt: item.timestamp ? new Date(item.timestamp) : null,
            metadata: null,
          })) ?? [],
        grantedScopes: tokens.scopes ?? this.getScopes(),
      }
    },
  },
  facebook: {
    platform: 'facebook',
    isConfigured: () =>
      Boolean(
        process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim()
      ),
    getScopes: () => ['public_profile', 'user_posts'],
    getAuthorizationUrl(context) {
      if (!this.isConfigured()) {
        return unavailable(
          'Facebook is not configured in this environment yet.'
        )
      }

      return {
        status: 'redirect',
        url: buildUrl(
          `https://www.facebook.com/${META_API_VERSION}/dialog/oauth`,
          {
            client_id: process.env.META_APP_ID,
            redirect_uri: context.redirectUri,
            state: context.state,
            response_type: 'code',
            scope: this.getScopes().join(','),
          }
        ),
      }
    },
    async exchangeCode(code, redirectUri) {
      return exchangeMetaCode(code, redirectUri)
    },
    async scan({ tokens, maxItems }) {
      const profile = await fetchJson<{
        id: string
        name?: string
        link?: string
        about?: string
        bio?: string
        picture?: { data?: { url?: string } }
      }>(`https://graph.facebook.com/${META_API_VERSION}/me`, {
        query: {
          fields: 'id,name,link,about,bio,picture.type(large)',
          access_token: tokens.accessToken,
        },
      })

      try {
        const posts = await fetchJson<{
          data?: Array<{
            id: string
            message?: string
            created_time?: string
            permalink_url?: string
            full_picture?: string
            status_type?: string
          }>
        }>(`https://graph.facebook.com/${META_API_VERSION}/me/posts`, {
          query: {
            fields:
              'id,message,created_time,permalink_url,full_picture,status_type',
            limit: String(maxItems),
            access_token: tokens.accessToken,
          },
        })

        return {
          status: 'READY',
          profile: {
            providerUserId: profile.id,
            handle: null,
            displayName: profile.name ?? null,
            bio: profile.bio ?? profile.about ?? null,
            headline: 'Facebook profile',
            avatarUrl: profile.picture?.data?.url ?? null,
            profileUrl: profile.link ?? null,
            metadata: null,
          },
          content:
            posts.data?.map((item) => ({
              externalId: item.id,
              contentType: item.status_type ?? 'POST',
              title: null,
              textContent: item.message ?? null,
              permalink: item.permalink_url ?? null,
              mediaUrl: item.full_picture ?? null,
              postedAt: item.created_time ? new Date(item.created_time) : null,
              metadata: null,
            })) ?? [],
          grantedScopes: tokens.scopes ?? this.getScopes(),
        }
      } catch (cause) {
        return {
          status: 'LIMITED',
          limitedReason: getErrorMessage(cause),
          profile: {
            providerUserId: profile.id,
            handle: null,
            displayName: profile.name ?? null,
            bio: profile.bio ?? profile.about ?? null,
            headline: 'Facebook profile',
            avatarUrl: profile.picture?.data?.url ?? null,
            profileUrl: profile.link ?? null,
            metadata: null,
          },
          content: [],
          grantedScopes: tokens.scopes ?? this.getScopes(),
        }
      }
    },
  },
  x: {
    platform: 'x',
    isConfigured: () =>
      Boolean(
        process.env.X_CLIENT_ID?.trim() && process.env.X_CLIENT_SECRET?.trim()
      ),
    getScopes: () => ['tweet.read', 'users.read', 'offline.access'],
    getAuthorizationUrl(context) {
      if (!this.isConfigured()) {
        return unavailable('X is not configured in this environment yet.')
      }

      if (!context.codeVerifier) {
        return unavailable('X requires a PKCE verifier before starting OAuth.')
      }

      return {
        status: 'redirect',
        url: buildUrl('https://twitter.com/i/oauth2/authorize', {
          response_type: 'code',
          client_id: process.env.X_CLIENT_ID,
          redirect_uri: context.redirectUri,
          scope: this.getScopes().join(' '),
          state: context.state,
          code_challenge: createPkceChallenge(context.codeVerifier),
          code_challenge_method: 'S256',
        }),
      }
    },
    async exchangeCode(code, redirectUri, options) {
      const codeVerifier = options?.codeVerifier?.trim()

      if (!codeVerifier) {
        throw new Error('X OAuth callback is missing the PKCE verifier.')
      }

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.X_CLIENT_ID ?? '',
        code_verifier: codeVerifier,
      })
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
      const clientSecret = process.env.X_CLIENT_SECRET?.trim()
      if (clientSecret) {
        headers.Authorization = `Basic ${Buffer.from(
          `${process.env.X_CLIENT_ID ?? ''}:${clientSecret}`
        ).toString('base64')}`
      }

      const payload = await fetchJson<{
        access_token: string
        refresh_token?: string
        expires_in?: number
        token_type?: string
        scope?: string
      }>('https://api.x.com/2/oauth2/token', {
        method: 'POST',
        headers,
        body,
      })

      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? null,
        expiresInSeconds: payload.expires_in ?? null,
        tokenType: payload.token_type ?? null,
        scopes: payload.scope?.split(' ').filter(Boolean) ?? this.getScopes(),
      }
    },
    async scan({ tokens, maxItems }) {
      const profile = await fetchJson<{
        data: {
          id: string
          name?: string
          username?: string
          description?: string
          profile_image_url?: string
          url?: string
        }
      }>('https://api.x.com/2/users/me', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        query: {
          'user.fields': 'description,profile_image_url,url,username,name',
        },
      })
      const timeline = await fetchJson<{
        data?: Array<{
          id: string
          text?: string
          created_at?: string
        }>
      }>(`https://api.x.com/2/users/${profile.data.id}/tweets`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        query: {
          max_results: String(Math.min(maxItems, 100)),
          'tweet.fields': 'created_at',
        },
      })

      return {
        status: 'READY',
        profile: {
          providerUserId: profile.data.id,
          handle: profile.data.username ?? null,
          displayName: profile.data.name ?? null,
          bio: profile.data.description ?? null,
          headline: 'X profile',
          avatarUrl: profile.data.profile_image_url ?? null,
          profileUrl: profile.data.username
            ? `https://x.com/${profile.data.username}`
            : (profile.data.url ?? null),
          metadata: null,
        },
        content:
          timeline.data?.map((item) => ({
            externalId: item.id,
            contentType: 'POST',
            title: null,
            textContent: item.text ?? null,
            permalink:
              profile.data.username && item.id
                ? `https://x.com/${profile.data.username}/status/${item.id}`
                : null,
            mediaUrl: null,
            postedAt: item.created_at ? new Date(item.created_at) : null,
            metadata: null,
          })) ?? [],
        grantedScopes: tokens.scopes ?? this.getScopes(),
      }
    },
  },
  linkedin: {
    platform: 'linkedin',
    isConfigured: () =>
      Boolean(
        process.env.LINKEDIN_CLIENT_ID?.trim() &&
        process.env.LINKEDIN_CLIENT_SECRET?.trim()
      ),
    getScopes: () => ['openid', 'profile', 'email'],
    getAuthorizationUrl(context) {
      if (!this.isConfigured()) {
        return unavailable(
          'LinkedIn is not configured in this environment yet.'
        )
      }

      return {
        status: 'redirect',
        url: buildUrl('https://www.linkedin.com/oauth/v2/authorization', {
          response_type: 'code',
          client_id: process.env.LINKEDIN_CLIENT_ID,
          redirect_uri: context.redirectUri,
          state: context.state,
          scope: this.getScopes().join(' '),
        }),
      }
    },
    async exchangeCode(code, redirectUri) {
      const payload = await fetchJson<{
        access_token: string
        expires_in?: number
        refresh_token?: string
        scope?: string
        token_type?: string
      }>('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID ?? '',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
        }),
      })

      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? null,
        expiresInSeconds: payload.expires_in ?? null,
        tokenType: payload.token_type ?? null,
        scopes: payload.scope?.split(' ').filter(Boolean) ?? this.getScopes(),
      }
    },
    async scan({ tokens }) {
      const profile = await fetchJson<{
        sub?: string
        name?: string
        given_name?: string
        family_name?: string
        picture?: string
        locale?: string
        email?: string
      }>('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })

      return {
        status: 'LIMITED',
        limitedReason:
          'LinkedIn profile import is ready, but post import depends on LinkedIn product approval for this app.',
        profile: {
          providerUserId: profile.sub ?? null,
          handle: null,
          displayName:
            profile.name ??
            ([profile.given_name, profile.family_name]
              .filter(Boolean)
              .join(' ') ||
              null),
          bio: profile.email ?? null,
          headline: profile.locale
            ? `LinkedIn member (${profile.locale})`
            : 'LinkedIn member',
          avatarUrl: profile.picture ?? null,
          profileUrl: null,
          metadata: null,
        },
        content: [],
        grantedScopes: tokens.scopes ?? this.getScopes(),
      }
    },
  },
  tiktok: {
    platform: 'tiktok',
    isConfigured: () =>
      Boolean(
        process.env.TIKTOK_CLIENT_KEY?.trim() &&
        process.env.TIKTOK_CLIENT_SECRET?.trim()
      ),
    getScopes: () => ['user.info.basic', 'video.list'],
    getAuthorizationUrl(context) {
      if (!this.isConfigured()) {
        return unavailable('TikTok is not configured in this environment yet.')
      }

      return {
        status: 'redirect',
        url: buildUrl('https://www.tiktok.com/v2/auth/authorize/', {
          client_key: process.env.TIKTOK_CLIENT_KEY,
          redirect_uri: context.redirectUri,
          response_type: 'code',
          scope: this.getScopes().join(','),
          state: context.state,
        }),
      }
    },
    async exchangeCode(code, redirectUri) {
      const payload = await fetchJson<{
        access_token: string
        expires_in?: number
        refresh_token?: string
        refresh_expires_in?: number
        token_type?: string
        scope?: string
      }>('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY ?? '',
          client_secret: process.env.TIKTOK_CLIENT_SECRET ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      })

      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? null,
        expiresInSeconds: payload.expires_in ?? null,
        tokenType: payload.token_type ?? null,
        scopes:
          payload.scope
            ?.split(',')
            .map((scope) => scope.trim())
            .filter(Boolean) ?? this.getScopes(),
      }
    },
    async scan({ tokens, maxItems }) {
      const profile = await fetchJson<{
        data?: {
          user?: {
            open_id?: string
            union_id?: string
            display_name?: string
            bio_description?: string
            avatar_url?: string
            profile_deep_link?: string
            username?: string
          }
        }
      }>('https://open.tiktokapis.com/v2/user/info/', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        query: {
          fields:
            'open_id,union_id,display_name,bio_description,avatar_url,profile_deep_link,username',
        },
      })
      const videos = await fetchJson<{
        data?: {
          videos?: Array<{
            id: string
            title?: string
            video_description?: string
            cover_image_url?: string
            share_url?: string
            create_time?: number
          }>
        }
      }>('https://open.tiktokapis.com/v2/video/list/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        query: {
          fields:
            'id,title,video_description,cover_image_url,share_url,create_time',
        },
        body: JSON.stringify({
          max_count: Math.min(maxItems, 50),
        }),
      })

      const user = profile.data?.user

      return {
        status: 'READY',
        profile: {
          providerUserId: user?.open_id ?? user?.union_id ?? null,
          handle: user?.username ?? null,
          displayName: user?.display_name ?? null,
          bio: user?.bio_description ?? null,
          headline: 'TikTok profile',
          avatarUrl: user?.avatar_url ?? null,
          profileUrl: user?.profile_deep_link ?? null,
          metadata: null,
        },
        content:
          videos.data?.videos?.map((item) => ({
            externalId: item.id,
            contentType: 'VIDEO',
            title: item.title ?? null,
            textContent: item.video_description ?? null,
            permalink: item.share_url ?? null,
            mediaUrl: item.cover_image_url ?? null,
            postedAt:
              typeof item.create_time === 'number'
                ? new Date(item.create_time * 1000)
                : null,
            metadata: null,
          })) ?? [],
        grantedScopes: tokens.scopes ?? this.getScopes(),
      }
    },
  },
}

async function exchangeMetaCode(
  code: string,
  redirectUri: string
): Promise<SocialTokenBundle> {
  const payload = await fetchJson<{
    access_token: string
    token_type?: string
    expires_in?: number
  }>(`https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`, {
    query: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: redirectUri,
      code,
    },
  })

  return {
    accessToken: payload.access_token,
    expiresInSeconds: payload.expires_in ?? null,
    tokenType: payload.token_type ?? null,
  }
}

async function fetchJson<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const resolvedUrl = new URL(url)
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value != null && value !== '') {
        resolvedUrl.searchParams.set(key, String(value))
      }
    }
  }

  const response = await fetch(resolvedUrl, {
    method: options.method ?? 'GET',
    headers: options.headers,
    body: options.body,
  })

  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string }
    message?: string
  } | null

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        `Request failed with ${response.status}.`
    )
  }

  return payload as T
}

function buildUrl(baseUrl: string, params: Record<string, string | undefined>) {
  const url = new URL(baseUrl)

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

function unavailable(message: string): SocialConnectStartResult {
  return {
    status: 'unavailable',
    message,
  }
}

function getErrorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : 'The provider scan failed.'
}
