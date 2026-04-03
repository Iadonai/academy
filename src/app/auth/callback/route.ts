import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Cria o usuario no banco se ainda nao existir
      const exists = await prisma.user.findUnique({ where: { id: data.user.id } })
      if (!exists) {
        // Verifica se veio de convite (cookie ou searchParam)
        const codigoConvite = searchParams.get('convite') ?? null
        let status: 'ACTIVE' | 'PENDING' = 'PENDING'

        if (codigoConvite) {
          const convite = await prisma.invite.findUnique({ where: { code: codigoConvite } })
          if (convite && !convite.usedAt) {
            status = 'ACTIVE'
            await prisma.invite.update({
              where: { id: convite.id },
              data: { usedAt: new Date(), usedByEmail: data.user.email },
            })
          }
        }

        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name ?? data.user.email!,
            avatarUrl: data.user.user_metadata?.avatar_url ?? null,
            status,
          },
        })

        if (status === 'PENDING') {
          return NextResponse.redirect(`${origin}/aguardando`)
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=oauth-falhou`)
}
