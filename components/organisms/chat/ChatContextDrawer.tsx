import { Dialog, DialogPanel } from '@headlessui/react'
import { X } from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { ChatContextRail } from '@/components/organisms/chat/ChatContextRail'
import type { ChatContextRailProps } from '@/components/organisms/chat/ChatContextRail'

interface ChatContextDrawerProps extends ChatContextRailProps {
  open: boolean
  onClose: () => void
}

export function ChatContextDrawer({
  open,
  onClose,
  ...railProps
}: ChatContextDrawerProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 xl:hidden">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-medium" />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <DialogPanel
          aria-label="Relationship context"
          className="angel-chat-drawer-panel overflow-y-auto"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="angel-kicker">Context</p>
              <h2 className="mt-3 font-display text-[1.9rem] tracking-[-0.05em] text-text-primary">
                Relationship context
              </h2>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                Everything Angel is carrying forward, with the editing-heavy
                controls kept secondary.
              </p>
            </div>
            <Button type="button" size="sm" variant="quiet" onClick={onClose}>
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>

          <ChatContextRail {...railProps} />
        </DialogPanel>
      </div>
    </Dialog>
  )
}
