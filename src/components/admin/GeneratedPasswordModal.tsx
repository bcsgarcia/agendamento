'use client';

/**
 * Modal que mostra a senha gerada (8 dígitos) uma única vez.
 *
 * Importante (regra P16 do user_profile): a senha NUNCA é logada no chat/gateway.
 * Esta modal exibe uma vez e a UI instrui o admin a copiar localmente — sem
 * histórico no chat. Após fechar, a senha some pra sempre.
 *
 * Props:
 * - password: senha gerada a ser exibida
 * - onClose: callback chamado quando o usuário fecha o modal
 */
import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

export interface GeneratedPasswordModalProps {
  password: string;
  onClose: () => void;
  /** Título exibido no header. Default: 'Senha gerada'. */
  title?: string;
  /** Mensagem após a senha — default aviso padrão. */
  notice?: string;
}

export function GeneratedPasswordModal({
  password,
  onClose,
  title = 'Senha gerada',
  notice = 'Copie agora — esta senha não vai aparecer de novo.',
}: GeneratedPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      // reset visual feedback depois de 2s (sem perder estado de "copied"
      // até fechar — mas UX comum é resetar rápido pra novo copy)
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select + document.execCommand (legado)
      const el = document.getElementById('gen-password-input') as HTMLInputElement | null;
      if (el) {
        el.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // ignora — usuário pode copiar manualmente
        }
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gen-pw-title"
    >
      <div className="w-full max-w-md bg-card border border-border-subtle rounded-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 id="gen-pw-title" className="text-h2 text-text font-semibold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:bg-card-elevated hover:text-text transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-stretch gap-2">
            <input
              id="gen-password-input"
              readOnly
              value={password}
              aria-label="Senha gerada"
              className="flex-1 font-mono text-base tracking-widest px-3 py-2 bg-app-bg border border-border-subtle rounded-input text-text"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-input bg-accent text-white text-label font-medium hover:bg-accent-hover transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  Copiar
                </>
              )}
            </button>
          </div>

          <p className="text-caption text-warning bg-warning/10 border border-warning/30 rounded-input px-3 py-2">
            {notice}
          </p>
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-border-subtle bg-card-elevated">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-input bg-app-bg border border-border-subtle text-text text-label hover:bg-card-elevated transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}