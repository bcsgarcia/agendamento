import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Surface
        'app-bg': '#06050B',
        'app-bg-alt': '#0B0914',
        'card': '#1E1C2A',
        'card-elevated': '#2A2640',
        // Accent
        'accent': '#5540D6',
        'accent-hover': '#503FCA',
        'accent-bg': '#2A2251',
        'accent-bg-2': '#362B6D',
        'accent-glow': '#3E3377',
        'accent-glow-bright': '#8175AA',
        // Neutrals
        'pill-inactive': '#33313D',
        'border-subtle': '#1D1934',
        'border-default': '#2C2656',
        // Text
        'text': '#F1F1F2',
        'text-muted': '#9B98A8',
        // Semantic (estimado, não estava no Figma)
        'success': '#46A758',
        'danger': '#E5484D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'caption': ['11px', { lineHeight: '16px' }],
        'label': ['12px', { lineHeight: '16px' }],
        'body': ['13px', { lineHeight: '20px' }],
        'h2': ['16px', { lineHeight: '24px' }],
        'h1': ['22px', { lineHeight: '32px' }],
      },
      borderRadius: {
        'pill': '999px',
        'card': '16px',
        'sidebar': '24px',
      },
      boxShadow: {
        'glow': '0 0 80px 20px rgba(94, 75, 175, 0.15)',
        'card': '0 1px 0 rgba(125, 117, 170, 0.06) inset',
      },
      transitionDuration: {
        '150': '150ms',
      },
    },
  },
  plugins: [],
};
export default config;
