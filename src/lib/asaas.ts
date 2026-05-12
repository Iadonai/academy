const BASE_URL = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3'

function headers() {
  return {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!,
  }
}

function dueDateAmanha(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj?: string
}

export interface AsaasPayment {
  id: string
  invoiceUrl: string
  bankSlipUrl: string | null
  status: string
  externalReference: string
}

export interface AsaasSubscription {
  id: string
  status: string
  externalReference: string
}

// Busca ou cria um cliente no Asaas pelo e-mail
export async function buscarOuCriarCliente(email: string, name: string, cpfCnpj?: string): Promise<AsaasCustomer> {
  const searchRes = await fetch(
    `${BASE_URL}/customers?email=${encodeURIComponent(email)}&limit=1`,
    { headers: headers() }
  )
  const searchData = await searchRes.json()
  if (searchData.data?.length > 0) {
    const cliente = searchData.data[0] as AsaasCustomer
    // Atualiza CPF se ainda não tinha
    if (cpfCnpj && !cliente.cpfCnpj) {
      await fetch(`${BASE_URL}/customers/${cliente.id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ name, email, cpfCnpj }),
      })
    }
    return cliente
  }

  const createRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, email, cpfCnpj: cpfCnpj ?? '', notificationDisabled: true }),
  })
  const createData = await createRes.json()
  if (!createData.id) {
    console.error('[asaas] erro ao criar cliente:', JSON.stringify(createData))
    throw new Error(createData.errors?.[0]?.description ?? 'Erro ao criar cliente no Asaas')
  }
  return createData as AsaasCustomer
}

// Cria uma cobrança avulsa (PIX, boleto ou cartão)
export async function criarCobranca(params: {
  customerId: string
  valor: number
  descricao: string
  externalReference: string
  successUrl: string
}): Promise<AsaasPayment> {
  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'UNDEFINED',
      value: params.valor,
      dueDate: dueDateAmanha(),
      description: params.descricao,
      externalReference: params.externalReference,
      callback: {
        successUrl: params.successUrl,
        autoRedirect: true,
      },
    }),
  })
  return res.json() as Promise<AsaasPayment>
}

// Cria uma assinatura mensal
export async function criarAssinatura(params: {
  customerId: string
  valor: number
  descricao: string
  externalReference: string
  successUrl: string
}): Promise<AsaasSubscription> {
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'UNDEFINED',
      value: params.valor,
      nextDueDate: dueDateAmanha(),
      cycle: 'MONTHLY',
      description: params.descricao,
      externalReference: params.externalReference,
      callback: {
        successUrl: params.successUrl,
        autoRedirect: true,
      },
    }),
  })
  return res.json() as Promise<AsaasSubscription>
}

// Cancela uma assinatura
export async function cancelarAssinatura(asaasSubscriptionId: string): Promise<void> {
  await fetch(`${BASE_URL}/subscriptions/${asaasSubscriptionId}`, {
    method: 'DELETE',
    headers: headers(),
  })
}

// Monta o externalReference para identificar o pagamento no webhook
export function buildRef(type: 'course' | 'subscription', userId: string, courseId?: string): string {
  if (type === 'course' && courseId) return `course:${courseId}:user:${userId}`
  return `subscription:user:${userId}`
}

// Parseia o externalReference recebido no webhook
export function parseRef(ref: string): { type: 'course' | 'subscription'; userId: string; courseId?: string } | null {
  if (ref.startsWith('course:')) {
    const parts = ref.split(':')
    const courseId = parts[1]
    const userId = parts[3]
    if (!courseId || !userId) return null
    return { type: 'course', userId, courseId }
  }
  if (ref.startsWith('subscription:user:')) {
    const userId = ref.replace('subscription:user:', '')
    if (!userId) return null
    return { type: 'subscription', userId }
  }
  return null
}
