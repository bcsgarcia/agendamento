import Link from 'next/link';
import { Hospital } from 'lucide-react';
import {
  inputClass,
  labelClass,
  FormError,
} from '@/components/AdminForm';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage =
    searchParams.error === 'invalid'
      ? 'Email ou senha incorretos.'
      : searchParams.error === 'missing'
        ? 'Preencha email e senha.'
        : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-app-bg p-4 sm:p-6">
      <div className="w-full max-w-md bg-card border border-border-subtle rounded-card p-4 sm:p-6 md:p-8 shadow-card">
        <Link
          href="/admin/login"
          className="flex flex-col items-center gap-2 mb-6 group"
          aria-label="Página de login do Agendamento Admin"
        >
          <Hospital
            className="w-8 h-8 text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <h1 className="text-h1 text-text font-semibold mt-1">
            Agendamento Admin
          </h1>
          <span className="text-caption text-text-muted">
            Acesso restrito · auditoria por log
          </span>
        </Link>

        <FormError message={errorMessage} />

        <form action="/api/auth/login" method="post" className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoFocus
              autoComplete="username"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-accent text-white rounded-card hover:bg-accent-hover transition-colors duration-150 font-medium focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Entrar
          </button>
        </form>

        <p className="text-caption text-text-muted text-center mt-6">
          Acesso restrito. Cada toggle / edição fica registrado no banco.
        </p>
      </div>
    </main>
  );
}
