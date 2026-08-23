'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export interface ToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onChange'> {
  /** Estado atual do toggle. */
  checked: boolean;
  /** Callback disparado quando o usuário alterna o estado. */
  onChange: (checked: boolean) => void;
  /** Rótulo textual exibido à esquerda do switch. */
  label?: string;
  /** Quando true, impede interação e reduz opacidade. */
  disabled?: boolean;
}

/**
 * Switch roxo estilo iOS.
 *
 * - `checked=true`: bg `accent` (#5540D6), knob deslocado para a direita.
 * - `checked=false`: bg `pill-inactive`, knob à esquerda.
 * - Acessibilidade: `<button role="switch" aria-checked>` com focus ring accent.
 * - Animação suave via transition-transform.
 *
 * Tokens: accent/pill-inactive
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, onChange, label, disabled, className, id, ...rest },
  ref,
) {
  const labelId = id ? `${id}-label` : undefined;

  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = () => {
    if (!disabled) onChange(!checked);
  };

  const handleKeyDown: ButtonHTMLAttributes<HTMLButtonElement>['onKeyDown'] = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  const button = (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? labelId : undefined}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
        checked ? 'bg-accent' : 'bg-pill-inactive',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow-card',
          'transform transition-transform duration-150',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  );

  if (!label) return button;

  // NOTE: <label htmlFor={id}> already triggers a click on the button via the
  // implicit form association, so we MUST NOT also attach an onClick to the
  // label — doing so would fire onChange twice and cancel out.
  return (
    <div className="inline-flex items-center gap-3">
      {button}
      <label
        id={labelId}
        htmlFor={id}
        className={cn(
          'text-body text-text select-none',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer',
        )}
      >
        {label}
      </label>
    </div>
  );
});