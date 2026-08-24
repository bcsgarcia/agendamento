import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Agendamento — Madame Lash',
  description: 'Sistema de agendamento Madame Lash',
};

/**
 * Inline FOUC-prevention script.
 *
 * Roda síncrono no <head> antes do React hidratar — aplica `.dark` no <html>
 * baseado em localStorage / cookie / prefers-color-scheme. Sem isso, usuários
 * com `theme=dark` salvo veem o app em claro por ~50-200ms antes do Effect.
 *
 * Conteúdo é constante interna (não user input), por isso `dangerouslySetInnerHTML`
 * é seguro. Deve espelhar a lógica de src/lib/useTheme.ts.
 */
const themeInitScript = `(function(){try{var s=localStorage.getItem('agendamento-theme');var t=null;if(s==='light'||s==='dark'){t=s;}else{var c=document.cookie.match(/(?:^|;\\s*)theme=(light|dark)/);if(c){t=c[1];}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){t='dark';}else{t='light';}}if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}