import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BotaoGoogle } from '@/components/auth/BotaoGoogle'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-semibold text-slate-900">Entrar</h2>
      <p className="mb-6 text-sm text-slate-500">Acesse sua conta para continuar</p>

      <ErroMensagem searchParams={searchParams} />

      <form action={login} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/recuperar-senha" className="text-xs text-primary hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">ou</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <BotaoGoogle />

      <p className="mt-6 text-center text-sm text-slate-500">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}

async function ErroMensagem({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams
  if (!erro) return null

  const mensagens: Record<string, { texto: string; cor: string }> = {
    'credenciais-invalidas': { texto: 'E-mail ou senha incorretos.', cor: 'bg-red-50 text-red-600' },
    'google-indisponivel': { texto: 'Não foi possível entrar com Google. Tente novamente.', cor: 'bg-red-50 text-red-600' },
    'oauth-falhou': { texto: 'Falha ao autenticar. Tente novamente.', cor: 'bg-red-50 text-red-600' },
    'email-nao-confirmado': { texto: '📧 Confirme seu email antes de entrar. Verifique sua caixa de entrada.', cor: 'bg-yellow-50 text-yellow-700' },
  }

  const msg = mensagens[erro ?? ''] ?? { texto: 'Ocorreu um erro. Tente novamente.', cor: 'bg-red-50 text-red-600' }

  return (
    <div className={`mb-4 rounded-md px-4 py-3 text-sm ${msg.cor}`}>
      {msg.texto}
    </div>
  )
}
