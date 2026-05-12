import { verificarAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { salvarConfig } from '@/app/actions/admin'

export default async function ConfiguracoesPage() {
  await verificarAdmin()

  const configs = await prisma.platformConfig.findMany({
    where: { key: { in: ['kiwify_subscription_product_id', 'kiwify_webhook_token', 'hero_banner_url', 'hero_banner_link'] } },
  })

  const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]))

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>

      {/* Banner do Dashboard */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Banner do Dashboard</h2>
        <form action={salvarConfig} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">URL da imagem do banner</label>
            <input
              name="hero_banner_url"
              defaultValue={configMap['hero_banner_url'] ?? ''}
              placeholder="https://exemplo.com/banner.jpg"
              className="flex w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-slate-400">Imagem exibida no banner lateral do dashboard. Proporção recomendada: 4:1 ou 16:5.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Link ao clicar no banner</label>
            <input
              name="hero_banner_link"
              defaultValue={configMap['hero_banner_link'] ?? ''}
              placeholder="https://exemplo.com/oferta"
              className="flex w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-slate-400">Deixe vazio para o banner não ser clicável.</p>
          </div>
          {configMap['hero_banner_url'] && (
            <div className="rounded-md overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={configMap['hero_banner_url']} alt="Preview banner" className="w-full h-24 object-cover" />
            </div>
          )}
          <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md">
            Salvar banner
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Integração Kiwify</h2>

        <form action={salvarConfig} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              ID do Produto de Assinatura
            </label>
            <input
              name="kiwify_subscription_product_id"
              defaultValue={configMap['kiwify_subscription_product_id'] ?? ''}
              placeholder="Ex: prod_abc123"
              className="flex w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-slate-400">
              O produto da Kiwify que dá acesso à assinatura (comunidade + todos os cursos).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              URL do Webhook
            </label>
            <div className="flex rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 font-mono">
              {process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/kiwify?token=SEU_TOKEN
            </div>
            <p className="text-xs text-slate-400">
              Cole esta URL na Kiwify → Webhooks → URL do Webhook. Adicione a variável KIWIFY_WEBHOOK_TOKEN na Vercel.
            </p>
          </div>

          <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md">
            Salvar
          </button>
        </form>
      </div>
    </div>
  )
}
