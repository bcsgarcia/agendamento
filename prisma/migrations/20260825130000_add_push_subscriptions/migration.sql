-- Migration ADITIVA: Push subscriptions
-- Cria tabela para armazenar subscriptions Web Push dos usuários.
-- Aditivo: nenhuma coluna/tabela existente é tocada.

CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_utilizacaoEm" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- Unicidade do endpoint: garante 1 subscription por navegador.
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key"
  ON "PushSubscription"("endpoint");

CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx"
  ON "PushSubscription"("userId");

CREATE INDEX IF NOT EXISTS "PushSubscription_ativo_idx"
  ON "PushSubscription"("ativo");

-- FK com ON DELETE CASCADE (ao deletar user, suas subscriptions somem).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'PushSubscription_userId_fkey'
    ) THEN
        ALTER TABLE "PushSubscription"
          ADD CONSTRAINT "PushSubscription_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
