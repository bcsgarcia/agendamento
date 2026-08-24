'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  Sparkles,
  Flame,
  ShieldCheck,
  Flag,
  Search,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { Pill } from '@/components/ui/Pill';
import { ToastProvider } from '@/components/ui/Toast';

/**
 * Item de navegação da sidebar.
 * - `href`: rota alvo
 * - `label`: texto exibido
 * - `icon`: componente Lucide
 * - `exact`: quando true, considera ativo só em match exato (útil para Dashboard /admin).
 */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Quando true, considera ativo só em match exato (útil para Dashboard /admin). */
  exact?: boolean;
  /** Texto curto exibido na Pill ativa (ex: '8' para contagem, ou '••' decorativo). */
  activeBadge?: string;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const NAV_SECTIONS: AdminNavSection[] = [
  {
    title: 'Operação',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, activeBadge: '•••' },
      { href: '/admin/cursos', label: 'Cursos', icon: BookOpen, activeBadge: '8' },
      { href: '/admin/aulas', label: 'Aulas', icon: GraduationCap, activeBadge: '••' },
      { href: '/admin/clientes', label: 'Clientes', icon: Users, activeBadge: '••' },
      { href: '/admin/agenda', label: 'Agenda', icon: CalendarDays, activeBadge: '••' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/admin/servicos', label: 'Serviços', icon: Sparkles, activeBadge: '••' },
      { href: '/admin/fila-urgente', label: 'Fila Urgente', icon: Flame, activeBadge: '••' },
    ],
  },
  {
    title: 'Configuração',
    items: [
      { href: '/admin/whitelist', label: 'Whitelist', icon: ShieldCheck, activeBadge: '••' },
      { href: '/admin/feature-flags', label: 'Feature Flags', icon: Flag, activeBadge: '••' },
    ],
  },
];

export interface AdminShellProps {
  /** Nome do usuário exibido no chip da topbar. */
  userName: string;
  /** Iniciais do usuário para o avatar circular. */
  userInitials: string;
  /** Conteúdo da página renderizado no <main>. */
  children: React.ReactNode;
}

/**
 * Converte um pathname em um breadcrumb legível.
 * - `/admin` → [{ label: 'Admin' }]
 * - `/admin/cursos/abc` → [{ label: 'Admin' }, { label: 'Cursos' }, { label: 'abc' }]
 */
function pathToBreadcrumbs(pathname: string): { href: string; label: string }[] {
  if (!pathname || pathname === '/admin') {
    return [{ href: '/admin', label: 'Admin' }];
  }
  const parts = pathname.split('/').filter(Boolean); // ['admin', 'cursos', 'abc']
  if (parts[0] !== 'admin') return [{ href: '/', label: 'Home' }];

  return parts.map((part, idx) => {
    const href = '/' + parts.slice(0, idx + 1).join('/');
    // Heurística: trata segmentos curtos (≤6 chars alfanuméricos) como IDs crus;
    // segmentos com kebab-case viram Title Case. Padrão: capitalize first letter.
    const isId = /^[a-z0-9]{6,}$/i.test(part);
    const label = isId
      ? part
      : part
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
    return { href, label };
  });
}

/**
 * Conteúdo da sidebar — renderizado tanto no drawer mobile quanto na sidebar fixa desktop.
 * Mantido como sub-componente para não duplicar markup.
 */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || '/admin';

  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2.5 pb-4 mb-3.5 border-b border-border-subtle">
        <div
          className={cn(
            'w-7 h-7 rounded-lg grid place-items-center',
            'bg-gradient-to-br from-accent to-accent-glow',
            'text-text font-semibold text-[13px]',
          )}
          aria-hidden="true"
        >
          A
        </div>
        <div className="leading-tight">
          <div className="text-text font-semibold text-[14px]">Aline Estética</div>
          <div className="text-text-muted text-[11px]">Admin · v2</div>
        </div>
      </div>

      {/* Nav sections */}
      <nav aria-label="Navegação admin" className="flex flex-col gap-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col">
            <div
              className={cn(
                'px-2.5 pt-3.5 pb-1.5',
                'text-[11px] font-semibold tracking-wide uppercase',
                'text-text-muted',
              )}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-2.5',
                    'px-2.5 py-2 rounded-[10px]',
                    'text-[13px] transition-colors duration-150',
                    isActive
                      ? 'bg-card text-text font-medium'
                      : 'text-text-muted hover:bg-card hover:text-text',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                  {isActive && item.activeBadge && (
                    <span className="ml-auto">
                      <Pill variant="active">{item.activeBadge}</Pill>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout no rodapé da sidebar */}
      <form
        action="/api/auth/logout"
        method="post"
        className="mt-auto pt-4 border-t border-border-subtle"
      >
        <button
          type="submit"
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px]',
            'text-[13px] text-text-muted hover:bg-card hover:text-text',
            'transition-colors duration-150',
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Sair
        </button>
      </form>
    </>
  );
}

export function AdminShell({ userName, userInitials, children }: AdminShellProps) {
  const pathname = usePathname() || '/admin';
  const crumbs = pathToBreadcrumbs(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha o drawer mobile sempre que a rota muda.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Bloqueia scroll do body enquanto drawer mobile está aberto.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-app-bg text-text md:grid md:grid-cols-[240px_1fr]">
      {/* ───── Mobile drawer (overlay < md) ───── */}
      <div
        className={cn(
          'md:hidden fixed inset-0 z-40 transition-opacity duration-150',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        {/* Drawer */}
        <aside
          id="admin-mobile-drawer"
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] z-50',
            'bg-app-bg-alt border-r border-border-subtle',
            'px-3.5 py-5 flex flex-col gap-1',
            'transform transition-transform duration-200 ease-out',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu lateral"
        >
          {/* Botão X dentro do drawer (visível mobile) */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="absolute top-3 right-3 p-2 rounded-md text-text-muted hover:bg-card hover:text-text transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
          </button>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </aside>
      </div>

      {/* ───── Desktop sidebar (≥ md) ───── */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col',
          'bg-app-bg-alt border-r border-border-subtle',
          'px-3.5 py-5 gap-1',
          'sticky top-0 h-screen overflow-y-auto',
        )}
      >
        <SidebarContent />
      </aside>

      {/* ───── Main + Topbar ───── */}
      <div className="flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className={cn(
            'h-14 sm:h-16 bg-app-bg/80 backdrop-blur-md',
            'border-b border-border-subtle',
            'flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6',
            'sticky top-0 z-30',
          )}
        >
          {/* Lado esquerdo: hamburger (mobile) + breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger — só aparece em < md */}
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-drawer"
              onClick={() => setMenuOpen(true)}
              className="md:hidden -ml-1 p-2 rounded-md text-text-muted hover:bg-card hover:text-text transition-colors"
            >
              <Menu className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] sm:text-[13px] min-w-0 truncate">
              {crumbs.map((crumb, idx) => {
                const isLast = idx === crumbs.length - 1;
                return (
                  <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                    {idx > 0 && (
                      <span className="text-border-default" aria-hidden="true">
                        /
                      </span>
                    )}
                    {isLast ? (
                      <span className="text-text font-medium truncate">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-text-muted hover:text-text transition-colors truncate"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          {/* Search pill (decorativo por enquanto — PR-5 vai wirear)
              Em mobile: escondido (sm:block). Em desktop: visível. */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-pill',
              'bg-pill-inactive text-text-muted',
              'text-[12px] min-w-[200px] max-w-[420px] flex-1',
            )}
          >
            <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar…"
              aria-label="Buscar (em breve)"
              disabled
              readOnly
              className={cn(
                'flex-1 bg-transparent outline-none border-none cursor-not-allowed',
                'placeholder:text-text-muted text-text',
                'text-[12px]',
              )}
            />
            <kbd
              className={cn(
                'px-1.5 py-0.5 rounded-md text-[10px]',
                'bg-app-bg-alt border border-border-subtle text-text-muted',
              )}
            >
              ⌘K
            </kbd>
          </div>

          {/* User chip */}
          <div
            className={cn(
              'flex items-center gap-2 py-1 pl-1 pr-3 shrink-0',
              'bg-card border border-border-subtle rounded-pill',
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full grid place-items-center',
                'bg-gradient-to-br from-accent to-accent-glow-bright',
                'text-text font-semibold text-[11px]',
              )}
              aria-hidden="true"
            >
              {userInitials}
            </div>
            <span className="hidden sm:inline text-[12px] text-text">{userName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-5 sm:py-6 md:py-7 pb-8 sm:pb-10 overflow-x-hidden">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}
