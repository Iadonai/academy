import Link from 'next/link'
import { recuperarSenha } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>
}) {
  const { enviado } = await searchParams

  if (enviado) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mb-3 text-3xl">📧</div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Verifique seu e-mail</h2>
        <p className="mb-6 text-sm text-slate-500">
          Enviamos um link para você redefinir sua senha. Pode levar alguns minutos.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-semibold text-slate-900">Recuperar senha</h2>
      <p className="mb-6 text-sm text-slate-500">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form action={recuperarSenha} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
        </div>
        <Button type="submit" className="w-full">
          Enviar link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Lembrou a senha?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
