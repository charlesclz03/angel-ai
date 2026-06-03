'use client'

import { useEffect, useState } from 'react'

export function PWAInstallNudge() {
  const [showNudge, setShowNudge] = useState(false)

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined' || typeof navigator === 'undefined')
      return

    // Detect iOS devices (iPhone, iPad, iPod)
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !Reflect.get(window, 'MSStream')

    // Detect if the app is already running in standalone mode (PWA installed)
    const nav: Navigator & { standalone?: boolean } = navigator
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      !!nav.standalone

    // Show nudge if on iOS web browser
    if (isIOS && !isStandalone) {
      const dismissed = localStorage.getItem('angel_pwa_nudge_dismissed')
      if (!dismissed) {
        setShowNudge(true)
      }
    }
  }, [])

  if (!showNudge) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-enter pointer-events-none">
      <div className="mx-auto max-w-sm rounded-[1.6rem] border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-[12px] p-5 pointer-events-auto flex items-start gap-4 justify-between">
        <div className="flex-1">
          <h4 className="text-[15px] font-medium text-text-primary tracking-tight mb-1">
            Install Angel AI
          </h4>
          <p className="text-[13px] leading-relaxed text-text-secondary">
            Tap the{' '}
            <span className="inline-block align-middle pb-1">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent-brand"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </span>{' '}
            share button and select{' '}
            <strong>&quot;Add to Home Screen&quot;</strong> for secure offline
            continuity and web push updates.
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem('angel_pwa_nudge_dismissed', 'true')
            setShowNudge(false)
          }}
          className="text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0"
          aria-label="Dismiss installation prompt"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}
