import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { editarPerfil, trocarSenha } from '@/app/actions/perfil'
import { RadarHabilidades } from '@/components/perfil/RadarHabilidades'

// Mapeia palavras-chave do título do curso para habilidades
const SKILL_MAP: { skill: string; cor: string; keywords: string[] }[] = [
  { skill: 'Python', cor: '#3b82f6', keywords: ['python'] },
  { skill: 'Power BI', cor: '#f59e0b', keywords: ['power bi', 'powerbi', 'bi', 'dashboard'] },
  { skill: 'Dados', cor: '#22c55e', keywords: ['dados', 'data', 'pandas', 'excel', 'analytics', 'analise'] },
  { skill: 'IA', cor: '#a855f7', keywords: ['ia', 'inteligencia artificial', 'machine learning', 'chatgpt', 'llm'] },
  { skill: 'Automação', cor: 'var(--cy)', keywords: ['automacao', 'automação', 'n8n', 'rpa', 'zapier', 'make'] },
  { skill: 'Negócios', cor: '#ef4444', keywords: ['negocio', 'negócio', 'gestao', 'gestão', 'marketing', 'vendas'] },
]

export default async function PerfilPage({ searchParams }: { searchParams: Promise<{ salvo?: string; senha?: string; erro?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [perfil, totalPosts, progresses, cursosConcluidosRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, avatarUrl: true, xpTotal: true, level: true, createdAt: true },
    }),
    prisma.post.count({ where: { userId: user.id } }),
    prisma.lessonProgress.count({ where: { userId: user.id } }),
    // Busca cursos com progresso 100%
    prisma.course.findMany({
      where: { published: true },
      select: {
        title: true,
        modules: {
          select: {
            lessons: {
              select: {
                id: true,
                lessonProgresses: { where: { userId: user.id }, select: { lessonId: true } },
              },
            },
          },
        },
      },
    }),
  ])

  if (!perfil) redirect('/login')

  // Calcula habilidades com base nos cursos com algum progresso
  const habilidades = SKILL_MAP.map((s) => {
    let pontos = 0
    let total = 0
    for (const curso of cursosConcluidosRaw) {
      const titulo = curso.title.toLowerCase()
      if (!s.keywords.some((k) => titulo.includes(k))) continue
      const todasAulas = curso.modules.flatMap((m) => m.lessons)
      const concluidas = todasAulas.filter((l) => l.lessonProgresses.length > 0).length
      if (todasAulas.length > 0) {
        pontos += concluidas / todasAulas.length
        total += 1
      }
    }
    const valor = total > 0 ? Math.round((pontos / total) * 100) : 0
    return { nome: s.skill, valor, cor: s.cor }
  }).filter((h) => h.valor > 0)

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
        <div className="hero-stats">
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

      {/* Radar de habilidades */}
      {habilidades.length >= 3 && (
        <div className="punk-card" style={{ padding: '18px', marginBottom: '16px' }}>
          <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '20px' }}>// RADAR DE HABILIDADES</div>
          <RadarHabilidades habilidades={habilidades} />
        </div>
      )}

      {/* Formulário de edição */}
      <div className="punk-card" style={{ padding: '18px', marginBottom: '16px' }}>
        <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '16px' }}>// EDITAR PERFIL</div>

        {params.salvo && (
          <p style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: '#22c55e', marginBottom: '12px', letterSpacing: '.04em' }}>
            ✓ Perfil atualizado com sucesso.
          </p>
        )}

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

      {/* Trocar senha */}
      <div className="punk-card" style={{ padding: '18px' }}>
        <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '16px' }}>// TROCAR SENHA</div>

        {params.senha === 'alterada' && (
          <p style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: '#22c55e', marginBottom: '12px', letterSpacing: '.04em' }}>
            ✓ Senha alterada com sucesso.
          </p>
        )}
        {params.erro === 'senhas-diferentes' && (
          <p style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: '#ef4444', marginBottom: '12px', letterSpacing: '.04em' }}>
            As senhas não coincidem.
          </p>
        )}
        {params.erro === 'senha-curta' && (
          <p style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: '#ef4444', marginBottom: '12px', letterSpacing: '.04em' }}>
            A senha deve ter pelo menos 6 caracteres.
          </p>
        )}
        {params.erro === 'senha-falhou' && (
          <p style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: '#ef4444', marginBottom: '12px', letterSpacing: '.04em' }}>
            Não foi possível alterar a senha. Tente novamente.
          </p>
        )}

        <form action={trocarSenha} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', letterSpacing: '.08em', display: 'block', marginBottom: '6px' }}>
              NOVA SENHA
            </label>
            <input
              name="nova_senha"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="punk-textarea"
              style={{ border: '1px solid var(--bdr)', borderBottom: '1px solid var(--cy)', padding: '10px 12px', fontSize: '13px', width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', letterSpacing: '.08em', display: 'block', marginBottom: '6px' }}>
              CONFIRMAR NOVA SENHA
            </label>
            <input
              name="confirmar_senha"
              type="password"
              required
              minLength={6}
              placeholder="Repita a nova senha"
              className="punk-textarea"
              style={{ border: '1px solid var(--bdr)', borderBottom: '1px solid var(--cy)', padding: '10px 12px', fontSize: '13px', width: '100%' }}
            />
          </div>

          <button type="submit" className="btn-punk" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
            ALTERAR SENHA
          </button>
        </form>
      </div>
    </div>
  )
}
