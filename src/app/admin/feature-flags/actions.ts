'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

/**
 * Inverte o estado `ativo` de uma FeatureFlag.
 *
 * Lê o estado atual e escreve o oposto. Se a flag não existir, não faz nada
 * (evita erro 500 quando o usuário clica em algo que sumiu entre o render e
 * o submit).
 *
 * `revalidatePath('/admin/feature-flags')` força o refetch da Server Page
 * quando a Action termina — combinado com `useOptimistic`, isso dá UX
 * "click → atualiza visual + DB → revalidate restaura o estado oficial
 * sem flicker".
 */
export async function toggleFeatureFlagAction(id: string): Promise<void> {
  const flag = await prisma.featureFlag.findUnique({ where: { id } });
  if (!flag) return;
  await prisma.featureFlag.update({
    where: { id },
    data: { ativo: !flag.ativo },
  });
  revalidatePath('/admin/feature-flags');
}
