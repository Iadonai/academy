import Link from 'next/link'
import { verificarAdmin } from '@/lib/admin'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verificarAdmin()

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Admin</p>
          <p className="font-bold text-lg">IADONAI Academy</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/admin/cursos"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cursos
          </Link>
          <Link
            href="/admin/comunidade"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Comunidade
          </Link>
          <Link
            href="/admin/lives"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Lives
          </Link>
          <Link
            href="/admin/membros"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Membros
          </Link>
          <Link
            href="/admin/configuracoes"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Configurações
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-slate-700 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ← Ver como aluno
          </Link>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white">
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}
