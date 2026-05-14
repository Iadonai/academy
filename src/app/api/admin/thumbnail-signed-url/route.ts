import { NextRequest, NextResponse } from 'next/server'
import { verificarAdmin } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await verificarAdmin()
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursoId = searchParams.get('cursoId')
  const ext = searchParams.get('ext')

  if (!cursoId || !ext) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const supabase = await createClient()
  const caminho = `${cursoId}/thumbnail.${ext}`

  const { data, error } = await supabase.storage
    .from('course-thumbnails')
    .createSignedUploadUrl(caminho)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao gerar URL' }, { status: 500 })
  }

  const { data: pub } = supabase.storage.from('course-thumbnails').getPublicUrl(caminho)

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: caminho,
    publicUrl: pub.publicUrl,
  })
}
