import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Extended custom merge to handle custom semantic colors
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: ['shadow-neon', 'shadow-glow', 'shadow-soft'],
      'drop-shadow': ['drop-shadow-neon'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
