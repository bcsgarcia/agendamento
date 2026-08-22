#!/usr/bin/env node
/**
 * Testes E2E do agendamento.bcsgarcia.pt
 *
 * Roda contra o site em produção. Valida:
 * - Middleware bloqueia /admin/* sem cookie
 * - /admin/login acessível sem cookie
 * - Login/logout funcional
 * - Toggles persistem sem quebrar outras flags
 * - Whitelist CRUD funcional
 *
 * Uso:
 *   node tests/e2e.test.mjs
 *
 * Exit code 0 = todos passaram, 1 = algum falhou.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'https://agendamento.bcsgarcia.pt';
const TEST_EMAIL = process.env.TEST_EMAIL || 'bcsgarcia@outlook.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TempPass2025!';

let _cookieJar = '';

function setCookieHeader(res) {
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length === 0) {
    const raw = res.headers.get('set-cookie');
    if (raw) setCookie.push(raw);
  }
  _cookieJar = setCookie.map(c => c.split(';')[0]).join('; ');
}

function getCookieHeader() {
  return _cookieJar;
}

function clearCookies() {
  _cookieJar = '';
}

async function fetchWithCookie(path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (_cookieJar) headers.set('Cookie', _cookieJar);
  const res = await fetch(`${BASE}${path}`, { ...init, headers, redirect: 'manual' });
  setCookieHeader(res);
  return res;
}

// =====================
// Middleware tests
// =====================

test('GET /admin/agenda SEM cookie redireciona para /admin/login', async () => {
  clearCookies();
  const res = await fetchWithCookie('/admin/agenda');
  assert.equal(res.status, 303, `expected 303, got ${res.status}`);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin\/login/, `expected redirect to /admin/login, got ${location}`);
  assert.doesNotMatch(location, /localhost/, `redirect should not point to localhost, got ${location}`);
});

test('GET /admin/whitelist SEM cookie redireciona para /admin/login', async () => {
  clearCookies();
  const res = await fetchWithCookie('/admin/whitelist');
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin\/login/);
  assert.doesNotMatch(location, /localhost/);
});

test('GET /admin SEM cookie redireciona para /admin/login', async () => {
  clearCookies();
  const res = await fetchWithCookie('/admin');
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin\/login/);
  assert.doesNotMatch(location, /localhost/);
});

test('GET /admin/feature-flags SEM cookie redireciona para /admin/login', async () => {
  clearCookies();
  const res = await fetchWithCookie('/admin/feature-flags');
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin\/login/);
  assert.doesNotMatch(location, /localhost/);
});

test('GET /admin/login SEM cookie é acessível (200)', async () => {
  clearCookies();
  const res = await fetchWithCookie('/admin/login');
  assert.equal(res.status, 200);
});

test('POST /api/admin/feature-flags SEM cookie retorna 401', async () => {
  clearCookies();
  const res = await fetchWithCookie('/api/admin/feature-flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'toggle_whitelist_enabled=on',
  });
  assert.equal(res.status, 401, `expected 401, got ${res.status}`);
});

test('POST /api/admin/whitelist SEM cookie retorna 401', async () => {
  clearCookies();
  const res = await fetchWithCookie('/api/admin/whitelist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'action=add&phone=5511911111111&name=Test',
  });
  assert.equal(res.status, 401);
});

// =====================
// Login tests
// =====================

test('POST /api/auth/login com senha errada redireciona com ?error=invalid', async () => {
  clearCookies();
  const res = await fetchWithCookie('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `email=${encodeURIComponent(TEST_EMAIL)}&password=wrong_password`,
  });
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /error=invalid/, `expected error=invalid, got ${location}`);
  assert.doesNotMatch(location, /localhost/);
});

test('POST /api/auth/login com credenciais válidas seta cookie e redireciona para /admin', async () => {
  clearCookies();
  const res = await fetchWithCookie('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `email=${encodeURIComponent(TEST_EMAIL)}&password=${encodeURIComponent(TEST_PASSWORD)}`,
  });
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin(\?|$|\/)/, `expected redirect to /admin, got ${location}`);
  assert.doesNotMatch(location, /localhost/, `redirect should not point to localhost, got ${location}`);
  assert.ok(getCookieHeader().includes('admin_session'), 'expected admin_session cookie to be set');
});

test('GET /admin/agenda COM cookie retorna 200', async () => {
  // cookie já foi setado pelo teste anterior
  const res = await fetchWithCookie('/admin/agenda');
  assert.equal(res.status, 200);
});

// =====================
// Feature flags tests
// =====================

test('GET /api/feature-flags/whitelist_enabled retorna JSON válido', async () => {
  const res = await fetchWithCookie('/api/feature-flags/whitelist_enabled');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(typeof data === 'object');
  assert.equal(data.nome, 'whitelist_enabled');
  assert.ok(typeof data.ativo === 'boolean');
});

test('POST toggle feature flag só altera o flag clicado (não reseta outros)', async () => {
  // Pega estado atual de todas as flags
  const flags = ['whitelist_enabled', 'ai_ativa', 'modo_debug', 'manutencao'];
  const antes = {};
  for (const f of flags) {
    const r = await fetchWithCookie(`/api/feature-flags/${f}`);
    const d = await r.json();
    antes[f] = d.ativo;
  }

  // Toca SÓ em whitelist_enabled
  const novoValor = !antes.whitelist_enabled;
  const res = await fetchWithCookie('/api/admin/feature-flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `toggle_whitelist_enabled=${novoValor ? 'on' : 'off'}`,
  });
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.doesNotMatch(location, /localhost/);

  // Verifica que SÓ whitelist_enabled mudou
  for (const f of flags) {
    const r = await fetchWithCookie(`/api/feature-flags/${f}`);
    const d = await r.json();
    if (f === 'whitelist_enabled') {
      assert.equal(d.ativo, novoValor, `expected whitelist_enabled=${novoValor}, got ${d.ativo}`);
    } else {
      assert.equal(d.ativo, antes[f], `flag ${f} should not have changed (was ${antes[f]}, now ${d.ativo})`);
    }
  }

  // Volta ao estado original
  await fetchWithCookie('/api/admin/feature-flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `toggle_whitelist_enabled=${antes.whitelist_enabled ? 'on' : 'off'}`,
  });
});

// =====================
// Whitelist tests
// =====================

test('POST /api/admin/whitelist (action=add) adiciona número e redireciona corretamente', async () => {
  const testPhone = '5511999' + String(Date.now()).slice(-7);
  const res = await fetchWithCookie('/api/admin/whitelist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `action=add&phone=${testPhone}&name=Teste E2E`,
  });
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin\/whitelist/);
  assert.doesNotMatch(location, /localhost/);

  // Verifica que o número está na whitelist
  const check = await fetchWithCookie(`/api/whitelist?phone=${testPhone}`);
  const data = await check.json();
  assert.equal(data.allowed, true, `phone ${testPhone} should be allowed`);
});

test('POST /api/admin/whitelist (action=add) com telefone vazio redireciona com erro', async () => {
  const res = await fetchWithCookie('/api/admin/whitelist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'action=add&phone=',
  });
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /error=phone_required/);
});

// =====================
// Logout tests
// =====================

test('POST /api/auth/logout invalida sessão e redireciona', async () => {
  const res = await fetchWithCookie('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: '',
  });
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin\/login/);
  assert.doesNotMatch(location, /localhost/);

  // Depois do logout, /admin deve redirecionar pra login
  const after = await fetchWithCookie('/admin/agenda');
  assert.equal(after.status, 303);
  const afterLoc = after.headers.get('location') || '';
  assert.match(afterLoc, /\/admin\/login/);
});
