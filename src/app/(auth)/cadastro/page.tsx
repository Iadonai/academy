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
    <div>
      <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>Criar conta</h2>
      <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px', marginBottom: '20px' }}>Comece a aprender hoje mesmo</p>

      <ErroMensagem searchParams={searchParams} />
      <ConviteBanner searchParams={searchParams} />

      <form action={cadastro} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <ConviteInput searchParams={searchParams} />
        <div>
          <Label htmlFor="nome" style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px' }}>Nome completo</Label>
          <Input id="nome" name="nome" type="text" placeholder="Seu nome" required
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', marginTop: '4px' }} />
        </div>
        <div>
          <Label htmlFor="email" style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px' }}>E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="seu@email.com" required
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', marginTop: '4px' }} />
        </div>
        <div>
          <Label htmlFor="password" style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px' }}>Senha</Label>
          <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" minLength={6} required
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', marginTop: '4px' }} />
        </div>
        <Button type="submit" className="w-full">Criar conta</Button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.1)' }} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>ou</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.1)' }} />
      </div>

      <BotaoGoogle texto="Cadastrar com Google" />

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,.4)', marginTop: '20px' }}>
        Já tem conta?{' '}
        <Link href="/login" style={{ color: 'rgba(91,200,255,.8)', fontWeight: 500 }}>
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
    <div style={{ background: 'rgba(91,200,255,.1)', border: '1px solid rgba(91,200,255,.2)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'rgba(91,200,255,.9)', marginBottom: '16px' }}>
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
    <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#fff', marginBottom: '16px' }}>
      {mensagens[erro] ?? 'Ocorreu um erro. Tente novamente.'}
    </div>
  )
}
