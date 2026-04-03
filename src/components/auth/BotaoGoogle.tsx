'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function BotaoGoogle({ texto = 'Entrar com Google' }: { texto?: string }) {
  async function handleClick() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleClick}>
      {texto}
    </Button>
  )
}
