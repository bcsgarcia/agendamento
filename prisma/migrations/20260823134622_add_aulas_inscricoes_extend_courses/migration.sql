-- Migration ADITIVA: estender Course + criar Aula e Inscricao
-- Assume que as tabelas Customer, Service, Booking, UrgentQueue, ConversationState,
-- Whitelist, FeatureFlag, AuditLog, User, Session JÁ EXISTEM (criadas anteriormente).

-- Estender Course: novos campos
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "cargaHorariaHoras" INTEGER;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "maxAlunos" INTEGER;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "formaPagamento" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "paymentTerms" JSONB;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Indexes em Course
CREATE INDEX IF NOT EXISTS "Course_active_idx" ON "Course"("active");
CREATE INDEX IF NOT EXISTS "Course_slug_idx" ON "Course"("slug");

-- Criar Aula
CREATE TABLE IF NOT EXISTS "Aula" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "vagasOcupadas" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "local" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aula_pkey" PRIMARY KEY ("id")
);

-- Indexes em Aula
CREATE INDEX IF NOT EXISTS "Aula_courseId_dataInicio_idx" ON "Aula"("courseId", "dataInicio");
CREATE INDEX IF NOT EXISTS "Aula_status_dataInicio_idx" ON "Aula"("status", "dataInicio");

-- FK Aula -> Course (Cascade)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Aula_courseId_fkey'
    ) THEN
        ALTER TABLE "Aula" ADD CONSTRAINT "Aula_courseId_fkey"
            FOREIGN KEY ("courseId") REFERENCES "Course"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Criar Inscricao
CREATE TABLE IF NOT EXISTS "Inscricao" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "nomeInscrito" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "valorPago" INTEGER,
    "sinalPago" BOOLEAN NOT NULL DEFAULT false,
    "dataSinal" TIMESTAMP(3),
    "dataPagamentoFinal" TIMESTAMP(3),
    "statusPagamento" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id")
);

-- Indexes em Inscricao
CREATE INDEX IF NOT EXISTS "Inscricao_aulaId_idx" ON "Inscricao"("aulaId");
CREATE INDEX IF NOT EXISTS "Inscricao_statusPagamento_idx" ON "Inscricao"("statusPagamento");
CREATE INDEX IF NOT EXISTS "Inscricao_aulaId_statusPagamento_idx" ON "Inscricao"("aulaId", "statusPagamento");

-- FK Inscricao -> Aula (Cascade)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Inscricao_aulaId_fkey'
    ) THEN
        ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_aulaId_fkey"
            FOREIGN KEY ("aulaId") REFERENCES "Aula"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
