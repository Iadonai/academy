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
    <div>
      <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>Entrar</h2>
      <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px', marginBottom: '20px' }}>Acesse sua conta para continuar</p>

      <ErroMensagem searchParams={searchParams} />

      <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <Label htmlFor="email" style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px' }}>E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="seu@email.com" required
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', marginTop: '4px' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Label htmlFor="password" style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px' }}>Senha</Label>
            <Link href="/recuperar-senha" style={{ fontSize: '11px', color: 'rgba(91,200,255,.8)' }}>
              Esqueceu a senha?
            </Link>
          </div>
          <Input id="password" name="password" type="password" placeholder="••••••••" required
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', marginTop: '4px' }} />
        </div>
        <Button type="submit" className="w-full">Entrar</Button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.1)' }} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>ou</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.1)' }} />
      </div>

      <BotaoGoogle />

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,.4)', marginTop: '20px' }}>
        Ainda não tem conta?{' '}
        <Link href="/cadastro" style={{ color: 'rgba(91,200,255,.8)', fontWeight: 500 }}>
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
    'credenciais-invalidas': { texto: 'E-mail ou senha incorretos.', cor: 'rgba(239,68,68,.15)' },
    'google-indisponivel': { texto: 'Não foi possível entrar com Google. Tente novamente.', cor: 'rgba(239,68,68,.15)' },
    'oauth-falhou': { texto: 'Falha ao autenticar. Tente novamente.', cor: 'rgba(239,68,68,.15)' },
    'email-nao-confirmado': { texto: '📧 Confirme seu email antes de entrar. Verifique sua caixa de entrada.', cor: 'rgba(234,179,8,.15)' },
  }

  const msg = mensagens[erro ?? ''] ?? { texto: 'Ocorreu um erro. Tente novamente.', cor: 'rgba(239,68,68,.15)' }

  return (
    <div style={{ background: msg.cor, border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#fff', marginBottom: '16px' }}>
      {msg.texto}
    </div>
  )
}
