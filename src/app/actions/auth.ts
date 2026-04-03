'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?erro=credenciais-invalidas')
  }

  redirect('/dashboard')
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

  const status = convite ? 'ACTIVE' : 'PENDING'

  await prisma.user.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, email, name: nome, status },
    update: { name: nome },
  })

  if (convite) {
    await prisma.invite.update({
      where: { id: convite.id },
      data: { usedAt: new Date(), usedByEmail: email },
    })
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
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/nova-senha`,
  })

  redirect('/recuperar-senha?enviado=true')
}

export async function novaSenha(formData: FormData) {
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/auth/nova-senha?erro=falhou')
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
