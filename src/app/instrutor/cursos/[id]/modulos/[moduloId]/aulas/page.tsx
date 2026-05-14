import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { AnexosAula } from './AnexosAula'

async function adicionarAula(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const moduloId = formData.get('moduloId') as string
  const modulo = await prisma.module.findUnique({ where: { id: moduloId }, select: { courseId: true, course: { select: { instructorId: true } } } })
  if (modulo?.course.instructorId !== user.id) redirect('/instrutor/cursos')

  const ultima = await prisma.lesson.findFirst({ where: { moduleId: moduloId }, orderBy: { order: 'desc' }, select: { order: true } })
  await prisma.lesson.create({
    data: {
      moduleId: moduloId,
      title: formData.get('title') as string,
      youtubeUrl: formData.get('youtubeUrl') as string || '',
      duration: (formData.get('duration') as string) || null,
      order: (ultima?.order ?? 0) + 1,
      isPreview: formData.get('isPreview') === 'true',
    },
  })
  revalidatePath(`/instrutor/cursos/${modulo.courseId}/modulos`)
}

async function editarAula(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const aula = await prisma.lesson.findUnique({
    where: { id },
    select: { module: { select: { courseId: true, course: { select: { instructorId: true } } } } },
  })
  if (aula?.module.course.instructorId !== user.id) redirect('/instrutor/cursos')

  await prisma.lesson.update({
    where: { id },
    data: {
      title: formData.get('title') as string,
      youtubeUrl: formData.get('youtubeUrl') as string || '',
      duration: (formData.get('duration') as string) || null,
      isPreview: formData.get('isPreview') === 'true',
    },
  })
  revalidatePath(`/instrutor/cursos/${aula.module.courseId}/modulos`)
}

async function excluirAula(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const aula = await prisma.lesson.findUnique({
    where: { id },
    select: { module: { select: { courseId: true, course: { select: { instructorId: true } } } } },
  })
  if (aula?.module.course.instructorId !== user.id) redirect('/instrutor/cursos')

  await prisma.lesson.delete({ where: { id } })
  revalidatePath(`/instrutor/cursos/${aula.module.courseId}/modulos`)
}

async function adicionarAnexo(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const aulaId = formData.get('aulaId') as string
  const aula = await prisma.lesson.findUnique({
    where: { id: aulaId },
    select: { module: { select: { courseId: true, course: { select: { instructorId: true } } } } },
  })
  if (aula?.module.course.instructorId !== user.id) redirect('/instrutor/cursos')

  await prisma.lessonAttachment.create({
    data: {
      lessonId: aulaId,
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      type: formData.get('type') as 'PDF' | 'LINK' | 'IMAGE' | 'FILE',
    },
  })
  revalidatePath(`/instrutor/cursos/${aula.module.courseId}/modulos`)
}

async function excluirAnexo(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const anexo = await prisma.lessonAttachment.findUnique({
    where: { id },
    select: { lesson: { select: { module: { select: { courseId: true, course: { select: { instructorId: true } } } } } } },
  })
  if (anexo?.lesson.module.course.instructorId !== user.id) redirect('/instrutor/cursos')

  await prisma.lessonAttachment.delete({ where: { id } })
  revalidatePath(`/instrutor/cursos/${anexo.lesson.module.courseId}/modulos`)
}

export default async function InstrutorAulasPage({
  params,
}: {
  params: Promise<{ id: string; moduloId: string }>
}) {
  const { id, moduloId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const modulo = await prisma.module.findUnique({
    where: { id: moduloId },
    include: {
      course: { select: { id: true, title: true, instructorId: true } },
      lessons: { orderBy: { order: 'asc' }, include: { attachments: { orderBy: { createdAt: 'asc' } } } },
    },
  })

  if (!modulo || modulo.course.instructorId !== user.id || modulo.courseId !== id) notFound()

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', width: '100%',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 4, display: 'block',
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 800 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32 }}>
        <Link href="/instrutor/cursos" style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>← Cursos</Link>
        <span style={{ color: 'rgba(255,255,255,.15)' }}>/</span>
        <Link href={`/instrutor/cursos/${id}/modulos`} style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>{modulo.course.title}</Link>
        <span style={{ color: 'rgba(255,255,255,.15)' }}>/</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{modulo.title}</span>
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Aulas</h1>

      {/* Adicionar aula */}
      <div style={{
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 12, padding: 20, marginBottom: 28,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>Nova aula</div>
        <form action={adicionarAula} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="hidden" name="moduloId" value={modulo.id} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Título</label>
              <input name="title" required placeholder="Ex: Introdução" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Duração (ex: 12:30)</label>
              <input name="duration" placeholder="12:30" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>URL do YouTube</label>
            <input name="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
              <input type="hidden" name="isPreview" value="false" />
              <input type="checkbox" name="isPreview" value="true" style={{ width: 16, height: 16, accentColor: '#7c3aed' }} />
              Aula prévia gratuita (visível sem compra)
            </label>
            <button type="submit" style={{
              background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
              padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Adicionar aula
            </button>
          </div>
        </form>
      </div>

      {/* Lista de aulas */}
      {modulo.lessons.length === 0 ? (
        <div style={{
          border: '2px dashed rgba(255,255,255,.08)', borderRadius: 12,
          padding: '48px 40px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13,
        }}>
          Nenhuma aula ainda. Adicione a primeira acima.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modulo.lessons.map((aula) => (
            <div key={aula.id} style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 10, padding: 16,
            }}>
              <form action={editarAula} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="hidden" name="id" value={aula.id} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Título</label>
                    <input name="title" defaultValue={aula.title} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Duração</label>
                    <input name="duration" defaultValue={aula.duration ?? ''} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>URL do YouTube</label>
                  <input name="youtubeUrl" defaultValue={aula.youtubeUrl} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
                    <input type="hidden" name="isPreview" value="false" />
                    <input type="checkbox" name="isPreview" value="true" defaultChecked={aula.isPreview} style={{ width: 16, height: 16, accentColor: '#7c3aed' }} />
                    Aula prévia gratuita
                    {aula.isPreview && (
                      <span style={{ fontSize: 10, background: 'rgba(91,200,255,.15)', color: '#5bc8ff', border: '1px solid rgba(91,200,255,.25)', borderRadius: 10, padding: '2px 8px' }}>
                        PRÉVIA
                      </span>
                    )}
                  </label>
                  <button type="submit" style={{
                    background: 'rgba(255,255,255,.06)', color: '#fff',
                    border: '1px solid rgba(255,255,255,.1)', borderRadius: 6,
                    padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}>
                    Salvar
                  </button>
                </div>
              </form>

              <AnexosAula
                aulaId={aula.id}
                anexos={aula.attachments}
                onAdd={adicionarAnexo}
                onDelete={excluirAnexo}
              />

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'flex-end' }}>
                <form action={excluirAula}>
                  <input type="hidden" name="id" value={aula.id} />
                  <button type="submit" style={{
                    background: 'rgba(239,68,68,.15)', color: '#f87171',
                    border: '1px solid rgba(239,68,68,.25)', borderRadius: 6,
                    padding: '6px 12px', fontSize: 11, cursor: 'pointer',
                  }}>
                    Excluir aula
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
