'use client';

// Card de uma urgência com botões de ação (concluir / arquivar / deletar).
// - Pendentes: mostram os 3 botões.
// - Concluídos/Arquivados: mostram só "Reabrir".
// - Após ação: toast + router.refresh() pra revalidar Server Component.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Archive, Trash2, RotateCcw, Clock } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export type UrgenciaTab = 'pendentes' | 'concluidos' | 'arquivados';

export interface UrgenciaItem {
  id: string;
  reason: string;
  contextSnapshot: string;
  createdAt: string; // serializado pelo Next (Date -> string)
  resolvedAt: string | null;
  resolvedNote: string | null;
  archivedAt: string | null;
}

function timeAgo(dateIso: string): string {
  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

async function patchAction(id: string, action: string, note?: string) {
  const res = await fetch(`/api/urgent-queue/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, note }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function deleteAction(id: string) {
  const res = await fetch(`/api/urgent-queue/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function UrgenciaCard({ item, tab }: { item: UrgenciaItem; tab: UrgenciaTab }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [askDelete, setAskDelete] = useState(false);
  const [askArchive, setAskArchive] = useState(false);
  const [askResolve, setAskResolve] = useState(false);

  // Timestamp relevante pra "há X tempo":
  //  - pendentes: criação (urgência crescendo)
  //  - concluídos: resolvedAt (quando fechou)
  //  - arquivados: archivedAt
  const stamp =
    tab === 'pendentes' ? item.createdAt :
    tab === 'concluidos' ? (item.resolvedAt ?? item.createdAt) :
    (item.archivedAt ?? item.createdAt);

  function runResolve() {
    setAskResolve(false);
    startTransition(async () => {
      try {
        await patchAction(item.id, 'resolve');
        toast.success('Urgência concluída.');
        router.refresh();
      } catch (e) {
        toast.error(`Erro: ${(e as Error).message}`);
      }
    });
  }

  function runArchive() {
    setAskArchive(false);
    startTransition(async () => {
      try {
        await patchAction(item.id, 'archive');
        toast.success('Urgência arquivada.');
        router.refresh();
      } catch (e) {
        toast.error(`Erro: ${(e as Error).message}`);
      }
    });
  }

  function runUnresolve() {
    startTransition(async () => {
      try {
        await patchAction(item.id, 'unresolve');
        toast.success('Urgência reaberta.');
        router.refresh();
      } catch (e) {
        toast.error(`Erro: ${(e as Error).message}`);
      }
    });
  }

  function runUnarchive() {
    startTransition(async () => {
      try {
        await patchAction(item.id, 'unarchive');
        toast.success('Urgência reaberta.');
        router.refresh();
      } catch (e) {
        toast.error(`Erro: ${(e as Error).message}`);
      }
    });
  }

  function runDelete() {
    setAskDelete(false);
    startTransition(async () => {
      try {
        await deleteAction(item.id);
        toast.success('Urgência deletada.');
        router.refresh();
      } catch (e) {
        toast.error(`Erro: ${(e as Error).message}`);
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────
  const isPending = tab === 'pendentes';
  const isConcluido = tab === 'concluidos';
  const isArquivado = tab === 'arquivados';

  return (
    <article className="bg-card border border-border-subtle rounded-card p-5 transition-colors duration-150 hover:border-border-default">
      {/* Header: pill de reason + timestamp */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill variant={isPending ? 'active' : 'inactive'}>{item.reason}</Pill>
          {isConcluido && <Pill variant="inactive">concluída</Pill>}
          {isArquivado && <Pill variant="inactive">arquivada</Pill>}
        </div>
        <span className="inline-flex items-center gap-1.5 text-caption text-text-muted shrink-0">
          <Clock className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
          <span>{timeAgo(stamp)}</span>
          <span className="text-border-default" aria-hidden="true">·</span>
          <span className="font-mono">{new Date(stamp).toLocaleString('pt-BR')}</span>
        </span>
      </header>

      {/* Contexto da conversa */}
      <pre className="text-caption text-text font-mono whitespace-pre-wrap break-words bg-app-bg-alt border border-border-subtle rounded-[10px] p-3 leading-relaxed">
        {item.contextSnapshot}
      </pre>

      {/* Nota de resolução (se houver) */}
      {item.resolvedNote && (isConcluido || isArquivado) && (
        <div className="mt-3 px-3 py-2 bg-success/10 border border-success/30 rounded-[10px]">
          <p className="text-caption text-success font-medium mb-0.5">Nota da equipa:</p>
          <p className="text-caption text-text">{item.resolvedNote}</p>
        </div>
      )}

      {/* Ações */}
      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        {isPending && (
          <>
            <button
              type="button"
              onClick={() => setAskResolve(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card text-label font-medium bg-success text-white hover:opacity-90 active:opacity-80 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
              Marcar como concluído
            </button>
            <button
              type="button"
              onClick={() => setAskArchive(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card text-label font-medium border border-border-subtle bg-card text-text hover:bg-card-elevated transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Archive className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
              Arquivar
            </button>
            <button
              type="button"
              onClick={() => setAskDelete(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card text-label font-medium border border-danger/40 bg-card text-danger hover:bg-danger/10 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
              Deletar
            </button>
          </>
        )}
        {(isConcluido || isArquivado) && (
          <button
            type="button"
            onClick={isConcluido ? runUnresolve : runUnarchive}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card text-label font-medium border border-border-subtle bg-card text-text hover:bg-card-elevated transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            Reabrir
          </button>
        )}
        {(isConcluido || isArquivado) && (
          <button
            type="button"
            onClick={() => setAskDelete(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card text-label font-medium border border-danger/40 bg-card text-danger hover:bg-danger/10 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            Deletar
          </button>
        )}
      </div>

      {/* Modal: concluir (confirmação simples) */}
      <ConfirmDialog
        open={askResolve}
        title="Marcar esta urgência como concluída?"
        description="Ela some da aba Pendentes e vai pra aba Concluídos. Você ainda pode reabrir depois."
        confirmLabel="Marcar como concluída"
        variant="info"
        pending={pending}
        onConfirm={runResolve}
        onCancel={() => setAskResolve(false)}
      />

      {/* Modal: arquivar (confirmação simples) */}
      <ConfirmDialog
        open={askArchive}
        title="Arquivar esta urgência?"
        description="Some das listas Pendentes e Concluídos. Você ainda pode vê-la na aba Arquivados e reabrir."
        confirmLabel="Arquivar"
        variant="info"
        pending={pending}
        onConfirm={runArchive}
        onCancel={() => setAskArchive(false)}
      />

      {/* Modal: deletar (confirmação digitada) */}
      <DeleteConfirmModal
        open={askDelete}
        pending={pending}
        reason={item.reason}
        onConfirm={runDelete}
        onCancel={() => setAskDelete(false)}
      />
    </article>
  );
}
