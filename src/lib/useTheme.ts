'use client';

// Hook para acessar o tema atual e o setter.
// Lê de localStorage (fonte da verdade no client) e reage a mudanças em outras abas.
//
// Uso:
//   const { theme, setTheme, toggle } = useTheme();
//   <button onClick={toggle}>...</button>

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'agendamento-theme';
const COOKIE_NAME = 'theme';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

function readCookieTheme(): Theme | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const v = match.split('=')[1];
  return v === 'light' || v === 'dark' ? v : null;
}

function persistTheme(theme: Theme): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
  if (typeof document !== 'undefined') {
    // SameSite=Lax pra não ser bloqueado em navegação cross-site;
    // path=/ pra valer pra todo o app.
    document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

/** Aplica o tema no <html>: adiciona/remove a classe `.dark`. */
function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  // Sinaliza pro embed do browser (form controls nativos, scrollbars)
  root.style.colorScheme = theme;
}

function detectInitialTheme(): Theme {
  // 1. localStorage (escolha explícita do usuário)
  const stored = readStoredTheme();
  if (stored) return stored;
  // 2. cookie (escolha explícita em sessão anterior)
  const cookie = readCookieTheme();
  if (cookie) return cookie;
  // 3. preferência do sistema operacional
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'dark'; // default histórico (admin era todo dark)
}

export function useTheme(): {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
} {
  // Estado inicial neutro até detectar (evita hydration mismatch em SSR).
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const initial = detectInitialTheme();
    setThemeState(initial);
    applyTheme(initial);

    // Reage a mudanças em outras abas.
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        const next = e.newValue;
        setThemeState(next);
        applyTheme(next);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    persistTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}