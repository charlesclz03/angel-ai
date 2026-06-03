import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border text-sm font-semibold tracking-[0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-accent-primary/30 bg-accent-primary/14 text-text-primary shadow-glow hover:border-accent-primary/45 hover:bg-accent-primary/20',
        brand:
          'border-accent-brand/40 bg-gradient-brand text-background shadow-brand hover:brightness-[1.03]',
        destructive:
          'border-accent-error/40 bg-accent-error/12 text-text-primary hover:bg-accent-error/18',
        outline:
          'border-stroke-strong bg-white/[0.03] text-text-primary hover:border-accent-primary/28 hover:bg-white/[0.05]',
        secondary:
          'border-white/8 bg-surface-elevated text-text-primary hover:bg-[#1A2547]',
        ghost:
          'border-transparent bg-transparent text-text-secondary hover:bg-white/[0.04] hover:text-text-primary',
        link: 'border-transparent bg-transparent px-0 text-accent-primary underline-offset-4 hover:underline',
        glass:
          'border-white/10 bg-white/[0.04] text-text-primary hover:bg-white/[0.07]',
        chip: 'border-white/10 bg-white/[0.04] text-text-secondary hover:border-accent-brand/20 hover:bg-white/[0.07] hover:text-text-primary',
        quiet:
          'border-white/8 bg-black/10 text-text-secondary hover:border-white/14 hover:bg-white/[0.05] hover:text-text-primary',
      },
      size: {
        default: 'h-12 px-5 py-2.5',
        sm: 'h-10 px-4 text-xs',
        lg: 'h-14 px-7 text-base',
        icon: 'h-12 w-12',
      },
      isLoading: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      isLoading: false,
    },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isLoading?: boolean
  variant?:
    | 'default'
    | 'brand'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'glass'
    | 'chip'
    | 'quiet'
    | null
  size?: 'default' | 'sm' | 'lg' | 'icon' | null
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const classes = cn(buttonVariants({ variant, size, isLoading, className }))

    if (asChild) {
      return (
        <Comp className={classes} ref={ref} {...props}>
          {children}
        </Comp>
      )
    }

    return (
      <Comp className={classes} ref={ref} {...props}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>{children}</span>
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
