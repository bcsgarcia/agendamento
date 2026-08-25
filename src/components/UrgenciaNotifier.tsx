'use client';
// UrgenciaNotifier — componente client-side que:
//   1. Faz polling a cada 30s no endpoint /api/urgent-queue/pendentes/count
//      → injeta/atualiza badge na sidebar (data-attribute "data-urgencia-badge")
//      → mostra banner flutuante no canto inferior direito se count aumentar
//   2. Gerencia o pedido de permissão de Web Push:
//      - Mostra modal explicativo no primeiro acesso (se Notification.permission === 'default')
//      - Quando user clica "Ativar", registra Service Worker + subscribe + envia ao backend
//      - Se Notification.permission === 'denied', NÃO mostra modal (seria chato)
//
// Por que polling em vez de SSE/WebSocket:
//   Bruno não quer adicionar dependência externa pro push. Polling HTTP
//   simples + Service Worker cobre 100% do caso de uso (urgências são raras).
//
// Posicionamento do componente: renderizado UMA VEZ no AdminShell, não em cada page.

import { useEffect, useRef, useState } from 'react';
import { Flame, X, Bell, BellOff } from 'lucide-react';

interface CountResponse {
  count: number;
  ultima_criada_em: string | null;
}

const POLL_INTERVAL_MS = 30_000;
// Quanto tempo a modal de permissão fica escondida depois do user dispensar
// (pra não reaparecer em toda navegação). 7 dias.
const PERMISSION_DISMISS_KEY = 'push_permission_dismissed_at';
const PERMISSION_DISMISS_DAYS = 7;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(publicKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  // Se já existe subscription, retorna ela.
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    // Cast necessário por mudança em TS 5.7 (lib.dom.d.ts) que estreitou
    // BufferSource pra ArrayBufferView<ArrayBuffer>; Uint8Array com
    // buffer: ArrayBufferLike não bate mais sem cast.
    applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
  });
}

export function UrgenciaNotifier() {
  const [banner, setBanner] = useState<{ motivo: string; criadoEm: string } | null>(null);
  const [mutedUntil, setMutedUntil] = useState<number>(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [vapidReady, setVapidReady] = useState(true);
  const lastSeenRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // ── Polling de count + detecção de nova urgência ──
  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (mutedUntil && Date.now() < mutedUntil) return;
      try {
        const res = await fetch('/api/urgent-queue/pendentes/count', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as CountResponse;
        if (cancelled) return;

        // Atualiza badge na sidebar — injeta <span> no item da fila se não existir.
        const link = document.querySelector<HTMLAnchorElement>(
          'a[href="/admin/fila-urgente"]',
        );
        if (link) {
          let badge = link.querySelector<HTMLElement>('[data-urgencia-badge]');
          if (!badge) {
            badge = document.createElement('span');
            badge.setAttribute('data-urgencia-badge', '');
            badge.className =
              'ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-pill text-[11px] font-semibold text-white bg-gradient-to-r from-accent-bg to-accent-bg-2';
            link.appendChild(badge);
          }
          if (data.count > 0) {
            badge.textContent = String(data.count);
            badge.removeAttribute('hidden');
          } else {
            badge.setAttribute('hidden', '');
          }
        }

        // Detecta nova urgência (só depois do 1º poll — evita mostrar no load)
        if (
          initializedRef.current &&
          data.ultima_criada_em &&
          lastSeenRef.current &&
          data.ultima_criada_em > lastSeenRef.current
        ) {
          // Busca detalhes pra mostrar no banner
          try {
            const list = await fetch('/api/urgent-queue?tab=pendentes', {
              credentials: 'same-origin',
              cache: 'no-store',
            });
            if (list.ok) {
              const items = await list.json();
              const newest = items?.items?.[0];
              if (newest) {
                setBanner({
                  motivo: newest.reason || 'Nova urgência',
                  criadoEm: newest.createdAt,
                });
              }
            }
          } catch {
            // best-effort — banner pode vir só com count se fetch falhar
            setBanner({ motivo: 'Nova urgência na fila', criadoEm: new Date().toISOString() });
          }
        }

        lastSeenRef.current = data.ultima_criada_em;
        initializedRef.current = true;
      } catch {
        // silencioso — polling é best-effort
      }
    }

    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [mutedUntil]);

  // ── Setup de permissão de push (uma vez) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPermissionState('unsupported');
      return;
    }
    const current = Notification.permission;
    setPermissionState(current);
    if (current === 'denied') return;

    // Se user dispensou nos últimos N dias, não mostra de novo
    const dismissedAt = localStorage.getItem(PERMISSION_DISMISS_KEY);
    if (dismissedAt) {
      const ageDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (ageDays < PERMISSION_DISMISS_DAYS) return;
    }

    // Verifica se já tem subscription ativa
    fetch('/api/push/status', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.subscribed) {
          setSubscribed(true);
          return;
        }
        // Mostra modal depois de 5s (não agressivo no load)
        setTimeout(() => setShowPermissionModal(true), 5000);
      })
      .catch(() => {});
  }, []);

  async function handleActivatePush() {
    setShowPermissionModal(false);
    try {
      // 1) Pede chave pública VAPID do server
      const keyRes = await fetch('/api/push/vapid-public-key');
      if (keyRes.status === 503) {
        setVapidReady(false);
        return;
      }
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        setVapidReady(false);
        return;
      }

      // 2) Pede permissão do browser (só dispara o prompt nativo)
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission !== 'granted') {
        localStorage.setItem(PERMISSION_DISMISS_KEY, String(Date.now()));
        return;
      }

      // 3) Subscribe
      const sub = await subscribeToPush(publicKey);
      if (!sub) {
        localStorage.setItem(PERMISSION_DISMISS_KEY, String(Date.now()));
        return;
      }

      // 4) Envia subscription pro backend
      const subJson = sub.toJSON();
      const resp = await fetch('/api/push/subscribe', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subJson),
      });
      if (resp.ok) {
        setSubscribed(true);
      } else {
        localStorage.setItem(PERMISSION_DISMISS_KEY, String(Date.now()));
      }
    } catch (e) {
      console.warn('[push] falha ao ativar', e);
      localStorage.setItem(PERMISSION_DISMISS_KEY, String(Date.now()));
    }
  }

  function dismissPermissionModal() {
    setShowPermissionModal(false);
    localStorage.setItem(PERMISSION_DISMISS_KEY, String(Date.now()));
  }

  function muteFor1h() {
    setMutedUntil(Date.now() + 60 * 60 * 1000);
    setBanner(null);
  }

  function dismissBanner() {
    setBanner(null);
  }

  return (
    <>
      {/* ── Banner in-page (canto inferior direito) ── */}
      {banner && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-96 bg-gradient-to-br from-accent to-accent-bg-2 text-white rounded-card shadow-2xl border border-accent-glow-bright/30 animate-slide-up"
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Flame className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                <h2 className="text-[14px] font-semibold">Nova urgência</h2>
              </div>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Fechar banner"
                className="p-1 -m-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <p className="text-[13px] leading-snug mb-3 line-clamp-3 break-words">
              {banner.motivo}
            </p>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/admin/fila-urgente"
                className="flex-1 min-w-[80px] px-3 py-1.5 rounded-[10px] bg-white/15 hover:bg-white/25 text-[12px] font-medium text-center transition-colors"
              >
                Ver fila
              </a>
              <button
                type="button"
                onClick={dismissBanner}
                className="px-3 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-[12px] transition-colors"
              >
                Dispensar
              </button>
              <button
                type="button"
                onClick={muteFor1h}
                className="px-3 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-[12px] transition-colors"
              >
                Mutar 1h
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de permissão de push (primeiro login) ── */}
      {showPermissionModal && permissionState === 'default' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="push-permission-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-card border border-border-subtle rounded-card p-5 shadow-2xl">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-accent to-accent-bg-2 grid place-items-center shrink-0">
                <Bell className="w-5 h-5 text-white" strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="push-permission-title" className="text-[15px] font-semibold text-text">
                  Ativar notificações de urgência?
                </h2>
                <p className="text-[12px] text-text-muted mt-1">
                  Você será avisado quando o bot precisar de um humano para resolver um caso.
                  Pode desativar a qualquer momento nas configurações do browser.
                </p>
              </div>
            </div>
            {!vapidReady && (
              <p className="text-[11px] text-text-muted bg-app-bg-alt rounded-[10px] p-2 mb-3">
                ℹ️ Notificações serão ativadas assim que o servidor for configurado.
              </p>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={dismissPermissionModal}
                className="px-3 py-1.5 rounded-[10px] text-[12px] text-text-muted hover:bg-app-bg-alt transition-colors"
              >
                Agora não
              </button>
              <button
                type="button"
                onClick={handleActivatePush}
                className="px-3 py-1.5 rounded-[10px] bg-gradient-to-r from-accent-bg to-accent-bg-2 text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
              >
                Ativar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador discreto se push está ativado/negado (canto inferior esquerdo) */}
      {subscribed && (
        <div
          aria-hidden="true"
          title="Notificações push ativadas"
          className="fixed bottom-3 left-3 z-40 opacity-40 hover:opacity-100 transition-opacity"
        >
          <Bell className="w-4 h-4 text-text-muted" strokeWidth={1.75} />
        </div>
      )}
      {permissionState === 'denied' && (
        <div
          aria-hidden="true"
          title="Notificações bloqueadas no browser"
          className="fixed bottom-3 left-3 z-40 opacity-40 hover:opacity-100 transition-opacity"
        >
          <BellOff className="w-4 h-4 text-text-muted" strokeWidth={1.75} />
        </div>
      )}
    </>
  );
}
