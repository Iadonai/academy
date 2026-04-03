import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VagasFiltro } from './VagasFiltro'

export const revalidate = 604800 // 1 semana

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

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? ''

const TERMOS_PRO = [
  'python brasil',
  'dados brasil',
  'automacao brasil',
  'power bi brasil',
  'machine learning brasil',
  'inteligencia artificial brasil',
  'n8n brasil',
  'rpa brasil',
  'analytics brasil',
]

const TERMOS_APRENDIZ = [
  'jovem aprendiz dados brasil',
  'jovem aprendiz tecnologia brasil',
  'jovem aprendiz python brasil',
  'estagio dados brasil',
  'estagio power bi brasil',
  'estagio tecnologia brasil',
  'estagio python brasil',
  'estagio n8n brasil',
  'trainee dados brasil',
]

async function buscarJSearch(termos: string[]): Promise<Vaga[]> {
  try {
    const resultados = await Promise.allSettled(
      termos.map((termo) =>
        fetch(
          `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(termo)}&page=1&num_pages=1&country=br&date_posted=all`,
          {
            headers: {
              'x-rapidapi-host': 'jsearch.p.rapidapi.com',
              'x-rapidapi-key': RAPIDAPI_KEY,
              'Content-Type': 'application/json',
            },
            next: { revalidate: 604800 },
          }
        ).then((r) => r.json())
      )
    )

    const vistos = new Set<string>()
    const vagas: Vaga[] = []

    for (const r of resultados) {
      if (r.status !== 'fulfilled') continue
      const jobs: Record<string, unknown>[] = r.value?.data ?? []
      for (const j of jobs) {
        const id = j.job_id as string
        if (!id || vistos.has(id)) continue
        vistos.add(id)

        const cidade = j.job_city as string | null
        const estado = j.job_state as string | null
        const remoto = j.job_is_remote as boolean
        const location = cidade
          ? `${cidade}${estado ? `, ${estado}` : ''}`
          : remoto ? 'Remoto' : 'Brasil'

        const empType = (j.job_employment_type as string | null)?.toLowerCase() ?? ''
        const type = remoto ? 'remote' : empType

        vagas.push({
          id: `js-${id}`,
          title: (j.job_title as string) ?? '',
          company: (j.employer_name as string) ?? '',
          location,
          url: (j.job_apply_link as string) ?? (j.job_google_link as string) ?? '',
          date: (j.job_posted_at_datetime_utc as string) ?? '',
          type,
          source: 'JSearch',
          logo: (j.employer_logo as string | null) ?? null,
        })
      }
    }

    return vagas
  } catch {
    return []
  }
}

async function buscarProgramathor(): Promise<Vaga[]> {
  try {
    const res = await fetch('https://programathor.com.br/feed', { next: { revalidate: 604800 } })
    if (!res.ok) return []
    const xml = await res.text()
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
    const KEYWORDS = ['automação', 'dados', 'python', 'power bi', 'rpa', 'machine learning', 'data', 'analytics', 'n8n', 'bi', 'inteligência']

    return items.slice(0, 50).map((item, i) => {
      const get = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
        return m ? m[1].trim().replace(/<[^>]+>/g, '') : ''
      }
      return {
        id: `pt-${i}`,
        title: get('title'),
        company: get('author') || '',
        location: 'Brasil',
        url: get('link') || get('guid'),
        date: get('pubDate'),
        type: '',
        source: 'Programathor',
        logo: null,
      }
    }).filter((v) => {
      if (!v.title || !v.url) return false
      return KEYWORDS.some((k) => v.title.toLowerCase().includes(k))
    })
  } catch {
    return []
  }
}

export default async function VagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [vagasPro, vagasAprendiz, programathor] = await Promise.all([
    buscarJSearch(TERMOS_PRO),
    buscarJSearch(TERMOS_APRENDIZ),
    buscarProgramathor(),
  ])

  const profissional = [...vagasPro, ...programathor]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const aprendiz = vagasAprendiz
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return <VagasFiltro profissional={profissional} aprendiz={aprendiz} />
}
