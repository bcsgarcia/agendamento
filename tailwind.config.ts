import type { Config } from 'tailwindcss';

/**
 * Design tokens do agendamento — Madame Lash (Light) + Dark Violet (Dark).
 *
 * Estratégia CSS-vars (Tailwind darkMode: 'class'):
 *
 *   1. Cada token é um objeto `{ DEFAULT, dark }` em tailwind.config.ts.
 *      `DEFAULT` resolve para `var(--xxx)` (light) e `dark` resolve para
 *      `var(--xxx-dark)` (dark). Tailwind gera:
 *        .bg-app-bg       { background-color: var(--app-bg); }
 *        .dark .bg-app-bg { background-color: var(--app-bg-dark); }
 *
 *      Ou seja, a regra `.dark` muda QUAL var é resolvida — as vars em si
 *      têm o MESMO nome, só o valor (light vs dark) muda via :root.dark em
 *      globals.css.
 *
 *   2. Por que esse padrão funciona sem renomear tokens?
 *      - `bg-app-bg` (DEFAULT) e `dark:bg-app-bg` (dark) — Tailwind cuida.
 *      - Nenhum dos 165+ usos existentes precisa virar `dark:bg-app-bg`.
 *      - A mudança de paleta é 100% nas CSS vars de globals.css.
 *
 *   3. Tokens que existem com o sufixo `-dark` na fonte original (ex: legacy
 *      `app-bg-alt-dark` que nunca existiu) — só preciso adicionar a var dark
 *      com nome `<token>-dark` em globals.css.
 *
 * PALETAS (extraídas do logo Madame Lash, anexo da task):
 *   Light: bg #FFFFFF, surface #FBFAF7, text #4D4D4F, accent coral #E8917E → #C97C6E.
 *   Dark:  bg #06050B, surface #14131B, text #F1F1F2, accent purple #5540D6 → #503FCA.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ─── Surfaces ───
        'app-bg': { DEFAULT: 'var(--app-bg)', dark: 'var(--app-bg)' },
        'app-bg-alt': { DEFAULT: 'var(--app-bg-alt)', dark: 'var(--app-bg-alt)' },
        'card': { DEFAULT: 'var(--card)', dark: 'var(--card)' },
        'card-elevated': { DEFAULT: 'var(--card-elevated)', dark: 'var(--card-elevated)' },

        // ─── Acento principal ───
        'accent': { DEFAULT: 'var(--accent)', dark: 'var(--accent)' },
        'accent-hover': { DEFAULT: 'var(--accent-hover)', dark: 'var(--accent-hover)' },
        'accent-bg': { DEFAULT: 'var(--accent-bg)', dark: 'var(--accent-bg)' },
        'accent-bg-2': { DEFAULT: 'var(--accent-bg-2)', dark: 'var(--accent-bg-2)' },
        'accent-glow': { DEFAULT: 'var(--accent-glow)', dark: 'var(--accent-glow)' },
        'accent-glow-bright': {
          DEFAULT: 'var(--accent-glow-bright)',
          dark: 'var(--accent-glow-bright)',
        },

        // ─── Neutrals / Borders ───
        'pill-inactive': { DEFAULT: 'var(--pill-inactive)', dark: 'var(--pill-inactive)' },
        'border-subtle': { DEFAULT: 'var(--border-subtle)', dark: 'var(--border-subtle)' },
        'border-default': { DEFAULT: 'var(--border-default)', dark: 'var(--border-default)' },

        // ─── Texto ───
        'text': { DEFAULT: 'var(--text)', dark: 'var(--text)' },
        'text-muted': { DEFAULT: 'var(--text-muted)', dark: 'var(--text-muted)' },

        // ─── Semânticos ───
        'success': { DEFAULT: 'var(--success)', dark: 'var(--success)' },
        'danger': { DEFAULT: 'var(--danger)', dark: 'var(--danger)' },

        // ─── Madame Lash palette (cores puras, gradient do logo) ───
        'madame': {
          50: '#FDF5F3',
          100: '#F6C4BC',
          200: '#E8917E',
          300: '#C97C6E',
          400: '#B86A5C',
          500: '#4D4D4F',
        },
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
        // Glow/card: alpha e hue mudam com tema via CSS vars (mesmo padrão).
        'glow': '0 0 80px 20px var(--shadow-glow)',
        'card': '0 1px 0 var(--shadow-card) inset',
      },
      transitionDuration: {
        '150': '150ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
};
export default config;