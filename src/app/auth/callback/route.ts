import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard?_ev=login'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const exists = await prisma.user.findUnique({ where: { id: data.user.id } })
      if (!exists) {
        // Verifica se já existe pelo email (ex: criado pelo Kiwify com outro UUID)
        const existsByEmail = await prisma.user.findUnique({ where: { email: data.user.email! } })
        if (existsByEmail) {
          // Atualiza avatar/nome com dados do Google sem mudar o ID
          await prisma.user.update({
            where: { email: data.user.email! },
            data: {
              avatarUrl: data.user.user_metadata?.avatar_url ?? existsByEmail.avatarUrl,
              name: data.user.user_metadata?.full_name ?? existsByEmail.name,
            },
          })
        } else {
          await prisma.user.create({
            data: {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name ?? data.user.email!,
              avatarUrl: data.user.user_metadata?.avatar_url ?? null,
              status: 'ACTIVE',
            },
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=oauth-falhou`)
}
