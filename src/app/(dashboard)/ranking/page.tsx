import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const MEDALHAS = ['🥇', '🥈', '🥉']
const CORES_POSICAO = ['var(--mg)', '#C0C0C0', '#CD7F32']

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { aba } = await searchParams
  const abaAtiva = aba === 'membros' ? 'membros' : 'ranking'

  const [ranking, meusStats] = await Promise.all([
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { xpTotal: 'desc' },
      take: 50,
      select: { id: true, name: true, avatarUrl: true, xpTotal: true, level: true, createdAt: true, role: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { xpTotal: true, level: true },
    }),
  ])

  const minhaPosicao = ranking.findIndex((u) => u.id === user.id) + 1

  return (
    <div style={{ padding: '16px 20px', maxWidth: '700px' }}>
      {/* Hero */}
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(155,111,255,.1)', border: '1px solid rgba(155,111,255,.3)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>
            // COMUNIDADE
          </div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '20px', fontWeight: 900, letterSpacing: '.06em', marginBottom: '6px' }}>
            HALL DA FAMA
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mt)' }}>{ranking.length} {ranking.length === 1 ? 'membro' : 'membros'} na plataforma</div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
            <div>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>{meusStats?.xpTotal ?? 0}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// MEU XP</div>
            </div>
            <div>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>{meusStats?.level ?? 1}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// NÍVEL</div>
            </div>
            <div>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>#{minhaPosicao || '—'}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// POSIÇÃO</div>
            </div>
          </div>
        </div>
        <div className="hero-hex">🏆</div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        <Link
          href="/ranking"
          className={`punk-tag${abaAtiva === 'ranking' ? ' active' : ''}`}
        >
          RANKING
        </Link>
        <Link
          href="/ranking?aba=membros"
          className={`punk-tag${abaAtiva === 'membros' ? ' active' : ''}`}
        >
          MEMBROS
        </Link>
      </div>

      {/* ABA RANKING */}
      {abaAtiva === 'ranking' && (
        <>
          <div className="punk-card" style={{ marginBottom: '16px' }}>
            <div style={{ borderTop: '2px solid var(--cy)' }} />
            <div style={{ padding: '6px 0' }}>
              {ranking.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>
                    NENHUM ALUNO NO RANKING AINDA.
                  </p>
                </div>
              ) : ranking.map((u, i) => {
                const posicao = i + 1
                const ehEu = u.id === user.id
                const iniciais = u.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                const corPosicao = CORES_POSICAO[i] ?? 'var(--mt)'

                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--bdr)',
                      background: ehEu ? 'rgba(155,111,255,.06)' : 'transparent',
                      borderLeft: ehEu ? '3px solid var(--cy)' : '3px solid transparent',
                    }}
                  >
                    {/* Posição */}
                    <div style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
                      {posicao <= 3 ? (
                        <span style={{ fontSize: '18px' }}>{MEDALHAS[i]}</span>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-h)', fontSize: '13px', color: 'var(--mt)' }}>{posicao}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      border: `1px solid ${ehEu ? 'var(--cy)' : 'var(--bdr)'}`,
                      overflow: 'hidden', background: 'var(--b1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-h)', fontSize: '12px', color: 'var(--mt)' }}>{iniciais}</span>
                      )}
                    </div>

                    {/* Nome + nível */}
                    <div style={{ flex: 1 }}>
                      <div className={ehEu ? 'silver' : ''} style={{ fontFamily: 'var(--font-b)', fontSize: '13px', fontWeight: 600, letterSpacing: '.04em', color: ehEu ? undefined : 'var(--tx)' }}>
                        {u.name.toUpperCase()}
                        {ehEu && <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', marginLeft: '8px', letterSpacing: '.08em' }}>VOCÊ</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.04em' }}>
                        NÍVEL {u.level}
                      </div>
                    </div>

                    {/* XP */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-h)', fontSize: '16px', color: posicao <= 3 ? corPosicao : 'var(--cy)' }}>
                        {u.xpTotal}
                      </div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', letterSpacing: '.06em' }}>XP</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Como ganhar XP */}
          <div style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderTop: '2px solid var(--cy)', padding: '14px 16px' }}>
            <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '12px' }}>// COMO GANHAR XP</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { acao: 'Concluir uma aula', xp: '+10 XP' },
                { acao: 'Comentar em aula', xp: '+5 XP' },
                { acao: 'Publicar na comunidade', xp: '+15 XP' },
                { acao: 'Responder post', xp: '+5 XP' },
                { acao: 'Concluir módulo completo', xp: '+30 XP' },
                { acao: 'Concluir curso completo', xp: '+100 XP' },
              ].map(({ acao, xp }) => (
                <div key={acao} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(42,26,80,.6)' }}>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)' }}>{acao}</span>
                  <span style={{ fontFamily: 'var(--font-h)', fontSize: '13px', color: 'var(--mg)', letterSpacing: '.04em' }}>{xp}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ABA MEMBROS */}
      {abaAtiva === 'membros' && (
        <div className="punk-card">
          <div style={{ borderTop: '2px solid var(--cy)' }} />
          <div style={{ padding: '6px 0' }}>
            {ranking.map((u) => {
              const ehEu = u.id === user.id
              const iniciais = u.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
              const desde = new Date(u.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })

              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--bdr)',
                    background: ehEu ? 'rgba(155,111,255,.06)' : 'transparent',
                    borderLeft: ehEu ? '3px solid var(--cy)' : '3px solid transparent',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    border: `1px solid ${ehEu ? 'var(--cy)' : 'var(--bdr)'}`,
                    overflow: 'hidden', background: 'var(--b1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-h)', fontSize: '13px', color: 'var(--mt)' }}>{iniciais}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div className={ehEu ? 'silver' : ''} style={{ fontFamily: 'var(--font-b)', fontSize: '13px', fontWeight: 600, letterSpacing: '.04em', color: ehEu ? undefined : 'var(--tx)' }}>
                      {u.name.toUpperCase()}
                      {ehEu && <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', marginLeft: '8px', letterSpacing: '.08em' }}>VOCÊ</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.04em', marginTop: '2px' }}>
                      Membro desde {desde}
                    </div>
                  </div>

                  {/* Nível + XP */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 8px', border: '1px solid rgba(155,111,255,.3)', color: 'var(--cy)', display: 'inline-block', letterSpacing: '.06em', marginBottom: '4px' }}>
                      NÍV. {u.level}
                    </div>
                    <div style={{ fontFamily: 'var(--font-h)', fontSize: '13px', color: 'var(--cy)' }}>
                      {u.xpTotal} XP
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
