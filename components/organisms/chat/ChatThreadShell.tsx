import type { ReactNode } from 'react'

import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface ChatThreadShellProps {
  presenceHeader: ReactNode
  messageList: ReactNode
  notice?: ReactNode
  composer: ReactNode
  className?: string
}

export function ChatThreadShell({
  presenceHeader,
  messageList,
  notice,
  composer,
  className,
}: ChatThreadShellProps) {
  return (
    <Card
      variant="thread"
      padding="none"
      className={cn('animate-enter overflow-hidden', className)}
    >
      <div className="border-b border-white/8 p-5 sm:p-6">{presenceHeader}</div>
      <div className="space-y-4 p-5 sm:space-y-5 sm:p-6">
        {messageList}
        {notice ? notice : null}
        {composer}
      </div>
    </Card>
  )
}
