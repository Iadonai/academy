'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { concederXP } from '@/lib/xp'

const XP_POMODORO = 15

export async function registrarPomodoro(lessonId: string): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoje = new Date().toISOString().slice(0, 10)
  const concedeu = await concederXP(user.id, `pomodoro_${lessonId}_${hoje}`, XP_POMODORO)

  return concedeu ? XP_POMODORO : 0
}
