'use client';
// Botão de status rápido pra página de detalhe do booking.
// Usa server action direto via form action (sem hook/useTransition) —
// revalidatePath no server já refresca a página, então não precisa de
// useEffect ou router.refresh() manual.
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { confirmBookingAction, cancelBookingAction } from '@/lib/agenda-actions';
import { useToast } from '@/components/ui/Toast';

type ActionKind = 'confirm' | 'cancel';

const LABELS: Record<ActionKind, string> = {
  confirm: 'Confirmar',
  cancel: 'Cancelar booking',
};

const ICONS: Record<ActionKind, typeof Check> = {
  confirm: Check,
  cancel: X,
};

export function QuickBookingAction({
  id,
  action,
  label,
  variant = 'primary',
  disabled,
}: {
  id: string;
  action: ActionKind;
  label?: string;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const Icon = ICONS[action];

  function onSubmit() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      const res = action === 'confirm'
        ? await confirmBookingAction(fd)
        : await cancelBookingAction(fd);
      if (!res.ok) {
        toast.error(`Erro: ${res.error ?? 'desconhecido'}`);
      } else {
        toast.success(action === 'confirm' ? 'Booking confirmado.' : 'Booking cancelado.');
        router.refresh();
      }
    });
  }

  const colorClasses =
    variant === 'danger'
      ? 'bg-card border border-danger/40 text-danger hover:bg-danger/10'
      : 'bg-card border border-accent/40 text-accent-glow-bright hover:bg-accent/10';

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled || pending}
      className={
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-label font-medium ' +
        'transition-colors duration-150 ' +
        'disabled:opacity-50 disabled:cursor-not-allowed ' +
        'focus:outline-none focus:ring-2 focus:ring-accent/30 ' +
        colorClasses
      }
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
      {pending ? 'Aguarde…' : (label ?? LABELS[action])}
    </button>
  );
}
