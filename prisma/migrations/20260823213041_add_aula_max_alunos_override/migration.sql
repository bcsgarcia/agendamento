-- Migration ADITIVA: adicionar Aula.maxAlunos (override opcional)
-- Course.maxAlunos continua sendo o default; Aula.maxAlunos quando preenchido sobrescreve.
-- Verifica coluna antes de criar (idempotente para re-runs).

ALTER TABLE "Aula" ADD COLUMN IF NOT EXISTS "maxAlunos" INTEGER;
