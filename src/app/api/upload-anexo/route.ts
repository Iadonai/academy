import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (perfil?.role !== 'ADMIN') return NextResponse.json({ erro: 'Não autorizado' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const lessonId = formData.get('lessonId') as string
  const name = (formData.get('name') as string) || file?.name || 'Arquivo'

  if (!file || file.size === 0) {
    return NextResponse.json({ erro: 'Arquivo vazio' }, { status: 400 })
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop()
  const caminho = `${lessonId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('lesson-attachments')
    .upload(caminho, file, { contentType: file.type || 'application/octet-stream' })

  if (uploadError) {
    return NextResponse.json({ erro: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('lesson-attachments').getPublicUrl(caminho)

  const tipo = file.type === 'application/pdf'
    ? 'PDF'
    : file.type.startsWith('image/')
    ? 'IMAGE'
    : 'FILE'

  const anexo = await prisma.lessonAttachment.create({
    data: { lessonId, name, type: tipo, url: urlData.publicUrl },
  })

  return NextResponse.json({ ok: true, anexo })
}
