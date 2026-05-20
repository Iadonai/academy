'use client'

import { useState } from 'react'

export function AulaSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="aula-sidebar-btn" onClick={() => setOpen(true)}>
        <span>☰ Lista de aulas</span>
        <span style={{ fontSize: 10, opacity: .6 }}>ver todas</span>
      </button>

      {open && (
        <div className="aula-sidebar-backdrop" onClick={() => setOpen(false)} />
      )}

      <aside className={`aula-sidebar${open ? ' open' : ''}`}>
        <button className="aula-sidebar-close" onClick={() => setOpen(false)}>
          ✕ Fechar
        </button>
        {children}
      </aside>
    </>
  )
}
