'use client';

import { useState } from 'react';
import { Calendar, Users, Package, AlertCircle } from 'lucide-react';
import { Pill, Card, StatTile, Toggle, cn } from '@/components/ui';

/**
 * Storybook-like demo page para validar os 4 primitivos.
 * Acessível em /admin/dev/ui-primitives (autenticado).
 */
export default function UiPrimitivesDemoPage() {
  const [pillActive, setPillActive] = useState(true);
  const [toggleOn, setToggleOn] = useState(true);
  const [toggleDisabled, setToggleDisabled] = useState(false);

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-h1 text-text font-semibold mb-2">
          UI Primitives · Dark Violet
        </h1>
        <p className="text-body text-text-muted">
          PR-2 do redesign. Cada bloco abaixo renderiza um primitivo em todas as
          suas variantes. Use para validar tokens, espaçamentos e estados
          interativos.
        </p>
      </header>

      <Section title="Pill">
        <Card>
          <div className="flex flex-wrap gap-3 items-center">
            <Pill variant="active" icon={<Calendar className="w-3 h-3" />}>
              Hoje
            </Pill>
            <Pill variant="inactive" icon={<Calendar className="w-3 h-3" />}>
              Amanhã
            </Pill>
            <Pill variant="active">Confirmado</Pill>
            <Pill variant="inactive">Pendente</Pill>
            <Pill
              variant={pillActive ? 'active' : 'inactive'}
              icon={<AlertCircle className="w-3 h-3" />}
              onClick={() => setPillActive((v) => !v)}
            >
              {pillActive ? 'Clicou → ativo' : 'Clicou → inativo'}
            </Pill>
          </div>
        </Card>
      </Section>

      <Section title="Card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-h2 text-text font-semibold mb-1">
              Card básico
            </h3>
            <p className="text-body text-text-muted">
              Superfície padrão com bg-card, border-subtle, radius-card e
              padding p-5.
            </p>
          </Card>
          <Card className="bg-card-elevated">
            <h3 className="text-h2 text-text font-semibold mb-1">
              Card com override
            </h3>
            <p className="text-body text-text-muted">
              Mesmo primitivo, fundo elevado via className override
              (bg-card-elevated).
            </p>
          </Card>
        </div>
      </Section>

      <Section title="StatTile">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Agendamentos hoje" value={12} icon={<Calendar />} />
          <StatTile label="Clientes ativos" value="248" icon={<Users />} />
          <StatTile label="Serviços" value={8} icon={<Package />} />
          <StatTile
            label="Urgências"
            value={3}
            icon={<AlertCircle className="text-danger" />}
          />
        </div>
      </Section>

      <Section title="Toggle">
        <Card>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text font-medium">ON</p>
                <p className="text-caption text-text-muted">
                  Estado checked, fundo accent
                </p>
              </div>
              <Toggle
                id="toggle-on"
                checked={true}
                onChange={() => {}}
                label="Toggle sempre on"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text font-medium">OFF</p>
                <p className="text-caption text-text-muted">
                  Estado unchecked, fundo pill-inactive
                </p>
              </div>
              <Toggle
                id="toggle-off"
                checked={false}
                onChange={() => {}}
                label="Toggle sempre off"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text font-medium">Interativo</p>
                <p className="text-caption text-text-muted">
                  Clica no label ou no switch pra alternar
                </p>
              </div>
              <Toggle
                id="toggle-interactive"
                checked={toggleOn}
                onChange={setToggleOn}
                label={toggleOn ? 'Ativado' : 'Desativado'}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text font-medium">Disabled</p>
                <p className="text-caption text-text-muted">
                  Não responde a clique, opacidade reduzida
                </p>
              </div>
              <Toggle
                id="toggle-disabled"
                checked={toggleDisabled}
                onChange={setToggleDisabled}
                disabled
                label="Bloqueado"
              />
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Token quick reference">
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { name: 'app-bg', cls: 'bg-app-bg' },
              { name: 'app-bg-alt', cls: 'bg-app-bg-alt' },
              { name: 'card', cls: 'bg-card' },
              { name: 'card-elevated', cls: 'bg-card-elevated' },
              { name: 'accent', cls: 'bg-accent' },
              { name: 'accent-bg', cls: 'bg-accent-bg' },
              { name: 'accent-bg-2', cls: 'bg-accent-bg-2' },
              { name: 'pill-inactive', cls: 'bg-pill-inactive' },
              { name: 'border-subtle', cls: 'bg-border-subtle' },
              { name: 'border-default', cls: 'bg-border-default' },
              { name: 'success', cls: 'bg-success' },
              { name: 'danger', cls: 'bg-danger' },
            ].map((t) => (
              <div key={t.name} className="flex flex-col gap-1">
                <div className={cn('h-10 w-full rounded border border-border-subtle', t.cls)} />
                <span className="text-caption text-text-muted font-mono">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-h2 text-text-muted uppercase tracking-wide mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}