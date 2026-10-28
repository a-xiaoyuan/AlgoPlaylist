import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        accent: 'var(--accent)',
        'accent-muted': 'var(--accent-muted)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius-sm)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
      },
      fontFamily: { sans: ['var(--font)'] },
      spacing: { unit: 'var(--space)' },
      transitionDuration: { DEFAULT: 'var(--dur)' },
      transitionTimingFunction: { DEFAULT: 'var(--ease)' },
    },
  },
  plugins: [],
} satisfies Config
