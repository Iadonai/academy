'use client'

import { useState, useMemo } from 'react'

interface Vaga {
  id: string
  title: string
  company: string
  location: string
  url: string
  date: string
  type: string
  source: string
  logo: string | null
}

const TIPO_LABEL: Record<string, string> = {
  remote: 'REMOTO',
  hybrid: 'HÍBRIDO',
  on_site: 'PRESENCIAL',
  presential: 'PRESENCIAL',
  fulltime: 'CLT',
  contractor: 'PJ',
  parttime: 'PART-TIME',
  intern: 'ESTÁGIO',
}

const SOURCE_COR: Record<string, string> = {
  JSearch: 'var(--cy)',
  Programathor: '#22c55e',
}

function CardVaga({ vaga }: { vaga: Vaga }) {
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderTop: `3px solid ${SOURCE_COR[vaga.source] ?? 'var(--cy)'}`, display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', background: 'var(--s3)', border: '1px solid var(--bdr)', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {vaga.logo
            ? <img src={vaga.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontFamily: 'var(--font-h)', fontSize: '14px', color: 'var(--cy)', opacity: .5 }}>{vaga.company?.[0]?.toUpperCase() ?? '?'}</span>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vaga.company || '—'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: 'var(--mt)' }}>📍 {vaga.location}</span>
            <span style={{ fontFamily: 'var(--font-m)', fontSize: '8px', padding: '1px 5px', color: SOURCE_COR[vaga.source] ?? 'var(--cy)', border: `1px solid ${SOURCE_COR[vaga.source] ?? 'var(--cy)'}`, opacity: .8 }}>{vaga.source.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', lineHeight: 1.35, color: 'var(--tx)' }}>{vaga.title}</div>

      {vaga.type && TIPO_LABEL[vaga.type] && (
        <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 8px', border: '1px solid rgba(91,200,255,.25)', color: 'var(--cy)', letterSpacing: '.06em', alignSelf: 'flex-start' }}>
          {TIPO_LABEL[vaga.type]}
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--bdr)' }}>
        {vaga.date ? (
          <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }}>
            {new Date(vaga.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </span>
        ) : <span />}
        <a href={vaga.url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 14px', fontFamily: 'var(--font-m)', fontSize: '10px', letterSpacing: '.08em', color: 'var(--cy)', border: '1px solid rgba(91,200,255,.4)', background: 'rgba(91,200,255,.06)', textDecoration: 'none' }}>
          VER VAGA →
        </a>
      </div>
    </div>
  )
}

function Filtros({
  keyword, setKeyword,
  estado, setEstado,
  tipo, setTipo,
  estados, tipos,
  total,
}: {
  keyword: string; setKeyword: (v: string) => void
  estado: string; setEstado: (v: string) => void
  tipo: string; setTipo: (v: string) => void
  estados: string[]; tipos: string[]
  total: number
}) {
  const inputStyle = {
    background: 'var(--s2)',
    border: '1px solid var(--bdr)',
    color: 'var(--tx)',
    fontFamily: 'var(--font-m)',
    fontSize: '11px',
    padding: '6px 10px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', marginBottom: '16px', padding: '12px 14px', background: 'var(--s2)', border: '1px solid var(--bdr)' }}>
      <div style={{ flex: '1 1 220px' }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', letterSpacing: '.08em', marginBottom: '4px' }}>PALAVRA-CHAVE</div>
        <input
          type="text"
          placeholder="ex: python, power bi, dados..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ flex: '1 1 160px' }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', letterSpacing: '.08em', marginBottom: '4px' }}>ESTADO</div>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} style={inputStyle}>
          <option value="">Todos</option>
          {estados.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div style={{ flex: '1 1 140px' }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', letterSpacing: '.08em', marginBottom: '4px' }}>MODALIDADE</div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
          <option value="">Todas</option>
          {tipos.map((t) => <option key={t} value={t}>{TIPO_LABEL[t] ?? t.toUpperCase()}</option>)}
        </select>
      </div>
      <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', whiteSpace: 'nowrap', paddingBottom: '6px' }}>
        {total} resultado{total !== 1 ? 's' : ''}
      </div>
      {(keyword || estado || tipo) && (
        <button
          onClick={() => { setKeyword(''); setEstado(''); setTipo('') }}
          style={{ background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--mt)', fontFamily: 'var(--font-m)', fontSize: '10px', padding: '6px 12px', cursor: 'pointer', letterSpacing: '.06em' }}
        >
          LIMPAR ×
        </button>
      )}
    </div>
  )
}

function SecaoFiltrada({ vagas, label, titulo, subtitulo, cor }: {
  vagas: Vaga[]
  label: string
  titulo: string
  subtitulo: string
  cor: string
}) {
  const [keyword, setKeyword] = useState('')
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')

  const estados = useMemo(() => {
    const set = new Set<string>()
    for (const v of vagas) {
      const partes = v.location.split(',')
      if (partes.length > 1) set.add(partes[partes.length - 1].trim())
    }
    return [...set].sort()
  }, [vagas])

  const tipos = useMemo(() => {
    const set = new Set<string>()
    for (const v of vagas) if (v.type && TIPO_LABEL[v.type]) set.add(v.type)
    return [...set]
  }, [vagas])

  const filtradas = useMemo(() => {
    return vagas.filter((v) => {
      const kw = keyword.toLowerCase()
      if (kw && !v.title.toLowerCase().includes(kw) && !v.company.toLowerCase().includes(kw)) return false
      if (estado && !v.location.includes(estado)) return false
      if (tipo && v.type !== tipo) return false
      return true
    })
  }, [vagas, keyword, estado, tipo])

  return (
    <div>
      <div className="hero-banner" style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: cor, background: `color-mix(in srgb, ${cor} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${cor} 25%, transparent)`, padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>{label}</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '16px', fontWeight: 900, letterSpacing: '.06em' }}>{titulo}</div>
          <div style={{ fontSize: '12px', color: 'var(--mt)', marginTop: '4px' }}>{subtitulo}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '24px' }}>{vagas.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// VAGAS</div>
        </div>
      </div>

      <Filtros
        keyword={keyword} setKeyword={setKeyword}
        estado={estado} setEstado={setEstado}
        tipo={tipo} setTipo={setTipo}
        estados={estados} tipos={tipos}
        total={filtradas.length}
      />

      {filtradas.length === 0 ? (
        <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>NENHUMA VAGA ENCONTRADA</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {filtradas.map((vaga) => <CardVaga key={vaga.id} vaga={vaga} />)}
        </div>
      )}
    </div>
  )
}

export function VagasFiltro({ profissional, aprendiz }: { profissional: Vaga[]; aprendiz: Vaga[] }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '36px' }}>
      <SecaoFiltrada
        vagas={profissional}
        label="// MERCADO BR"
        titulo="VAGAS PROFISSIONAIS"
        subtitulo="Python · Power BI · Dados · IA · N8N · RPA · Analytics"
        cor="var(--cy)"
      />

      <div style={{ borderTop: '1px solid var(--bdr)', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg)', padding: '0 12px', fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', letterSpacing: '.1em' }}>
          ── PRÓXIMO NÍVEL ──
        </span>
      </div>

      <SecaoFiltrada
        vagas={aprendiz}
        label="// PRIMEIRO PASSO"
        titulo="JOVEM APRENDIZ & ESTÁGIO"
        subtitulo="Dados · Power BI · Python · N8N · Tecnologia · Trainee"
        cor="#22c55e"
      />
    </div>
  )
}
