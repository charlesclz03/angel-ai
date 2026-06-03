import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#050816',
          card: '#0E1428',
          elevated: '#182147',
          glow: '#070B17',
        },
        text: {
          primary: '#F7F4EC',
          secondary: '#D0D6EC',
          tertiary: '#9BA6C9',
          muted: '#66729A',
        },
        accent: {
          primary: '#9CB7F5',
          secondary: '#6C8FDB',
          tertiary: '#C8D4FF',
          brand: '#D6B36A',
          success: '#30D158',
          warning: '#FF9F0A',
          error: '#FF453A',
        },
        surface: {
          subtle: '#0A1020',
          elevated: '#111A33',
        },
        stroke: {
          subtle: '#243252',
          strong: '#425784',
          glow: '#11192E',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        display: ['var(--font-lora)', 'serif'],
        serif: ['var(--font-lora)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        display: [
          '4.5rem',
          { lineHeight: '0.96', fontWeight: '500', letterSpacing: '-0.05em' },
        ],
        'display-sm': [
          '3.5rem',
          { lineHeight: '1', fontWeight: '500', letterSpacing: '-0.045em' },
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ambient-shift': 'ambientShift 10s ease-in-out infinite',
        'fade-up': 'fadeUp 0.72s cubic-bezier(0.16, 1, 0.3, 1) both',
        drift: 'drift 14s ease-in-out infinite',
        shimmer: 'shimmer 2.8s linear infinite',
      },
      keyframes: {
        ambientShift: {
          '0%, 100%': { opacity: '0.38', transform: 'translate3d(0,0,0)' },
          '50%': { opacity: '0.7', transform: 'translate3d(0,-10px,0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translate3d(0,24px,0)' },
          '100%': { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-18px,0) scale(1.03)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-midnight':
          'linear-gradient(180deg, rgba(5,8,22,0.98) 0%, rgba(8,13,28,0.96) 32%, rgba(7,10,20,1) 100%)',
        'gradient-primary':
          'linear-gradient(135deg, rgba(156,183,245,0.98) 0%, rgba(108,143,219,0.96) 100%)',
        'gradient-brand':
          'linear-gradient(135deg, rgba(214,179,106,0.98) 0%, rgba(244,217,154,0.96) 100%)',
        'gradient-panel':
          'linear-gradient(180deg, rgba(17,26,51,0.98) 0%, rgba(10,16,32,0.96) 100%)',
      },
      boxShadow: {
        glow: '0 20px 60px rgba(108, 143, 219, 0.16)',
        soft: '0 28px 80px rgba(2, 6, 23, 0.46)',
        brand: '0 24px 72px rgba(214, 179, 106, 0.16)',
      },
      backdropBlur: {
        heavy: '24px',
        medium: '18px',
        light: '12px',
      },
    },
  },
  plugins: [],
}

export default config
