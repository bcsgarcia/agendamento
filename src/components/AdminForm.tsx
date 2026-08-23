// Botões padrão usados nos forms admin
import Link from 'next/link';

export function SubmitButton({
  label,
  pendingLabel = 'Salvando…',
  variant = 'primary',
  pending = false,
}: {
  label: string;
  pendingLabel?: string;
  variant?: 'primary' | 'danger';
  pending?: boolean;
}) {
  const base = 'px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50';
  const colors =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-blue-600 text-white hover:bg-blue-700';
  return (
    <button type="submit" disabled={pending} className={`${base} ${colors}`}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function CancelLink({ href, label = 'Cancelar' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-sm font-medium border text-gray-700 hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="p-3 mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg">
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="p-3 mb-4 text-sm bg-green-50 border border-green-200 text-green-800 rounded-lg">
      {message}
    </div>
  );
}