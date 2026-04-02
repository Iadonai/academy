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
  redirect('/perfil')
}
