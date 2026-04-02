import { prisma } from '@/lib/prisma'

export function calcularNivel(xpTotal: number): number {
  return Math.floor(xpTotal / 200) + 1
}

/**
 * Concede XP ao usuário uma única vez por ação (idempotente via `action` key).
 * Retorna true se XP foi concedido, false se já havia log para essa ação.
 */
export async function concederXP(
  userId: string,
  action: string,
  xp: number,
): Promise<boolean> {
  const jaTemLog = await prisma.gamificationLog.findFirst({
    where: { userId, action },
  })
  if (jaTemLog) return false

  const user = await prisma.user.update({
    where: { id: userId },
    data: { xpTotal: { increment: xp } },
    select: { xpTotal: true },
  })

  const novoNivel = calcularNivel(user.xpTotal)

  await Promise.all([
    prisma.gamificationLog.create({
      data: { userId, action, xpEarned: xp },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { level: novoNivel },
    }),
  ])

  return true
}
