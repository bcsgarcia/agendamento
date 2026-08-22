import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');
  const services = [
    { slug: 'procedimento-basico', name: 'Procedimento Básico', description: 'Procedimento genérico de teste (placeholder).', durationMin: 60, priceCents: 15000 },
    { slug: 'procedimento-avancado', name: 'Procedimento Avançado', description: 'Procedimento genérico de duração estendida (placeholder).', durationMin: 90, priceCents: 25000 },
    { slug: 'consultoria', name: 'Consultoria Inicial', description: 'Sessão de avaliação inicial (placeholder).', durationMin: 30, priceCents: 8000 },
    { slug: 'pacote-3-sessoes', name: 'Pacote 3 Sessões', description: 'Pacote com desconto para 3 sessões (placeholder).', durationMin: 180, priceCents: 40000 },
    { slug: 'manutencao', name: 'Manutenção', description: 'Sessão de manutenção/retorno (placeholder).', durationMin: 45, priceCents: 12000 }
  ];
  for (const s of services) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: s, create: s });
  }
  const courses = [
    { slug: 'curso-online-1', name: 'Curso Online — Tópico Genérico', modality: 'online', description: 'Curso online (placeholder).', priceCents: 19700, durationMin: null, purchaseUrl: '' },
    { slug: 'curso-presencial-1', name: 'Curso Presencial — Tópico Genérico', modality: 'presencial', description: 'Curso presencial (placeholder).', priceCents: 49700, durationMin: 240, purchaseUrl: '' }
  ];
  for (const c of courses) {
    await prisma.course.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  console.log(`OK: ${services.length} services + ${courses.length} courses`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
