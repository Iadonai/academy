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

export async function gerarConvite(formData: FormData): Promise<void> {
  await verificarAdmin()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (formData.get('email') as string)?.trim() || null

  await prisma.invite.create({
    data: { senderId: user.id, email: email || undefined },
  })

  revalidatePath('/admin/membros')
}

export async function excluirConvite(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.invite.delete({ where: { id } })
  revalidatePath('/admin/membros')
}

export async function liberarAcesso(formData: FormData) {
  await verificarAdmin()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const cursoId = formData.get('cursoId') as string

  if (!email || !cursoId) redirect('/admin/membros?erro=campos-obrigatorios')

  const usuario = await prisma.user.findFirst({ where: { email } })
  if (!usuario) redirect('/admin/membros?erro=usuario-nao-encontrado')

  await prisma.courseAccess.upsert({
    where: { userId_courseId: { userId: usuario.id, courseId: cursoId } },
    create: { userId: usuario.id, courseId: cursoId, type: 'PURCHASE' },
    update: {},
  })

  revalidatePath('/admin/membros')
  redirect('/admin/membros?ok=acesso-liberado')
}
