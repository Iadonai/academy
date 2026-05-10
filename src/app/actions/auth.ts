'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      redirect('/login?erro=email-nao-confirmado')
    }
    redirect('/login?erro=credenciais-invalidas')
  }

  if (data.user && process.env.N8N_WEBHOOK_BASE_URL) {
    fetch(`${process.env.N8N_WEBHOOK_BASE_URL}/webhook/boas-vindas-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.user.email, userId: data.user.id }),
    }).catch(() => {})
  }

  redirect('/dashboard?_ev=login')
}

export async function cadastro(formData: FormData) {
  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const codigoConvite = (formData.get('convite') as string)?.trim() || null

  // Validar convite se fornecido
  let convite = null
  if (codigoConvite) {
    convite = await prisma.invite.findUnique({
      where: { code: codigoConvite },
    })
    if (!convite || convite.usedAt) {
      redirect('/cadastro?erro=convite-invalido')
    }
  }

  const supabase = await createClient()

  // Verifica se já existe no banco (criado pelo webhook Kiwify)
  const usuarioExistente = await prisma.user.findUnique({ where: { email } })

  if (usuarioExistente) {
    // Usuário já existe — só atualiza a senha no Supabase Auth
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = await createAdminClient()
    await adminSupabase.auth.admin.updateUserById(usuarioExistente.id, { password })

    // Faz login direto
    await supabase.auth.signInWithPassword({ email, password })
    redirect('/dashboard')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: nome } },
  })

  if (error) {
    redirect('/cadastro?erro=email-ja-cadastrado')
  }

  // Supabase retorna identities=[] quando email já existe no Auth mas confirmação está ativa
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
    redirect('/cadastro?erro=email-ja-cadastrado')
  }

  await prisma.user.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, email, name: nome, status: 'ACTIVE' },
    update: { name: nome },
  })

  if (convite) {
    await prisma.invite.update({
      where: { id: convite.id },
      data: { usedAt: new Date(), usedByEmail: email },
    })
  }

  // Se confirmação de email está ativa, redireciona para página de aviso
  if (!data.session) {
    redirect('/confirmar-email')
  }

  redirect('/dashboard')
}

export async function loginComGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/login?erro=google-indisponivel')
  }

  redirect(data.url)
}

export async function recuperarSenha(formData: FormData) {
  const email = formData.get('email') as string

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/nova-senha`,
  })

  redirect('/recuperar-senha?enviado=true')
}

export async function novaSenha(_: unknown, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { erro: 'As senhas não coincidem. Tente novamente.' }
  }
  if (password.length < 6) {
    return { erro: 'A senha deve ter pelo menos 6 caracteres.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { erro: 'Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo.' }
  }

  return { sucesso: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
