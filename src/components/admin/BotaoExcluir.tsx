'use client'

import { Button } from '@/components/ui/button'

interface Props {
  action: (formData: FormData) => Promise<void>
  fields: Record<string, string>
  mensagem?: string
}

export function BotaoExcluir({ action, fields, mensagem = 'Confirma a exclusão?' }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(mensagem)) e.preventDefault()
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  )
}
