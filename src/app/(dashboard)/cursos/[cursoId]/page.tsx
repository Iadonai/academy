import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { BotaoCertificado } from './BotaoCertificado'

export default async function CursoPage({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  const curso = await prisma.course.findUnique({
    where: { id: cursoId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              lessonProgresses: {
                where: { userId: user.id },
                select: { completedAt: true },
              },
            },
          },
        },
      },
    },
  })

  if (!curso) notFound()

  // Verificar acesso
  let temAcesso = perfil?.role === 'ADMIN'
  if (!temAcesso) {
    // Curso gratuito (preço = 0)
    if (Number(curso.price) === 0) {
      temAcesso = true
    } else {
      const acesso = await prisma.courseAccess.findFirst({
        where: { userId: user.id, courseId: cursoId },
      })
      const assinatura = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
      })
      temAcesso = !!(acesso || assinatura)
    }
  }

  const totalAulas = curso.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const aulasCompletas = curso.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.lessonProgresses.length > 0).length,
    0
  )
  const progresso = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          ← Início
        </Link>
        {perfil?.role === 'ADMIN' && (
          <>
            <span className="text-slate-300">/</span>
            <Link
              href={`/admin/cursos/${cursoId}/modulos`}
              className="text-sm text-blue-600 hover:underline"
            >
              Editar no admin
            </Link>
          </>
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{curso.title}</h1>
        <p className="text-slate-500">{curso.description}</p>

        {totalAulas > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
              <span>{aulasCompletas} de {totalAulas} aulas concluídas</span>
              <span>{progresso}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
            {progresso === 100 && temAcesso && (
              <BotaoCertificado cursoId={cursoId} />
            )}
          </div>
        )}
      </div>

      {/* Sem acesso — mostra botão de compra */}
      {!temAcesso && (
        <div style={{
          background: 'var(--s2)', border: '1px solid var(--bdr)', borderTop: '2px solid var(--cy)',
          padding: '24px', marginBottom: '24px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: '13px', color: 'var(--cy)', letterSpacing: '.08em', marginBottom: '8px' }}>
            // ACESSO NECESSÁRIO
          </div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '13px', color: 'var(--mt)', marginBottom: '16px' }}>
            Adquira este curso para assistir às aulas.
          </div>
          {curso.kiwifyCheckoutUrl ? (
            <a
              href={curso.kiwifyCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-punk"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              COMPRAR — R$ {Number(curso.price).toFixed(2).replace('.', ',')}
            </a>
          ) : (
            <div style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: 'var(--mt)' }}>
              Entre em contato com o administrador para obter acesso.
            </div>
          )}
        </div>
      )}

      <div className="space-y-4" style={{ opacity: temAcesso ? 1 : 0.4, pointerEvents: temAcesso ? 'auto' : 'none' }}>
        {curso.modules.map((modulo) => (
          <div key={modulo.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">{modulo.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {modulo.lessons.length} aula{modulo.lessons.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {modulo.lessons.map((aula) => {
                const concluida = aula.lessonProgresses.length > 0
                return (
                  <li key={aula.id}>
                    <Link
                      href={`/cursos/${cursoId}/aulas/${aula.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        concluida
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}>
                        {concluida && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm ${concluida ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {aula.title}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
