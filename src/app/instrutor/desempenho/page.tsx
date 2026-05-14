import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function InstrutorDesempenhoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const cursos = await prisma.course.findMany({
    where: { instructorId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, price: true, revenueShare: true, published: true,
      courseAccesses: {
        select: { createdAt: true },
      },
      orderItems: {
        where: { order: { status: 'PAID' } },
        select: {
          price: true,
          createdAt: true,
          order: { select: { status: true } },
        },
      },
    },
  })

  type CursoStats = {
    id: string
    title: string
    published: boolean
    alunos: number
    alunosMes: number
    receitaTotal: number
    receitaMes: number
  }

  const stats: CursoStats[] = cursos.map((c) => {
    const share = Number(c.revenueShare)
    const alunos = c.courseAccesses.length
    const alunosMes = c.courseAccesses.filter(a => a.createdAt >= inicioMes).length
    const receitaTotal = c.orderItems.reduce((s, i) => s + Number(i.price) * share, 0)
    const receitaMes = c.orderItems
      .filter(i => i.createdAt >= inicioMes)
      .reduce((s, i) => s + Number(i.price) * share, 0)
    return { id: c.id, title: c.title, published: c.published, alunos, alunosMes, receitaTotal, receitaMes }
  })

  const totalAlunos = stats.reduce((s, c) => s + c.alunos, 0)
  const totalReceita = stats.reduce((s, c) => s + c.receitaTotal, 0)
  const receitaMes = stats.reduce((s, c) => s + c.receitaMes, 0)
  const alunosMes = stats.reduce((s, c) => s + c.alunosMes, 0)

  const card = (label: string, value: string, sub?: string) => (
    <div style={{
      background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 12, padding: '20px 24px', flex: 1,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  const fmt = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`

  return (
    <div style={{ padding: '40px 48px', maxWidth: 960 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Desempenho</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
        {card('Receita este mês', fmt(receitaMes), `+${alunosMes} aluno${alunosMes !== 1 ? 's' : ''} este mês`)}
        {card('Receita total', fmt(totalReceita))}
        {card('Total de alunos', String(totalAlunos))}
        {card('Cursos ativos', String(stats.filter(c => c.published).length))}
      </div>

      {stats.length === 0 ? (
        <div style={{
          border: '2px dashed rgba(255,255,255,.1)', borderRadius: 12,
          padding: '60px 40px', textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 14,
        }}>
          Crie seu primeiro curso para ver o desempenho aqui.
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                {['Curso', 'Status', 'Alunos', 'Novos este mês', 'Receita este mês', 'Receita total'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,.4)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < stats.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                  <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 500 }}>{c.title}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      background: c.published ? 'rgba(74,222,128,.12)' : 'rgba(255,255,255,.06)',
                      color: c.published ? '#4ade80' : 'rgba(255,255,255,.35)',
                      border: `1px solid ${c.published ? 'rgba(74,222,128,.25)' : 'rgba(255,255,255,.1)'}`,
                    }}>
                      {c.published ? 'Publicado' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,.7)' }}>{c.alunos}</td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,.7)' }}>+{c.alunosMes}</td>
                  <td style={{ padding: '14px 16px', color: '#4ade80' }}>{fmt(c.receitaMes)}</td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,.7)' }}>{fmt(c.receitaTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
