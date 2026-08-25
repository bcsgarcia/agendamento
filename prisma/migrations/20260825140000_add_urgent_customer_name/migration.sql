-- Migration ADITIVA: nome do cliente na fila de urgencias
-- Bruno pediu em 2026-08-25 que a Andy (id=3 no Fluxi) colete o nome completo
-- do cliente ANTES de chamar enfileirar_urgencia, para a equipa Rastelli/Aline
-- saber como cumprimentar o cliente no follow-up.
--
-- Coluna eh nullable: clientes que operarem em modo anonimo (recusaram dar dados)
-- terao customerName = NULL.
-- Verifica coluna antes de criar (idempotente para re-runs).

ALTER TABLE "UrgentQueue" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
