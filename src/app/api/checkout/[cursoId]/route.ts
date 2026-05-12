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
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

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
    // Curso gratuito — libera acesso direto
    await prisma.courseAccess.upsert({
      where: { userId_courseId: { userId: user.id, courseId: cursoId } },
      create: { userId: user.id, courseId: cursoId, type: 'PURCHASE' },
      update: {},
    })
    return NextResponse.redirect(new URL(`/cursos/${cursoId}`, request.url))
  }

  const nome = perfil?.name ?? user.email ?? 'Aluno'
  const email = perfil?.email ?? user.email ?? ''

  const cliente = await buscarOuCriarCliente(email, nome)

  // Salva asaasCustomerId se ainda não tiver
  if (!perfil?.asaasCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { asaasCustomerId: cliente.id },
    })
  }

  const successUrl = new URL(`/cursos/${cursoId}?pagamento=ok`, request.url).toString()
  const externalReference = buildRef('course', user.id, cursoId)

  const cobranca = await criarCobranca({
    customerId: cliente.id,
    valor: Number(curso.price),
    descricao: curso.title,
    externalReference,
    successUrl,
  })

  console.log('[checkout] resposta Asaas:', JSON.stringify(cobranca))

  if (!cobranca.invoiceUrl) {
    return NextResponse.json({ error: 'Erro ao gerar cobrança', detalhe: cobranca }, { status: 500 })
  }

  return NextResponse.redirect(cobranca.invoiceUrl)
}
