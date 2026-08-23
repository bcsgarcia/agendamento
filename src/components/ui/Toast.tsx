'use client';

// Toast minimalista Dark Violet — sucesso (Check) ou erro (AlertCircle).
// Aparece por 4s com fade-out; stack de até 3 toasts no canto inferior direito.
//
// Uso:
//   1. Envolver a árvore com <ToastProvider> (uma vez, no AdminShell ou layout admin).
//   2. Em componentes client: const { toast } = useToast();
//        toast.success('Salvo com sucesso');
//        toast.error('Falha ao salvar');

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import { cn } from './cn';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextIdRef.current++;
      setItems((prev) => {
        const next = [...prev, { id, variant, message }];
        // Cap na pilha visível: descarta o mais antigo silenciosamente.
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });
      setTimeout(() => remove(id), AUTO_DISMISS_MS);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Viewport fixo no canto inferior direito */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }
  return ctx;
}

function ToastView({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const isSuccess = item.variant === 'success';
  const Icon = isSuccess ? Check : AlertCircle;

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      className={cn(
        'pointer-events-auto',
        'flex items-center gap-2.5',
        'min-w-[260px] max-w-[420px]',
        'px-3.5 py-2.5',
        'rounded-card border',
        'shadow-card',
        // Anima entrada (saída é instantânea — UX padrão de toast)
        'animate-[toast-fade-in_150ms_ease-out]',
        isSuccess
          ? 'bg-success/15 border-success/30 text-success'
          : 'bg-danger/15 border-danger/30 text-danger',
      )}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span className="text-body flex-1">{item.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        className={cn(
          'shrink-0 rounded-md p-1',
          'transition-colors duration-150',
          isSuccess
            ? 'text-success hover:bg-success/20'
            : 'text-danger hover:bg-danger/20',
        )}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}