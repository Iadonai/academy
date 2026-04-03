export default function ConfirmarEmailPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
      <div className="text-5xl mb-4">📧</div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Verifique seu email</h2>
      <p className="text-sm text-slate-500 leading-relaxed">
        Enviamos um link de confirmação para o seu email.<br />
        Clique no link para ativar sua conta e acessar a plataforma.
      </p>
      <p className="text-xs text-slate-400 mt-4">
        Não recebeu? Verifique a pasta de spam.
      </p>
    </div>
  )
}
