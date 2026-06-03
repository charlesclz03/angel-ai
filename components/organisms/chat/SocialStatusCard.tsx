import {
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Unplug,
} from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import type {
  SocialPlatformKey,
  SocialScanStateRecord,
} from '@/lib/social/types'

interface SocialStatusCardProps {
  item: SocialScanStateRecord
  actionKey: string | null
  onConnect: (platform: SocialPlatformKey) => Promise<void>
  onMutate: (
    platform: SocialPlatformKey,
    action: 'rescan' | 'disconnect' | 'delete'
  ) => Promise<void>
  showActions?: boolean
}

export function SocialStatusCard({
  item,
  actionKey,
  onConnect,
  onMutate,
  showActions = true,
}: SocialStatusCardProps) {
  const isConnecting = actionKey === `connect:${item.platform}`
  const isRescanning = actionKey === `rescan:${item.platform}`
  const isDeleting = actionKey === `delete:${item.platform}`
  const isDisconnecting = actionKey === `disconnect:${item.platform}`
  const isBusy = isConnecting || isRescanning || isDeleting || isDisconnecting

  return (
    <div className="rounded-[1.35rem] border border-stroke-subtle bg-background/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-text-primary">
              {item.label}
            </p>
            <span className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {formatSocialStatus(item.status)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            {item.importSummary}
          </p>
          {item.limitedReason ? (
            <p className="mt-2 text-sm leading-7 text-accent-brand">
              {item.limitedReason}
            </p>
          ) : null}
          {item.lastErrorMessage && item.status === 'FAILED' ? (
            <p className="mt-2 text-sm leading-7 text-accent-error">
              {item.lastErrorMessage}
            </p>
          ) : null}
        </div>

        {showActions ? (
          <div className="flex flex-wrap gap-2">
            {item.status === 'NOT_CONNECTED' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onConnect(item.platform)}
                disabled={!item.isConfigured || isBusy}
              >
                {isConnecting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {item.isConfigured ? 'Connect' : 'Not configured'}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  onClick={() => onMutate(item.platform, 'rescan')}
                  disabled={isBusy || item.status === 'SCANNING'}
                >
                  {isRescanning ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  Rescan
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  onClick={() => onMutate(item.platform, 'delete')}
                  disabled={isBusy || !item.hasImportedData}
                >
                  {isDeleting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete data
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  onClick={() => onMutate(item.platform, 'disconnect')}
                  disabled={isBusy}
                >
                  {isDisconnecting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </>
            )}
          </div>
        ) : item.status === 'NOT_CONNECTED' ? (
          <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {item.isConfigured ? 'Ready to connect' : 'Not configured'}
          </p>
        ) : (
          <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
            Context available
          </p>
        )}
      </div>
    </div>
  )
}

function formatSocialStatus(status: SocialScanStateRecord['status']) {
  switch (status) {
    case 'CONNECTED':
      return 'Connected'
    case 'SCANNING':
      return 'Scanning'
    case 'READY':
      return 'Ready'
    case 'LIMITED':
      return 'Limited'
    case 'FAILED':
      return 'Failed'
    case 'NOT_CONNECTED':
    default:
      return 'Not connected'
  }
}
