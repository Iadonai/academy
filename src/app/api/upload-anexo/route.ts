import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const moduleId = formData.get('moduleId') as string
  const courseId = formData.get('courseId') as string
  const base = `/admin/cursos/${courseId}/modulos/${moduleId}/aulas`

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (perfil?.role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url))

  const file = formData.get('file') as File
  const lessonId = formData.get('lessonId') as string
  const name = (formData.get('name') as string) || file?.name || 'Arquivo'

  if (!file || file.size === 0) {
    return NextResponse.redirect(new URL(`${base}?erro=arquivo-vazio`, request.url))
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop()
  const caminho = `${lessonId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('lesson-attachments')
    .upload(caminho, file, { contentType: file.type || 'application/octet-stream' })

  if (uploadError) {
    return NextResponse.redirect(
      new URL(`${base}?erro=upload-falhou&detalhe=${encodeURIComponent(uploadError.message)}`, request.url)
    )
  }

  const { data: urlData } = supabase.storage.from('lesson-attachments').getPublicUrl(caminho)

  const tipo = file.type === 'application/pdf' ? 'PDF' : file.type.startsWith('image/') ? 'IMAGE' : 'FILE'

  try {
    await prisma.lessonAttachment.create({
      data: { lessonId, name, type: tipo, url: urlData.publicUrl },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.redirect(
      new URL(`${base}?erro=upload-falhou&detalhe=${encodeURIComponent(msg)}`, request.url)
    )
  }

  return NextResponse.redirect(new URL(base, request.url))
}
