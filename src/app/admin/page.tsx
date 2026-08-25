import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Flame,
  Sparkles,
  GraduationCap,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Pill, type PillVariant } from '@/components/ui/Pill';
import { StatTile } from '@/components/ui/StatTile';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Shortcut {
  href: string;
  label: string;
  cta: string;
  icon: typeof CalendarDays;
  accent: PillVariant;
}

const SHORTCUTS: Shortcut[] = [
  {
    href: '/admin/agenda',
    label: 'Agenda',
    cta: 'Ver bookings',
    icon: CalendarDays,
    accent: 'active',
  },
  {
    href: '/admin/clientes',
    label: 'Clientes',
    cta: 'Abrir CRM',
    icon: Users,
    accent: 'active',
  },
  {
    href: '/admin/fila-urgente',
    label: 'Urgências',
    cta: 'Resolver fila',
    icon: Flame,
    accent: 'active',
  },
  {
    href: '/admin/servicos',
    label: 'Serviços',
    cta: 'Catálogo',
    icon: Sparkles,
    accent: 'inactive',
  },
  {
    href: '/admin/cursos',
    label: 'Cursos',
    cta: 'Catálogo',
    icon: GraduationCap,
    accent: 'inactive',
  },
];

export default async function AdminHome() {
  // Contagens em paralelo (cada uma tem seu próprio await — Next.js paraleliza).
  // urgent pendentes primeiro porque é o "número que pula na cara".
  const [urgentCount, bookingsToday, customersTotal, servicesActive, cursosActive] =
    await Promise.all([
      prisma.urgentQueue.count({ where: { resolvedAt: null, archivedAt: null } }),
      prisma.booking.count({
        where: {
          startsAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.customer.count(),
      prisma.service.count({ where: { active: true } }),
      prisma.course.count({ where: { active: true } }),
    ]);

  // Saudação dinâmica (pt-BR). Hora local do servidor.
  const hour = new Date().getHours();
  const greeting =
    hour < 6
      ? 'Boa madrugada'
      : hour < 12
        ? 'Bom dia'
        : hour < 18
          ? 'Boa tarde'
          : 'Boa noite';

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3 mb-2">
        <LayoutDashboard
          className="w-6 h-6 text-accent"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <h1 className="text-h1 text-text font-semibold">Dashboard</h1>
      </div>
      <p className="text-body text-text-muted mb-8">
        {greeting}. Visão geral da clínica.
      </p>

      {/* ─── KPIs ─── */}
      <section aria-label="Indicadores" className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            label="Urgências pendentes"
            value={urgentCount}
            icon={<Flame className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />}
          />
          <StatTile
            label="Bookings hoje"
            value={bookingsToday}
            icon={
              <CalendarDays className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            }
          />
          <StatTile
            label="Clientes"
            value={customersTotal}
            icon={<Users className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />}
          />
          <StatTile
            label="Catálogo ativo"
            value={servicesActive + cursosActive}
            icon={<Activity className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />}
          />
        </div>
      </section>

      {/* ─── Atalhos ─── */}
      <section aria-label="Atalhos">
        <h2 className="text-h2 text-text font-medium mb-3">Atalhos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {SHORTCUTS.map(({ href, label, cta, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group bg-card border border-border-subtle rounded-card p-5 transition-colors duration-150 hover:bg-card-elevated hover:border-border-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon
                  className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors duration-150"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <Pill variant={accent}>{label}</Pill>
              </div>
              <div className="text-h2 text-text font-medium">{cta}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-caption text-accent group-hover:text-accent-hover transition-colors duration-150">
                Abrir
                <ArrowRight
                  className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Status footer ─── */}
      <Card className="mt-10 border-accent/30 bg-gradient-to-br from-accent-bg/40 to-app-bg-alt">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-card bg-accent-bg border border-accent/40 grid place-items-center shrink-0">
            <Activity className="w-4 h-4 text-accent" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-h2 text-text font-medium">Sistema no ar</h2>
            <p className="text-body text-text-muted mt-1">
              Backend conectado ao Postgres. Endpoints REST prontos pros tools do Fluxi.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
