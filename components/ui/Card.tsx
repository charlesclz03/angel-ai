import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  variant?: 'default' | 'thread' | 'rail' | 'soft' | 'frosted'
}

export function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  variant = 'default',
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-5',
    md: 'p-6',
    lg: 'p-8',
  }
  const variantClasses = {
    default: 'angel-panel',
    thread: 'angel-chat-thread',
    rail: 'angel-chat-rail',
    soft: 'angel-panel-soft',
    frosted: 'angel-panel-frosted',
  }

  return (
    <div
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        hover &&
          'transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent-primary/20 hover:shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h3 className="font-display text-[1.65rem] tracking-[-0.035em] text-text-primary">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-text-secondary">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

interface CardSectionProps {
  children: ReactNode
  className?: string
  border?: boolean
}

export function CardSection({
  children,
  className,
  border = false,
}: CardSectionProps) {
  return (
    <div
      className={cn(border && 'mt-6 border-t border-white/8 pt-6', className)}
    >
      {children}
    </div>
  )
}
