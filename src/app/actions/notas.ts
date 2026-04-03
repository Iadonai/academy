'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function salvarNota(lessonId: string, content: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!content.trim()) {
    await prisma.note.deleteMany({ where: { userId: user.id, lessonId } })
    return
  }

  await prisma.note.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, content },
    update: { content },
  })
}
