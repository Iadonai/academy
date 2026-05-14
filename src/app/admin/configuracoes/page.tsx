import { verificarAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { salvarConfig } from '@/app/actions/admin'
import { BannerUpload } from '@/components/admin/BannerUpload'

export default async function ConfiguracoesPage() {
  await verificarAdmin()

  const configs = await prisma.platformConfig.findMany({
    where: { key: { in: ['asaas_subscription_price', 'hero_banner_url', 'hero_banner_link'] } },
  })

  const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]))

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>

      {/* Banner do Dashboard */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Banner do Dashboard</h2>
        <BannerUpload
          bannerAtual={configMap['hero_banner_url'] ?? null}
          linkAtual={configMap['hero_banner_link'] ?? null}
        />
      </div>

      {/* Integração Asaas */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Integração Asaas</h2>

        <form action={salvarConfig} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Valor do Acesso Completo (R$)
            </label>
            <input
              name="asaas_subscription_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={configMap['asaas_subscription_price'] ?? '97.00'}
              placeholder="Ex: 97.00"
              className="flex w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-slate-400">
              Preço do botão "Assinar agora" no dashboard — libera todos os cursos com pagamento único.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              URL do Webhook Asaas
            </label>
            <div className="flex rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 font-mono select-all">
              {process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/asaas
            </div>
            <p className="text-xs text-slate-400">
              Configure esta URL no Asaas → Configurações → Webhooks. Defina também a variável ASAAS_WEBHOOK_TOKEN e ASAAS_API_KEY na Vercel.
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
