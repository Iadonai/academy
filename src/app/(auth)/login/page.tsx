import Link from 'next/link'
import { login, loginComGoogle } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

      <form action={loginComGoogle}>
        <Button type="submit" variant="outline" className="w-full">
          Entrar com Google
        </Button>
      </form>

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

  const mensagens: Record<string, string> = {
    'credenciais-invalidas': 'E-mail ou senha incorretos.',
    'google-indisponivel': 'Não foi possível entrar com Google. Tente novamente.',
    'oauth-falhou': 'Falha ao autenticar. Tente novamente.',
  }

  return (
    <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
      {mensagens[erro] ?? 'Ocorreu um erro. Tente novamente.'}
    </div>
  )
}
