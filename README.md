# Sistema de Agendamento

Backend Next.js (App Router) + Prisma + Postgres para clínica de estética.

## Stack

- **Next.js 14** (App Router, Server Actions, route handlers)
- **Prisma** ORM + **PostgreSQL**
- **Docker** multi-stage build
- **Traefik** + **Let's Encrypt** via Coolify labels

## Setup local

```bash
# 1. Variáveis de ambiente
cp .env.example .env
# Editar DATABASE_URL

# 2. Deps + Prisma + seed
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# 3. Dev
npm run dev

# 4. Abrir
open http://localhost:3000
```

## Estrutura

```
prisma/
  schema.prisma     # Schema (Customer, Service, Booking, Course, etc.)
  seed.ts           # Seed com placeholders

src/
  app/
    page.tsx                          # Home
    layout.tsx                        # Layout + nav
    globals.css
    admin/
      page.tsx                        # Dashboard
      agenda/page.tsx
      clientes/page.tsx
      servicos/page.tsx
      fila-urgente/page.tsx
    api/
      health/route.ts
      services/route.ts
      customers/lookup/route.ts
      availability/route.ts
      bookings/route.ts
      conversation-state/route.ts
      urgent-queue/route.ts
      courses/route.ts
  lib/
    db.ts                             # Prisma client singleton
    helpers.ts                        # formatBRL, addMinutes, generateSlots

Dockerfile                              # Multi-stage (node 20 Debian)
next.config.js                          # Standalone output
tailwind.config.ts
tsconfig.json
package.json
```

## API Endpoints

| Method | Path | Descrição |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/services?slug=X` | Lista/busca de serviço |
| GET | `/api/customers/lookup?phone=X` | CRM: cria se não existe |
| GET | `/api/availability?serviceSlug=X&from=...&to=...` | Slots livres |
| POST | `/api/bookings` | Cria booking (valida conflito) |
| GET | `/api/bookings` | Lista últimos 100 |
| GET/POST | `/api/conversation-state` | Máquina de estados por cliente |
| GET/POST | `/api/urgent-queue` | Fila de urgência |
| GET | `/api/courses?modality=X` | Lista de cursos |

## Deploy via Coolify (GitHub)

1. Push pra `bcsgarcia/agendamento`
2. Coolify → **+ New Resource → Application → Public/Private Repository**
3. Build Pack: **Dockerfile**
4. Port: `3000`
5. Env: `DATABASE_URL=postgresql://agendamento:***@postgres-agendamento:5432/agendamento`
6. Domain: `agendamento.bcsgarcia.pt`
7. Deploy

## Notas

- **Postgres** 16+ necessário (criar container Postgres no Coolify)
- **SSL/TLS** via Let's Encrypt automático
- **Primeiro seed**: 5 serviços + 2 cursos placeholder
- **Patch no Dockerfile**: força bind `0.0.0.0` (Docker injeta HOSTNAME=container-id)
- **Próximo passo**: configurar tools do Fluxi pra consumir estes endpoints
