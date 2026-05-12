import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { buscarOuCriarCliente, criarCobranca, buildRef } from '@/lib/asaas'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const cpfCnpj: string = (body.cpfCnpj ?? '').replace(/\D/g, '')
  const courseIds: string[] = Array.isArray(body.courseIds) ? body.courseIds : []

  if (!cpfCnpj || cpfCnpj.length < 11) {
    return NextResponse.json({ error: 'CPF obrigatório' }, { status: 400 })
  }
  if (courseIds.length === 0) {
    return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 })
  }

  const [perfil, cursos] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, asaasCustomerId: true },
    }),
    prisma.course.findMany({
      where: { id: { in: courseIds }, published: true },
      select: { id: true, title: true, price: true },
    }),
  ])

  const cursosPagos = cursos.filter(c => Number(c.price) > 0)
  const cursosGratis = cursos.filter(c => Number(c.price) === 0)

  // Libera acesso imediato aos gratuitos
  for (const c of cursosGratis) {
    await prisma.courseAccess.upsert({
      where: { userId_courseId: { userId: user.id, courseId: c.id } },
      create: { userId: user.id, courseId: c.id, type: 'PURCHASE' },
      update: {},
    })
  }

  if (cursosPagos.length === 0) {
    return NextResponse.json({ redirect: '/dashboard?pagamento=ok' })
  }

  const total = cursosPagos.reduce((acc, c) => acc + Number(c.price), 0)
  const nome = perfil?.name ?? user.email ?? 'Aluno'
  const email = perfil?.email ?? user.email ?? ''

  const cliente = await buscarOuCriarCliente(email, nome, cpfCnpj)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(!perfil?.asaasCustomerId ? { asaasCustomerId: cliente.id } : {}),
      cpfCnpj,
    },
  })

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      total,
      items: {
        create: cursosPagos.map(c => ({ courseId: c.id, price: c.price })),
      },
    },
  })

  const titulos = cursosPagos.map(c => c.title).join(', ')
  const successUrl = new URL('/dashboard?pagamento=ok', request.url).toString()
  const externalReference = buildRef('order', user.id, order.id)

  const cobranca = await criarCobranca({
    customerId: cliente.id,
    valor: total,
    descricao: titulos.length > 100 ? titulos.slice(0, 97) + '...' : titulos,
    externalReference,
    successUrl,
  })

  if (!cobranca.invoiceUrl) {
    return NextResponse.json({ error: 'Erro ao gerar cobrança', detalhe: cobranca }, { status: 500 })
  }

  fetch('https://n8n.iadonaiacademy.com.br/webhook/pix-gerado', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, nome, fone: '', produto: titulos, invoiceUrl: cobranca.invoiceUrl }),
  }).catch(() => {})

  return NextResponse.json({ invoiceUrl: cobranca.invoiceUrl })
}
