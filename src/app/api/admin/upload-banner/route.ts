import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const base = '/admin/configuracoes'

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (perfil?.role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url))

  const formData = await request.formData()
  const bannerLink = (formData.get('hero_banner_link') as string) || ''

  await prisma.platformConfig.upsert({
    where: { key: 'hero_banner_link' },
    create: { key: 'hero_banner_link', value: bannerLink },
    update: { value: bannerLink },
  })

  const file = formData.get('banner_file') as File | null

  if (!file || file.size === 0) {
    return NextResponse.redirect(new URL(base, request.url))
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop()
  const caminho = `platform/banner.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('course-thumbnails')
    .upload(caminho, file, { contentType: file.type || 'image/jpeg', upsert: true })

  if (uploadError) {
    return NextResponse.redirect(
      new URL(`${base}?erro=upload-falhou&detalhe=${encodeURIComponent(uploadError.message)}`, request.url)
    )
  }

  const { data: urlData } = supabase.storage.from('course-thumbnails').getPublicUrl(caminho)
  const url = `${urlData.publicUrl}?t=${Date.now()}`

  await prisma.platformConfig.upsert({
    where: { key: 'hero_banner_url' },
    create: { key: 'hero_banner_url', value: url },
    update: { value: url },
  })

  return NextResponse.redirect(new URL(base, request.url))
}
