// /lib/push.ts — wrapper sobre `web-push` para envio de Web Push Notifications.
//
// Lê as chaves VAPID de variáveis de ambiente em runtime (não em build):
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (chave pública — exposta ao browser)
//   VAPID_PRIVATE_KEY             (chave privada — só server)
//   VAPID_CLAIMS_EMAIL            (ex: "mailto:admin@bcsgarcia.pt")
//
// Se as vars não estiverem configuradas, `sendPushToAllActive` vira no-op
// (mas loga warning) — assim o deploy não quebra se as chaves ainda não
// tiverem sido adicionadas no Coolify.

import webpush from 'web-push';
import { prisma } from './db';

let vapidConfigured = false;
let configuredOnce = false;

/** Configura web-push com as chaves VAPID. Idempotente. */
function ensureConfigured(): boolean {
  if (configuredOnce) return vapidConfigured;
  configuredOnce = true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const claimsEmail =
    process.env.VAPID_CLAIMS_EMAIL?.trim() || 'mailto:admin@bcsgarcia.pt';

  if (!publicKey || !privateKey) {
    console.warn(
      '[push] VAPID keys não configuradas (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). ' +
        'Notificações push ficam desativadas.',
    );
    return false;
  }

  webpush.setVapidDetails(claimsEmail, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Envia push pra TODAS as subscriptions ativas do banco.
 *
 * Falha por subscription (ex: 410 Gone quando o usuário revogou a permissão)
 * é tratada desativando a subscription — assim não retentamos pra sempre.
 *
 * Retorna { sent, failed, disabled } pra log.
 */
export async function sendPushToAllActive(payload: PushPayload): Promise<{
  sent: number;
  failed: number;
  disabled: number;
}> {
  if (!ensureConfigured()) {
    return { sent: 0, failed: 0, disabled: 0 };
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { ativo: true },
  });

  if (subs.length === 0) {
    return { sent: 0, failed: 0, disabled: 0 };
  }

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/admin/fila-urgente',
    tag: payload.tag || 'urgencia',
  });

  let sent = 0;
  let failed = 0;
  let disabled = 0;

  // Envia em paralelo — falhas individuais não cancelam as outras.
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          json,
          { TTL: 60 * 60 }, // 1h — relevante pra notificação ser descartada se offline
        );
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { ultima_utilizacaoEm: new Date() },
        });
        sent += 1;
      } catch (e: unknown) {
        const statusCode =
          (e as { statusCode?: number })?.statusCode ?? 0;
        // 404/410 = subscription inválida (rejeitada/inexistente). Desativa.
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription
            .update({
              where: { id: sub.id },
              data: { ativo: false },
            })
            .catch(() => {});
          disabled += 1;
        } else {
          failed += 1;
          console.warn(
            `[push] Falha ao enviar push (${statusCode}) p/ endpoint ${sub.endpoint.slice(0, 60)}...`,
          );
        }
      }
    }),
  );

  return { sent, failed, disabled };
}

/** Versão "fire and forget" — chama sem await, loga erro. */
export function notifyUrgenciaAsync(
  motivo: string,
  contextPreview: string,
): void {
  void sendPushToAllActive({
    title: '🚨 Nova urgência na fila',
    body: contextPreview || motivo,
    url: '/admin/fila-urgente',
    tag: 'urgencia',
  }).then((stats) => {
    if (stats.sent + stats.failed + stats.disabled > 0) {
      console.log(
        `[push] notifyUrgencia: ${stats.sent} enviados, ${stats.failed} falhas, ${stats.disabled} desativadas`,
      );
    }
  });
}
