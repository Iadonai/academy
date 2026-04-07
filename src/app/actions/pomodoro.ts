'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

const XP_POMODORO = 15

export async function registrarPomodoro(lessonId: string): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await prisma.$transaction([
    prisma.gamificationLog.create({
      data: { userId: user.id, action: 'POMODORO_COMPLETE', xpEarned: XP_POMODORO },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { xpTotal: { increment: XP_POMODORO } },
    }),
  ])

  return XP_POMODORO
}
