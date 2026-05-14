import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
