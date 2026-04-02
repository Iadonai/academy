import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { editarPerfil } from '@/app/actions/perfil'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [perfil, totalPosts, totalRespostas, progresses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, avatarUrl: true, xpTotal: true, level: true, createdAt: true },
    }),
    prisma.post.count({ where: { userId: user.id } }),
    prisma.postReply.count({ where: { userId: user.id } }),
    prisma.lessonProgress.count({ where: { userId: user.id } }),
  ])

  if (!perfil) redirect('/login')

  const iniciais = perfil.name
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  const xpParaProximoNivel = perfil.level * 100
  const xpNivelAtual = (perfil.level - 1) * 100
  const xpNoNivel = perfil.xpTotal - xpNivelAtual
  const pct = Math.min(Math.round((xpNoNivel / xpParaProximoNivel) * 100), 100)

  return (
    <div style={{ padding: '16px 20px', maxWidth: '680px' }}>

      {/* Hero do perfil */}
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Avatar */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            border: '2px solid var(--cy)', boxShadow: '0 0 16px rgba(155,111,255,.35)',
            overflow: 'hidden', flexShrink: 0, background: 'var(--b1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {perfil.avatarUrl ? (
              <img src={perfil.avatarUrl} alt={perfil.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>{iniciais}</span>
            )}
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.12em', marginBottom: '4px' }}>// PERFIL</div>
            <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '20px', fontWeight: 900, letterSpacing: '.06em' }}>
              {perfil.name.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)', marginTop: '2px' }}>
              {perfil.email}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
          {[
            { v: perfil.xpTotal, l: '// XP TOTAL' },
            { v: perfil.level, l: '// NÍVEL' },
            { v: totalPosts, l: '// POSTS' },
            { v: progresses, l: '// AULAS' },
          ].map(({ v, l }) => (
            <div key={l}>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de XP */}
      <div className="punk-card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.1em' }}>// PROGRESSO DE NÍVEL</span>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--cy)' }}>{pct}%</span>
        </div>
        <div style={{ height: '4px', background: 'var(--s3)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--cy), var(--mg))', transition: 'width .4s' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', marginTop: '6px', letterSpacing: '.04em' }}>
          {xpNoNivel} / {xpParaProximoNivel} XP para o nível {perfil.level + 1}
        </div>
      </div>

      {/* Formulário de edição */}
      <div className="punk-card" style={{ padding: '18px' }}>
        <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '16px' }}>// EDITAR PERFIL</div>

        <form action={editarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Foto */}
          <div>
            <label style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', letterSpacing: '.08em', display: 'block', marginBottom: '6px' }}>
              FOTO DE PERFIL
            </label>
            <input
              name="avatar"
              type="file"
              accept="image/*"
              style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: 'var(--mt)', width: '100%' }}
            />
            <p style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', marginTop: '4px', letterSpacing: '.03em' }}>
              JPG ou PNG. Recomendado: 200×200px.
            </p>
          </div>

          {/* Nome */}
          <div>
            <label style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', letterSpacing: '.08em', display: 'block', marginBottom: '6px' }}>
              NOME COMPLETO
            </label>
            <input
              name="name"
              type="text"
              defaultValue={perfil.name}
              required
              className="punk-textarea"
              style={{ border: '1px solid var(--bdr)', borderBottom: '1px solid var(--cy)', padding: '10px 12px', fontSize: '13px', width: '100%' }}
            />
          </div>

          <button type="submit" className="btn-punk" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
            SALVAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  )
}
