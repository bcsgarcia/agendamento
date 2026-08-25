-- Migration ADITIVA: arquivar urgências
-- Adiciona colunas para distinguir "concluído" (resolved) de "arquivado" (archived).
-- Colunas existentes (resolvedAt/resolvedBy) NÃO são tocadas.
-- Verifica coluna antes de criar (idempotente para re-runs).

ALTER TABLE "UrgentQueue" ADD COLUMN IF NOT EXISTS "resolvedNote" TEXT;
ALTER TABLE "UrgentQueue" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "UrgentQueue" ADD COLUMN IF NOT EXISTS "archivedBy" TEXT;

CREATE INDEX IF NOT EXISTS "UrgentQueue_archivedAt_createdAt_idx"
  ON "UrgentQueue"("archivedAt", "createdAt");
