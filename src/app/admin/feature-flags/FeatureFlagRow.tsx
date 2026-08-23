'use client';

import { useOptimistic, useTransition } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { toggleFeatureFlagAction } from './actions';

interface FeatureFlagRowProps {
  id: string;
  nome: string;
  ativo: boolean;
  descricao: string | null;
  atualizadoEm: Date;
}

/**
 * Linha de Feature Flag no admin.
 *
 * - Server Page passa os dados.
 * - `useOptimistic` flipa o toggle IMEDIATAMENTE no click (UI responsiva)
 *   e reconcilia com o estado real depois que o Server Action roda.
 * - `useTransition` deixa a Action em background sem bloquear — se o
 *   optimistic state for revertido pelo servidor (ex: erro), o React
 *   reconcilia automaticamente.
 * - Toggle já é `accent` quando ativo (PR-2 primitivo).
 */
export function FeatureFlagRow({
  id,
  nome,
  ativo,
  descricao,
  atualizadoEm,
}: FeatureFlagRowProps) {
  const [optimisticAtivo, setOptimisticAtivo] = useOptimistic(ativo);
  const [, startTransition] = useTransition();

  const handleToggle = (next: boolean) => {
    startTransition(async () => {
      setOptimisticAtivo(next);
      await toggleFeatureFlagAction(id);
    });
  };

  return (
    <div className="px-5 py-4 flex items-start justify-between gap-4 transition-colors duration-150 hover:bg-card-elevated">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <code className="font-mono text-body text-text bg-app-bg-alt px-2 py-1 rounded-md border border-border-subtle">
            {nome}
          </code>
          <span
            className={
              optimisticAtivo
                ? 'inline-flex items-center px-2.5 py-0.5 rounded-pill text-label bg-gradient-to-r from-accent-bg to-accent-bg-2 text-white'
                : 'inline-flex items-center px-2.5 py-0.5 rounded-pill text-label bg-pill-inactive text-text-muted'
            }
          >
            {optimisticAtivo ? 'ATIVO' : 'desligado'}
          </span>
        </div>
        {descricao && (
          <p className="text-body text-text-muted mt-2 break-words">{descricao}</p>
        )}
        <p className="text-caption text-text-muted mt-2">
          Última atualização:{' '}
          <time dateTime={new Date(atualizadoEm).toISOString()}>
            {new Date(atualizadoEm).toLocaleString('pt-BR')}
          </time>
        </p>
      </div>
      <Toggle
        id={`toggle-${id}`}
        checked={optimisticAtivo}
        onChange={handleToggle}
        aria-label={`Alternar ${nome}`}
      />
    </div>
  );
}
