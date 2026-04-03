import Link from 'next/link'
import { cadastro } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BotaoGoogle } from '@/components/auth/BotaoGoogle'

export default function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; convite?: string }>
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-semibold text-slate-900">Criar conta</h2>
      <p className="mb-6 text-sm text-slate-500">Comece a aprender hoje mesmo</p>

      <ErroMensagem searchParams={searchParams} />
      <ConviteBanner searchParams={searchParams} />

      <form action={cadastro} className="space-y-4">
        <ConviteInput searchParams={searchParams} />
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" name="nome" type="text" placeholder="Seu nome" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Criar conta
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">ou</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <BotaoGoogle texto="Cadastrar com Google" />

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem conta?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}

async function ConviteBanner({ searchParams }: { searchParams: Promise<{ convite?: string }> }) {
  const { convite } = await searchParams
  if (!convite) return null
  return (
    <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
      🎉 Você foi convidado! Seu acesso será liberado automaticamente ao criar a conta.
    </div>
  )
}

async function ConviteInput({ searchParams }: { searchParams: Promise<{ convite?: string }> }) {
  const { convite } = await searchParams
  if (!convite) return null
  return <input type="hidden" name="convite" value={convite} />
}

async function ErroMensagem({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams
  if (!erro) return null

  const mensagens: Record<string, string> = {
    'email-ja-cadastrado': 'Este e-mail já está cadastrado.',
    'convite-invalido': 'Convite inválido ou já utilizado.',
  }

  return (
    <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
      {mensagens[erro] ?? 'Ocorreu um erro. Tente novamente.'}
    </div>
  )
}
