// Service Worker — escuta eventos push do Web Push API e exibe notificação.
//
// Registrado pelo client-side em /admin/* quando user ativa permissão.
// Carregado na raiz do scope (/sw.js) pra cobrir todas as rotas autenticadas.
//
// Evento `push`: server manda JSON { title, body, url?, tag? } — exibe.
// Evento `notificationclick`: clicar abre /admin/fila-urgente (ou url vinda).
// Evento `install`/`activate`: skipWaiting pra atualizar rápido.

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let payload = {
    title: '🚨 Nova urgência na fila',
    body: 'A equipa precisa resolver um caso urgente.',
    url: '/admin/fila-urgente',
    tag: 'urgencia',
  };
  if (event.data) {
    try {
      const data = event.data.json();
      payload = {
        title: data.title || payload.title,
        body: data.body || payload.body,
        url: data.url || payload.url,
        tag: data.tag || payload.tag,
      };
    } catch (e) {
      // payload não era JSON — usa default. Não bloqueia o push.
    }
  }

  const options = {
    body: payload.body,
    icon: '/logo-madame-lash-light.png',
    badge: '/logo-madame-lash-light.png',
    tag: payload.tag,
    requireInteraction: true,
    renotify: true,
    data: { url: payload.url },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/admin/fila-urgente';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Se já tem uma janela aberta com nosso origin, foca nela.
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.indexOf(self.registration.scope) === 0 && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Senão, abre nova janela.
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});
