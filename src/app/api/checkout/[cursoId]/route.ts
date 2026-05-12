import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { buscarOuCriarCliente, criarCobranca, buildRef } from '@/lib/asaas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cursoId: string }> }
) {
  const { cursoId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const cpfCnpj: string = (body.cpfCnpj ?? '').replace(/\D/g, '')

  if (!cpfCnpj || cpfCnpj.length < 11) {
    return NextResponse.json({ error: 'CPF obrigatório' }, { status: 400 })
  }

  const [perfil, curso] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, asaasCustomerId: true },
    }),
    prisma.course.findUnique({
      where: { id: cursoId },
      select: { id: true, title: true, price: true, published: true },
    }),
  ])

  if (!curso || !curso.published) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  if (Number(curso.price) === 0) {
    await prisma.courseAccess.upsert({
      where: { userId_courseId: { userId: user.id, courseId: cursoId } },
      create: { userId: user.id, courseId: cursoId, type: 'PURCHASE' },
      update: {},
    })
    return NextResponse.json({ redirect: `/cursos/${cursoId}` })
  }

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

  const successUrl = new URL(`/dashboard?pagamento=ok`, request.url).toString()
  const externalReference = buildRef('course', user.id, cursoId)

  const cobranca = await criarCobranca({
    customerId: cliente.id,
    valor: Number(curso.price),
    descricao: curso.title,
    externalReference,
    successUrl,
  })

  if (!cobranca.invoiceUrl) {
    return NextResponse.json({ error: 'Erro ao gerar cobrança', detalhe: cobranca }, { status: 500 })
  }

  // Notifica N8N para enviar lembrete WhatsApp se o pagamento não for concluído
  fetch('https://n8n.iadonaiacademy.com.br/webhook/pix-gerado', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      nome,
      fone: '',
      produto: curso.title,
      invoiceUrl: cobranca.invoiceUrl,
    }),
  }).catch(() => {})

  return NextResponse.json({ invoiceUrl: cobranca.invoiceUrl })
}
