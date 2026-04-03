import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Eventos que indicam pagamento aprovado
const EVENTOS_APROVADOS = ['order_approved', 'subscription_active']
// Eventos de cancelamento/reembolso
const EVENTOS_CANCELADOS = ['order_refunded', 'subscription_cancelled', 'subscription_expired']

export async function POST(req: NextRequest) {
  try {
    // Validar token da Kiwify
    const token = req.nextUrl.searchParams.get('token')
    const tokenEsperado = process.env.KIWIFY_WEBHOOK_TOKEN

    if (tokenEsperado && token !== tokenEsperado) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await req.json()
    console.log('[kiwify] body completo:', JSON.stringify(body, null, 2))
    const evento = body.webhook_event_type as string

    // Email e nome do comprador
    const email = body.Customer?.email as string
    const nome = body.Customer?.full_name as string
    const produtoId = body.Product?.id as string
    const planId = body.Subscription?.plan_id as string | undefined

    if (!email || !produtoId) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
    }

    // ── Pagamento aprovado ───────────────────────────────────────────────────
    if (EVENTOS_APROVADOS.includes(evento)) {

      // Busca ou cria o usuário
      let usuario = await prisma.user.findUnique({ where: { email } })

      if (!usuario) {
        // Gera senha aleatória
        const senha = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

        // Cria no Supabase Auth
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminSupabase = await createAdminClient()

        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email,
          password: senha,
          email_confirm: true,
        })

        if (authError || !authData.user) {
          console.error('[kiwify] erro ao criar usuário:', authError?.message)
          return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
        }

        usuario = await prisma.user.create({
          data: {
            id: authData.user.id,
            email,
            name: nome || email.split('@')[0],
            status: 'ACTIVE',
          },
        })

        // Salva senha temporária para enviar por email/WhatsApp
        await prisma.platformConfig.upsert({
          where: { key: `temp_password_${usuario.id}` },
          create: { key: `temp_password_${usuario.id}`, value: senha },
          update: { value: senha },
        })

        console.log(`[kiwify] usuário criado: ${email}`)
      } else {
        // Garante que está ativo
        await prisma.user.update({
          where: { id: usuario.id },
          data: { status: 'ACTIVE' },
        })
      }

      // Verifica se é assinatura (acesso a tudo) ou curso avulso
      const configAssinatura = await prisma.platformConfig.findUnique({
        where: { key: 'kiwify_subscription_product_id' },
      })

      if (configAssinatura?.value === produtoId || (planId && configAssinatura?.value === planId)) {
        // Assinatura — cria/renova subscription
        const kiwifySubId = body.Subscription?.id ?? body.order_id ?? `kiwify_${Date.now()}`

        await prisma.subscription.upsert({
          where: { userId: usuario.id },
          create: {
            userId: usuario.id,
            kiwifySubscriptionId: kiwifySubId,
            status: 'ACTIVE',
          },
          update: {
            status: 'ACTIVE',
            kiwifySubscriptionId: kiwifySubId,
          },
        })
        console.log(`[kiwify] assinatura ativada: ${email}`)
      } else {
        // Curso avulso — busca o curso pelo kiwifyProductId
        const curso = await prisma.course.findFirst({
          where: { kiwifyProductId: produtoId },
        })

        if (curso) {
          await prisma.courseAccess.upsert({
            where: { userId_courseId: { userId: usuario.id, courseId: curso.id } },
            create: { userId: usuario.id, courseId: curso.id, type: 'PURCHASE' },
            update: {},
          })
          console.log(`[kiwify] acesso liberado: ${email} → ${curso.title}`)
        } else {
          console.warn(`[kiwify] produto não encontrado: ${produtoId}`)
        }
      }
    }

    // ── Cancelamento / reembolso ─────────────────────────────────────────────
    if (EVENTOS_CANCELADOS.includes(evento)) {
      const usuario = await prisma.user.findUnique({ where: { email } })
      if (usuario) {
        await prisma.subscription.updateMany({
          where: { userId: usuario.id },
          data: { status: 'CANCELLED' },
        })
        console.log(`[kiwify] assinatura cancelada: ${email}`)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[kiwify] erro no webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
