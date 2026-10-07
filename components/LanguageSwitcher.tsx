'use client'

import { useState } from 'react'
import { useLang, LOCALES } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLang()
  const [open, setOpen] = useState(false)
  const current = LOCALES.find(l => l.code === locale)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
      >
        <span>{current.flag}</span>
        <span className="text-[#6b7b6e] font-medium">{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-[#e0e8e1] py-1 min-w-[160px]">
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#f0f4f0] transition-colors ${
                  locale === l.code ? 'text-[#1a2821] font-semibold' : 'text-[#6b7b6e]'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
