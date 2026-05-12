import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseRef } from '@/lib/asaas'

const N8N_BASE = 'https://n8n.iadonaiacademy.com.br/webhook'

async function notificarN8N(path: string, payload: Record<string, unknown>) {
  try {
    await fetch(`${N8N_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // fire-and-forget — não bloqueia a resposta ao Asaas
  }
}

// Eventos que confirmam pagamento efetivado
const EVENTOS_PAGOS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'])

// Eventos que indicam assinatura cancelada/expirada
const EVENTOS_CANCELADOS = new Set(['PAYMENT_OVERDUE', 'SUBSCRIPTION_DELETED'])

export async function POST(request: NextRequest) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN
  if (token) {
    // Asaas envia o token no header 'access_token'
    const headerToken =
      request.headers.get('access_token') ??
      request.headers.get('asaas-access-token')
    if (headerToken !== token) {
      console.warn('[asaas webhook] token inválido:', headerToken)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const evento = body.event as string
  const payment = body.payment as Record<string, unknown> | undefined
  const subscription = body.subscription as Record<string, unknown> | undefined

  const externalRef =
    (payment?.externalReference as string | undefined) ??
    (subscription?.externalReference as string | undefined)

  if (!externalRef) return NextResponse.json({ ok: true })

  const ref = parseRef(externalRef)
  if (!ref) return NextResponse.json({ ok: true })

  if (EVENTOS_PAGOS.has(evento)) {
    if (ref.type === 'course' && ref.courseId) {
      await prisma.courseAccess.upsert({
        where: { userId_courseId: { userId: ref.userId, courseId: ref.courseId } },
        create: { userId: ref.userId, courseId: ref.courseId, type: 'PURCHASE' },
        update: {},
      })

      const [usuario, curso] = await Promise.all([
        prisma.user.findUnique({ where: { id: ref.userId }, select: { email: true, name: true } }),
        prisma.course.findUnique({ where: { id: ref.courseId }, select: { title: true, price: true } }),
      ])
      notificarN8N('compra-confirmada', {
        email: usuario?.email ?? '',
        nome: usuario?.name ?? '',
        fone: '',
        valor: Number(curso?.price ?? 0),
        produto: curso?.title ?? 'Curso IADONAI',
      })
    }

    if (ref.type === 'subscription') {
      const asaasSubscriptionId = subscription?.id as string | undefined
      await prisma.subscription.upsert({
        where: { userId: ref.userId },
        create: {
          userId: ref.userId,
          status: 'ACTIVE',
          asaasSubscriptionId: asaasSubscriptionId ?? null,
        },
        update: {
          status: 'ACTIVE',
          ...(asaasSubscriptionId ? { asaasSubscriptionId } : {}),
        },
      })

      const usuario = await prisma.user.findUnique({ where: { id: ref.userId }, select: { email: true, name: true } })
      notificarN8N('compra-confirmada', {
        email: usuario?.email ?? '',
        nome: usuario?.name ?? '',
        fone: '',
        valor: Number(payment?.value ?? 0),
        produto: 'Assinatura IADONAI',
      })
    }
  }

  if (EVENTOS_CANCELADOS.has(evento) && ref.type === 'subscription') {
    await prisma.subscription.updateMany({
      where: { userId: ref.userId },
      data: { status: 'CANCELLED' },
    })
  }

  return NextResponse.json({ ok: true })
}
