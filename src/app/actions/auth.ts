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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: nome } },
  })

  if (error) {
    redirect('/cadastro?erro=email-ja-cadastrado')
  }

  if (data.user) {
    // Com convite válido → ACTIVE, sem convite → PENDING
    const status = convite ? 'ACTIVE' : 'PENDING'

    await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        name: nome,
        status,
      },
    })

    // Marcar convite como usado
    if (convite) {
      await prisma.invite.update({
        where: { id: convite.id },
        data: { usedAt: new Date(), usedByEmail: email },
      })
    }
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
