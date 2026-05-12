import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (perfil?.role !== 'ADMIN') return NextResponse.json({ ok: false, error: 'Acesso negado' }, { status: 403 })

  const formData = await request.formData()
  const bannerLink = (formData.get('hero_banner_link') as string) || ''
  const file = formData.get('banner_file') as File | null

  await prisma.platformConfig.upsert({
    where: { key: 'hero_banner_link' },
    create: { key: 'hero_banner_link', value: bannerLink },
    update: { value: bannerLink },
  })

  if (!file || file.size === 0) {
    return NextResponse.json({ ok: true, url: null })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const caminho = `platform/banner.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('course-thumbnails')
    .upload(caminho, file, { contentType: file.type || 'image/jpeg', upsert: true })

  if (uploadError) {
    return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('course-thumbnails').getPublicUrl(caminho)
  const url = `${urlData.publicUrl}?t=${Date.now()}`

  await prisma.platformConfig.upsert({
    where: { key: 'hero_banner_url' },
    create: { key: 'hero_banner_url', value: url },
    update: { value: url },
  })

  return NextResponse.json({ ok: true, url })
}
