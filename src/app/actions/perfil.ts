'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function editarPerfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const avatar = formData.get('avatar') as File | null

  let avatarUrl: string | undefined

  if (avatar && avatar.size > 0) {
    const ext = avatar.name.split('.').pop()
    const caminho = `${user.id}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(caminho, avatar, { contentType: avatar.type, upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(caminho)
      avatarUrl = `${data.publicUrl}?t=${Date.now()}`
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  })

  revalidatePath('/perfil')
  revalidatePath('/comunidade')
  redirect('/perfil?salvo=true')
}

export async function trocarSenha(formData: FormData) {
  const novaSenha = (formData.get('nova_senha') as string).trim()
  const confirmar = (formData.get('confirmar_senha') as string).trim()

  if (novaSenha.length < 6) redirect('/perfil?erro=senha-curta')
  if (novaSenha !== confirmar) redirect('/perfil?erro=senhas-diferentes')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  if (error) redirect('/perfil?erro=senha-falhou')

  redirect('/perfil?senha=alterada')
}
