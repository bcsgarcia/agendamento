export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function getBaseUrl(req: NextRequest): string {
  return (
    process.env.APP_URL ||
    req.headers.get('origin') ||
    (req.headers.get('x-forwarded-proto') && req.headers.get('host')
      ? `${req.headers.get('x-forwarded-proto')}://${req.headers.get('host')}`
      : null) ||
    new URL(req.url).origin
  );
}

// Adicionar/atualizar/remover número da whitelist
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const action = (form.get('action') as string) || 'add';
  const phone = (form.get('phone') as string)?.replace(/\D/g, '') || '';
  const name = (form.get('name') as string) || null;
  const id = (form.get('id') as string) || null;

  const baseUrl = getBaseUrl(req);

  if (!phone && action !== 'toggle' && action !== 'delete') {
    return NextResponse.redirect(new URL('/admin/whitelist?error=phone_required', baseUrl), { status: 303 });
  }

  if (action === 'delete' && id) {
    await prisma.whitelist.delete({ where: { id } }).catch(() => {});
  } else if (action === 'toggle' && id) {
    const current = await prisma.whitelist.findUnique({ where: { id } });
    if (current) {
      await prisma.whitelist.update({
        where: { id },
        data: { active: !current.active },
      });
    }
  } else if (action === 'add' && phone) {
    await prisma.whitelist.upsert({
      where: { phone },
      create: { phone, name, active: true },
      update: { name },
    });
  }

  return NextResponse.redirect(new URL('/admin/whitelist', baseUrl), { status: 303 });
}
