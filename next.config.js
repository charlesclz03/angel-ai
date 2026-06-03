/** @type {import('next').NextConfig} */

// Extract canonical Host setup
let canonicalSiteOrigin
try {
  canonicalSiteOrigin = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : undefined
} catch {
  canonicalSiteOrigin = undefined
}

const DEFAULT_CANONICAL_ORIGIN = 'https://www.your-production-url.com'
const canonicalOrigin = canonicalSiteOrigin || DEFAULT_CANONICAL_ORIGIN
const canonicalHost = new URL(canonicalOrigin).hostname

// Security Headers Configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=()',
  },
]

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com', // For Google Auth avatars
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // If utilizing Supabase storage
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    const knownHosts = [
      // Add Vercel alias URLs here to redirect to canonical domain
      // e.g., 'your-project.vercel.app'
    ]
    const redirectHosts = knownHosts.filter((host) => host !== canonicalHost)

    return redirectHosts.map((host) => ({
      source: '/:path((?!api).*)',
      has: [{ type: 'host', value: host }],
      destination: `${canonicalOrigin}/:path`,
      permanent: true,
    }))
  },
}

// -------------------------------------------------------------------------------- //
// Sentry Configuration (Optional: Uncomment to enable Sentry Error Tracking)       //
// -------------------------------------------------------------------------------- //
// const { withSentryConfig } = require('@sentry/nextjs')
//
// if (process.env.SENTRY_AUTH_TOKEN) {
//   module.exports = withSentryConfig(
//     nextConfig,
//     { silent: true, org: 'your-org', project: 'your-project' },
//     { widenClientFileUpload: true, transpileClientSDK: true, tunnelRoute: '/monitoring', hideSourceMaps: true, disableLogger: true }
//   )
// } else {
//   module.exports = nextConfig
// }
// -------------------------------------------------------------------------------- //

// -------------------------------------------------------------------------------- //
// PWA/TWA Configuration                                                            //
// -------------------------------------------------------------------------------- //
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  publicExcludes: ['!noprecache/**/*'],
  buildExcludes: [/app-build-manifest\.json$/],
})

module.exports = withPWA(nextConfig)
