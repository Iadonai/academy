import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { buscarOuCriarCliente, criarAssinatura, buildRef } from '@/lib/asaas'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  // Já tem assinatura ativa — redireciona direto
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

  // Valor configurável pelo admin (padrão R$ 49,90)
  const configValor = await prisma.platformConfig.findUnique({
    where: { key: 'asaas_subscription_price' },
  })
  const valor = configValor ? parseFloat(configValor.value) : 49.90

  const successUrl = new URL('/dashboard?assinatura=ok', request.url).toString()
  const externalReference = buildRef('subscription', user.id)

  const assinatura = await criarAssinatura({
    customerId: cliente.id,
    valor,
    descricao: 'Assinatura IADONAI Academy — Acesso completo',
    externalReference,
    successUrl,
  })

  if (!assinatura.id) {
    console.error('[assinatura] Asaas rejeitou criação:', JSON.stringify(assinatura))
    return NextResponse.redirect(new URL('/dashboard?erro=assinatura', request.url))
  }

  // Busca o link de pagamento — tenta até 3x pois pode haver delay
  const BASE_URL = process.env.ASAAS_SANDBOX === 'true'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3'

  const asaasHeaders = {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!,
  }

  let invoiceUrl: string | null = null

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    if (tentativa > 0) await new Promise(r => setTimeout(r, 1000))

    const cobrancasRes = await fetch(
      `${BASE_URL}/subscriptions/${assinatura.id}/payments?limit=1`,
      { headers: asaasHeaders }
    )
    const cobrancasData = await cobrancasRes.json()
    console.log(`[assinatura] tentativa ${tentativa + 1} payments:`, JSON.stringify(cobrancasData))

    invoiceUrl = cobrancasData.data?.[0]?.invoiceUrl ?? null
    if (invoiceUrl) break
  }

  if (!invoiceUrl) {
    console.error('[assinatura] invoiceUrl não encontrado para sub:', assinatura.id)
    return NextResponse.redirect(new URL('/dashboard?erro=pagamento', request.url))
  }

  return NextResponse.redirect(invoiceUrl)
}
