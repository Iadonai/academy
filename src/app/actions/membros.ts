'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verificarAdmin } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'

export async function aprovarMembro(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } })
  revalidatePath('/ranking')
  revalidatePath('/admin/membros')
}

export async function rejeitarMembro(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.user.update({ where: { id }, data: { status: 'BANNED' } })
  revalidatePath('/ranking')
  revalidatePath('/admin/membros')
}

export async function banirMembro(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.user.update({ where: { id }, data: { status: 'BANNED' } })
  revalidatePath('/ranking')
  revalidatePath('/admin/membros')
}

export async function reativarMembro(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } })
  revalidatePath('/ranking')
  revalidatePath('/admin/membros')
}

export async function gerarConvite(formData: FormData) {
  await verificarAdmin()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (formData.get('email') as string)?.trim() || null

  const convite = await prisma.invite.create({
    data: { senderId: user.id, email: email || undefined },
  })

  revalidatePath('/admin/membros')
  return convite.code
}

export async function excluirConvite(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.invite.delete({ where: { id } })
  revalidatePath('/admin/membros')
}
