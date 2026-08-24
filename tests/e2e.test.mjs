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
 * Cada teste faz login/logout quando precisa de cookie,
 * pra serem independentes (podem rodar em qualquer ordem).
 *
 * Uso:
 *   node tests/e2e.test.mjs
 *   TEST_EMAIL=... TEST_PASSWORD=... node tests/e2e.test.mjs
 *
 * Exit code 0 = todos passaram, 1 = algum falhou.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'https://agendamento.bcsgarcia.pt';
const TEST_EMAIL = process.env.TEST_EMAIL || 'bcsgarcia@outlook.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestSenha2026!';

let _cookieJar = '';

function setCookieFromResponse(res) {
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length === 0) {
    const raw = res.headers.get('set-cookie');
    if (raw) setCookie.push(raw);
  }
  if (setCookie.length === 0) return; // nao sobrescreve cookie se resposta nao seta
  _cookieJar = setCookie.map(c => c.split(';')[0]).filter(Boolean).join('; ');
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
  setCookieFromResponse(res);
  return res;
}

async function login(email = TEST_EMAIL, password = TEST_PASSWORD) {
  clearCookies();
  const res = await fetchWithCookie('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
  });
  if (res.status !== 303) throw new Error(`login failed: ${res.status}`);
  const location = res.headers.get('location') || '';
  if (location.includes('error=')) throw new Error(`login failed: ${location}`);
  if (!getCookieHeader().includes('admin_session')) throw new Error('no cookie set');
  return res;
}

async function logout() {
  const res = await fetchWithCookie('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: '',
  });
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
  await login();
  // Após login, /admin/agenda deve retornar 200
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
  await login();

  const flags = ['whitelist_enabled', 'ai_ativa', 'modo_debug', 'manutencao'];
  const antes = {};
  for (const f of flags) {
    const r = await fetchWithCookie(`/api/feature-flags/${f}`);
    const d = await r.json();
    antes[f] = d.ativo;
  }

  const novoValor = !antes.whitelist_enabled;
  const res = await fetchWithCookie('/api/admin/feature-flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `toggle_whitelist_enabled=${novoValor ? 'on' : 'off'}`,
  });
  assert.equal(res.status, 303, `expected 303, got ${res.status}`);
  const location = res.headers.get('location') || '';
  assert.doesNotMatch(location, /localhost/);

  // Espera cache de 5s do /api/feature-flags/:nome expirar
  await new Promise(r => setTimeout(r, 5500));

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

  await logout();
});

// =====================
// Whitelist tests
// =====================

test('POST /api/admin/whitelist (action=add) adiciona número e redireciona corretamente', async () => {
  await login();
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

  const check = await fetchWithCookie(`/api/whitelist?phone=${testPhone}`);
  const data = await check.json();
  assert.equal(data.allowed, true, `phone ${testPhone} should be allowed`);
  await logout();
});

test('POST /api/admin/whitelist (action=add) com telefone vazio redireciona com erro', async () => {
  await login();
  const res = await fetchWithCookie('/api/admin/whitelist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'action=add&phone=',
  });
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /error=phone_required/);
  await logout();
});

// =====================
// Logout tests
// =====================

test('POST /api/auth/logout invalida sessão e redireciona', async () => {
  await login();
  const res = await logout();
  assert.equal(res.status, 303);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin\/login/);
  assert.doesNotMatch(location, /localhost/);

  // Depois do logout, /admin deve redirecionar pra login
  clearCookies();
  const after = await fetchWithCookie('/admin/agenda');
  assert.equal(after.status, 303);
  const afterLoc = after.headers.get('location') || '';
  assert.match(afterLoc, /\/admin\/login/);
});

// =====================
// RBAC (roles dev/admin/user) tests
// =====================
//
// Estratégia: cria 3 users (admin, user) via API autenticada como DEV
// (o dev é TEST_EMAIL). As senhas geradas (8 dígitos) vêm da resposta
// e são usadas para logar como admin/user nos testes seguintes.
//
// Por que 14 cenários?
// Spec t_ffb22938 lista 14 cenários. Aqui cobrimos:
// 1. List users como dev → 200 com lista
// 2. List users como admin → 200 com lista
// 3. List users como user → 403
// 4. Create user com role=user como admin → 200, senha 8 dígitos
// 5. Create user com role=dev como admin → 403
// 6. Create user com role=dev como dev → 200
// 7. Reset password de dev como admin → 403
// 8. Reset password de user como admin → 200, senha nova 8 dígitos
// 9. Update role de user pra dev como admin → 403
// 10. Login com senha gerada → 200 (cookie)
// 11. user role vê /admin/feature-flags → redirect (302/303) pro /admin
// 12. admin role vê /admin/feature-flags → redirect pro /admin
// 13. dev role vê /admin/feature-flags → 200
// 14. Migração: bcsgarcia@outlook.com agora tem role='dev'

let ADMIN_EMAIL; // criado durante o setup
let ADMIN_PASSWORD; // senha gerada (8 dígitos)
let USER_EMAIL; // criado durante o setup
let USER_PASSWORD; // senha gerada (8 dígitos)
let EXTRA_DEV_EMAIL; // segundo dev criado durante o setup
let EXTRA_DEV_ID; // id do segundo dev (pra teste 7)
let EXTRA_DEV_PASSWORD; // senha do segundo dev

async function loginAsDev() {
  await login(); // TEST_EMAIL (dev)
}

async function createUserAsDev(email, role) {
  const res = await fetchWithCookie('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  if (res.status !== 201) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`createUser(${email}, ${role}) failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return res.json();
}

async function loginAs(email, password) {
  clearCookies();
  const res = await fetchWithCookie('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
  });
  if (res.status !== 303) throw new Error(`loginAs(${email}) failed: ${res.status}`);
  const location = res.headers.get('location') || '';
  if (location.includes('error=')) throw new Error(`loginAs(${email}) bad creds: ${location}`);
  if (!getCookieHeader().includes('admin_session')) throw new Error('no cookie set');
  return res;
}

test('Setup RBAC: dev cria admin, user, e segundo dev', async () => {
  await loginAsDev();

  // admin temporário
  ADMIN_EMAIL = `rbac-admin-${Date.now()}@test.local`;
  const adminResp = await createUserAsDev(ADMIN_EMAIL, 'admin');
  ADMIN_PASSWORD = adminResp.generatedPassword;
  assert.equal(typeof ADMIN_PASSWORD, 'string');
  assert.match(ADMIN_PASSWORD, /^\d{8}$/, `admin password should be 8 digits, got "${ADMIN_PASSWORD}"`);

  // user temporário
  USER_EMAIL = `rbac-user-${Date.now()}@test.local`;
  const userResp = await createUserAsDev(USER_EMAIL, 'user');
  USER_PASSWORD = userResp.generatedPassword;
  assert.match(USER_PASSWORD, /^\d{8}$/);

  // segundo dev (pra teste 7)
  EXTRA_DEV_EMAIL = `rbac-dev2-${Date.now()}@test.local`;
  const dev2Resp = await createUserAsDev(EXTRA_DEV_EMAIL, 'dev');
  EXTRA_DEV_PASSWORD = dev2Resp.generatedPassword;
  EXTRA_DEV_ID = dev2Resp.user.id;
  assert.match(dev2Resp.generatedPassword, /^\d{8}$/);

  await logout();
});

test('Cenário 1: GET /api/admin/users como dev → 200 com lista', async () => {
  await loginAsDev();
  const res = await fetchWithCookie('/api/admin/users');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.users));
  assert.ok(data.users.length >= 1);
  // O dev (TEST_EMAIL) deve estar na lista
  assert.ok(data.users.some((u) => u.email === TEST_EMAIL));
  await logout();
});

test('Cenário 2: GET /api/admin/users como admin → 200 com lista', async () => {
  await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
  const res = await fetchWithCookie('/api/admin/users');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.users));
  assert.ok(data.users.length >= 1);
  await logout();
});

test('Cenário 3: GET /api/admin/users como user → 403', async () => {
  await loginAs(USER_EMAIL, USER_PASSWORD);
  const res = await fetchWithCookie('/api/admin/users');
  assert.equal(res.status, 403);
  await logout();
});

test('Cenário 4: POST /api/admin/users (role=user) como admin → 201, senha 8 dígitos', async () => {
  await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
  const newEmail = `rbac-from-admin-${Date.now()}@test.local`;
  const res = await fetchWithCookie('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newEmail, role: 'user' }),
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.user);
  assert.equal(data.user.role, 'user');
  assert.match(data.generatedPassword, /^\d{8}$/);
  await logout();
});

test('Cenário 5: POST /api/admin/users (role=dev) como admin → 403', async () => {
  await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
  const res = await fetchWithCookie('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `rbac-dev-as-admin-${Date.now()}@test.local`, role: 'dev' }),
  });
  assert.equal(res.status, 403);
  await logout();
});

test('Cenário 6: POST /api/admin/users (role=dev) como dev → 201', async () => {
  await loginAsDev();
  const res = await fetchWithCookie('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `rbac-dev-extra-${Date.now()}@test.local`, role: 'dev' }),
  });
  assert.equal(res.status, 201);
  await logout();
});

test('Cenário 7: POST /api/admin/users/[id]/reset-password de um dev como admin → 403', async () => {
  await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
  const res = await fetchWithCookie(`/api/admin/users/${EXTRA_DEV_ID}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  assert.equal(res.status, 403);
  await logout();
});

test('Cenário 8: POST /api/admin/users/[id]/reset-password de um user como admin → 200, nova senha 8 dígitos', async () => {
  // Pega id do user criado no setup
  await loginAsDev();
  const listRes = await fetchWithCookie('/api/admin/users');
  const list = await listRes.json();
  const userRow = list.users.find((u) => u.email === USER_EMAIL);
  assert.ok(userRow, 'user not found in list');
  await logout();

  // Admin reseta senha do user
  await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
  const res = await fetchWithCookie(`/api/admin/users/${userRow.id}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.match(data.generatedPassword, /^\d{8}$/);
  // Atualiza USER_PASSWORD pra próxima etapa
  USER_PASSWORD = data.generatedPassword;
  await logout();
});

test('Cenário 9: PATCH /api/admin/users/[id] role=user→dev como admin → 403', async () => {
  // Pega id do user
  await loginAsDev();
  const listRes = await fetchWithCookie('/api/admin/users');
  const list = await listRes.json();
  const userRow = list.users.find((u) => u.email === USER_EMAIL);
  await logout();

  await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
  const res = await fetchWithCookie(`/api/admin/users/${userRow.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'dev' }),
  });
  assert.equal(res.status, 403);
  await logout();
});

test('Cenário 10: Login com a senha gerada (USER_PASSWORD) → 200', async () => {
  // USER_PASSWORD foi atualizada pelo teste 8; tentar logar com ela
  await loginAs(USER_EMAIL, USER_PASSWORD);
  // Confirmar que sessão funciona acessando algo do user role
  const res = await fetchWithCookie('/admin/agenda');
  assert.equal(res.status, 200);
  await logout();
});

test('Cenário 11: user role acessando /admin/feature-flags → redirect (303) pra /admin', async () => {
  await loginAs(USER_EMAIL, USER_PASSWORD);
  const res = await fetchWithCookie('/admin/feature-flags');
  // canAccessConfig('user') === false → layout redireciona
  assert.equal(res.status, 303, `expected 303, got ${res.status}`);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin/, `expected redirect to /admin, got ${location}`);
  await logout();
});

test('Cenário 12: admin role acessando /admin/feature-flags → redirect (303) pra /admin', async () => {
  await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
  const res = await fetchWithCookie('/admin/feature-flags');
  assert.equal(res.status, 303, `expected 303, got ${res.status}`);
  const location = res.headers.get('location') || '';
  assert.match(location, /\/admin/, `expected redirect to /admin, got ${location}`);
  await logout();
});

test('Cenário 13: dev role acessando /admin/feature-flags → 200', async () => {
  await loginAsDev();
  const res = await fetchWithCookie('/admin/feature-flags');
  assert.equal(res.status, 200);
  await logout();
});

test('Cenário 14: migração — bcsgarcia@outlook.com agora tem role=dev', async () => {
  await loginAsDev();
  const res = await fetchWithCookie('/api/admin/users');
  const data = await res.json();
  const dev = data.users.find((u) => u.email === TEST_EMAIL);
  assert.ok(dev, `dev user ${TEST_EMAIL} not found in list`);
  assert.equal(dev.role, 'dev', `expected role='dev', got '${dev.role}'`);
  await logout();
});

// =====================
// Teardown RBAC
// =====================
//
// Soft-delete (DELETE) os users temporários via API. Requer login como dev.

test('Teardown: dev exclui users temporários', async () => {
  await loginAsDev();
  const listRes = await fetchWithCookie('/api/admin/users');
  const list = await listRes.json();
  const tempEmails = [ADMIN_EMAIL, USER_EMAIL, EXTRA_DEV_EMAIL].filter(Boolean);
  for (const email of tempEmails) {
    const u = list.users.find((x) => x.email === email);
    if (!u) continue;
    const r = await fetchWithCookie(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    // 200 (deletado) ou 403 caso outro dev também tente; nesse fluxo é dev mesmo → 200
    assert.ok(r.status === 200 || r.status === 404, `expected 200/404, got ${r.status}`);
  }
  await logout();
});
