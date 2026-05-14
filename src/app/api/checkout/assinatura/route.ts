import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { buscarOuCriarCliente, criarCobranca, buildRef } from '@/lib/asaas'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  // Já tem acesso completo — redireciona direto
  const assinaturaAtiva = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
  })
  if (assinaturaAtiva) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const perfil = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, asaasCustomerId: true },
  })

  const nome = perfil?.name ?? user.email ?? 'Aluno'
  const email = perfil?.email ?? user.email ?? ''

  const cliente = await buscarOuCriarCliente(email, nome)

  if (!perfil?.asaasCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { asaasCustomerId: cliente.id },
    })
  }

  // Valor configurável pelo admin em Configurações (padrão R$ 197,00)
  const configValor = await prisma.platformConfig.findUnique({
    where: { key: 'asaas_subscription_price' },
  })
  const valor = configValor ? parseFloat(configValor.value) : 97.00

  const successUrl = new URL('/dashboard?acesso=ok', request.url).toString()
  // externalReference tipo 'subscription' → webhook cria Subscription ACTIVE → libera todos os cursos
  const externalReference = buildRef('subscription', user.id)

  const cobranca = await criarCobranca({
    customerId: cliente.id,
    valor,
    descricao: 'Acesso Completo IADONAI Academy — Todos os cursos',
    externalReference,
    successUrl,
  })

  if (!cobranca.invoiceUrl) {
    console.error('[acesso-completo] Asaas não retornou invoiceUrl:', JSON.stringify(cobranca))
    return NextResponse.redirect(new URL('/dashboard?erro=pagamento', request.url))
  }

  return NextResponse.redirect(cobranca.invoiceUrl)
}
