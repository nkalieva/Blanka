'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BlankaLogo } from '@/components/BlankaLogo'
import { MapPin, Camera, Mic, X, Plus, Trash2 } from 'lucide-react'

type Shift = {
  id: string
  worker_id: string
  location: string
  status: 'upcoming' | 'active' | 'done' | 'cancelled'
  scheduled_start: string
  checked_in_at: string | null
  checked_out_at: string | null
  photo_url: string | null
  voice_url: string | null
  worker_name?: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-DE', { hour: '2-digit', minute: '2-digit' })
}

function statusColor(status: Shift['status']) {
  if (status === 'active') return 'text-[#5a7a5c]'
  if (status === 'done') return 'text-[#8a9b8d]'
  return 'text-[#8a9b8d]'
}

type Worker = { id: string; full_name: string }

export default function ManagerPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [selected, setSelected] = useState<Shift | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'done' | 'archive'>('all')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formWorker, setFormWorker] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [archiveSort, setArchiveSort] = useState<'desc' | 'asc'>('desc')
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({})
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('full_name').single()
      setUserName(profile?.full_name ?? '')

      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .order('scheduled_start', { ascending: true })

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')

      const workerList = (profiles ?? []).filter(p => p.role === 'worker')
      setWorkers(workerList)
      if (workerList.length > 0) setFormWorker(workerList[0].id)

      const profileMap: Record<string, string> = {}
      for (const p of profiles ?? []) profileMap[p.id] = p.full_name

      const enriched = (shiftsData ?? []).map(s => ({
        ...s,
        worker_name: profileMap[s.worker_id] ?? 'Unknown',
      }))

      setShifts(enriched)
      if (enriched.length > 0) setSelected(enriched[0])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleDeleteShift(shift: Shift) {
    if (shift.status === 'done') {
      alert('Done shifts are kept as archive and cannot be deleted.')
      return
    }
    if (!confirm('Delete this shift?')) return
    const supabase = createClient()
    await supabase.from('shifts').delete().eq('id', shift.id)
    const remaining = shifts.filter(s => s.id !== shift.id)
    setShifts(remaining)
    setSelected(remaining.length > 0 ? remaining[0] : null)
  }

  async function handleCreateShift() {
    if (!formWorker || !formLocation.trim() || !formDate || !formTime) {
      setFormError('Please fill in all fields')
      return
    }
    setFormSaving(true)
    setFormError('')
    const supabase = createClient()
    const scheduled_start = new Date(`${formDate}T${formTime}:00`).toISOString()
    const { error } = await supabase.from('shifts').insert({
      worker_id: formWorker,
      location: formLocation.trim(),
      scheduled_start,
      status: 'upcoming',
    })
    if (error) {
      setFormError(error.message)
      setFormSaving(false)
      return
    }
    // Reload shifts
    const { data: shiftsData } = await supabase.from('shifts').select('*').order('scheduled_start', { ascending: true })
    const { data: profiles } = await supabase.from('profiles').select('id, full_name')
    const profileMap: Record<string, string> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p.full_name
    const enriched = (shiftsData ?? []).map(s => ({ ...s, worker_name: profileMap[s.worker_id] ?? 'Unknown' }))
    setShifts(enriched)
    setShowForm(false)
    setFormLocation('')
    setFormDate('')
    setFormTime('')
    setFormSaving(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const todayShifts = shifts.filter(s => {
    const d = new Date(s.scheduled_start)
    return d >= todayStart && d <= todayEnd
  })
  const archiveShifts = shifts.filter(s => {
    const d = new Date(s.scheduled_start)
    return s.status === 'done' && (d < todayStart || d > todayEnd)
  })

  const filtered =
    filter === 'all' ? todayShifts :
    filter === 'archive' ? [...archiveShifts].sort((a, b) => {
      const diff = new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
      return archiveSort === 'desc' ? diff : -diff
    }) :
    todayShifts.filter(s => s.status === filter)

  const counts = {
    all: todayShifts.length,
    upcoming: todayShifts.filter(s => s.status === 'upcoming').length,
    active: todayShifts.filter(s => s.status === 'active').length,
    done: todayShifts.filter(s => s.status === 'done').length,
    archive: archiveShifts.length,
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f0f4f0] flex items-center justify-center text-[#6b7b6e]">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f0f4f0]">
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-[#1a2821]">New Shift</h2>
              <button onClick={() => setShowForm(false)} className="text-[#6b7b6e] hover:text-[#1a2821]"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider block mb-1">Worker</label>
                <select
                  value={formWorker}
                  onChange={e => setFormWorker(e.target.value)}
                  className="w-full border border-[#e0e8e1] rounded-xl px-3 py-2 text-sm text-[#1a2821] bg-[#f9fbf9] focus:outline-none focus:border-[#5a7a5c]"
                >
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider block mb-1">Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  placeholder="e.g. Kurfürstendamm 12, Berlin"
                  className="w-full border border-[#e0e8e1] rounded-xl px-3 py-2 text-sm text-[#1a2821] bg-[#f9fbf9] focus:outline-none focus:border-[#5a7a5c] placeholder-[#b0bcb2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider block mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full border border-[#e0e8e1] rounded-xl px-3 py-2 text-sm text-[#1a2821] bg-[#f9fbf9] focus:outline-none focus:border-[#5a7a5c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider block mb-1">Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full border border-[#e0e8e1] rounded-xl px-3 py-2 text-sm text-[#1a2821] bg-[#f9fbf9] focus:outline-none focus:border-[#5a7a5c]"
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <button
                onClick={handleCreateShift}
                disabled={formSaving}
                className="w-full bg-[#5a7a5c] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#4a6a4c] transition-colors disabled:opacity-50"
              >
                {formSaving ? 'Creating...' : 'Create Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Job proof" className="max-h-screen max-w-full object-contain rounded-xl" />
        </div>
      )}
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <BlankaLogo size={22} />
          <span className="font-bold text-[#1a2821]">Blanka</span>
        </div>
        <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider flex items-center gap-2 mb-1">
          <span className="h-px w-6 bg-[#5a7a5c] inline-block"></span>
          Live Workspace
        </p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#1a2821]">Manager View</h1>
            <p className="text-[#6b7b6e] text-sm mt-1">All workers, all shifts — real-time overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden border border-[#e0e8e1]">
              <button
                onClick={() => router.push('/worker')}
                className="bg-white text-[#4a5c4d] px-5 py-2 text-sm hover:bg-[#f0f4f0] transition-colors"
              >
                Switch to Worker View
              </button>
              <button className="bg-[#5a7a5c] text-white px-5 py-2 text-sm font-medium">
                Manager View
              </button>
            </div>
            <button onClick={handleSignOut} className="text-[#6b7b6e] text-sm px-3 py-2 hover:text-[#1a2821] transition-colors">
              {userName} · Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e0e8e1] mx-8 mb-6"></div>

      {/* Stats row */}
      <div className="px-8 mb-6 grid grid-cols-5 gap-3">
        {(['all', 'upcoming', 'active', 'done', 'archive'] as const).map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-2xl p-4 text-left border transition-all ${
              filter === key
                ? 'bg-white border-[#c8d8ca] shadow-sm'
                : 'bg-white/60 border-transparent hover:border-[#e0e8e1] hover:bg-white/80'
            }`}
          >
            <p className="text-2xl font-black text-[#1a2821]">{counts[key]}</p>
            <p className="text-xs font-medium text-[#6b7b6e] uppercase tracking-wider mt-1">
              {key === 'all' ? 'Today' : key === 'archive' ? 'Archive' : key}
            </p>
          </button>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-6 px-8 pb-8">

        {/* Left: shift list */}
        <div className="w-72 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider">
                {filter === 'archive' ? 'Archive' : 'All Shifts'}
              </p>
              <p className="text-xs text-[#6b7b6e]">
                {filter === 'archive'
                  ? `${archiveShifts.length} completed shift${archiveShifts.length !== 1 ? 's' : ''}`
                  : new Date().toLocaleDateString('en-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {filter === 'archive' && (
                <button
                  onClick={() => setArchiveSort(s => s === 'desc' ? 'asc' : 'desc')}
                  className="text-xs border border-[#e0e8e1] bg-white rounded px-2 py-1 text-[#6b7b6e] hover:border-[#5a7a5c] transition-colors"
                >
                  {archiveSort === 'desc' ? '↓ Newest' : '↑ Oldest'}
                </button>
              )}
              <span className="text-xs border border-[#e0e8e1] bg-white rounded px-2 py-1 text-[#6b7b6e]">
                {filtered.length} shifts
              </span>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1 bg-[#5a7a5c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#4a6a4c] transition-colors"
              >
                <Plus size={13} /> New
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-[#6b7b6e] text-center py-8">No shifts found</p>
            )}

            {filter === 'archive' ? (() => {
              // Group by year → month
              const byYear: Record<string, Record<string, Shift[]>> = {}
              for (const shift of filtered) {
                const d = new Date(shift.scheduled_start)
                const year = String(d.getFullYear())
                const month = d.toLocaleDateString('en-DE', { month: 'long' })
                if (!byYear[year]) byYear[year] = {}
                if (!byYear[year][month]) byYear[year][month] = []
                byYear[year][month].push(shift)
              }
              return Object.entries(byYear).map(([year, months]) => {
                const yearOpen = !!openYears[year]
                const yearTotal = Object.values(months).reduce((sum, arr) => sum + arr.length, 0)
                return (
                  <div key={year} className="mb-1">
                    <button
                      onClick={() => setOpenYears(prev => ({ ...prev, [year]: !prev[year] }))}
                      className="w-full flex items-center justify-between px-2 py-2.5 bg-[#f0f4f0] rounded-xl hover:bg-[#e8ede8] transition-colors"
                    >
                      <p className="text-sm font-black text-[#1a2821]">{year}</p>
                      <span className="text-xs text-[#6b7b6e]">
                        {yearTotal} shifts {yearOpen ? '▲' : '▼'}
                      </span>
                    </button>

                    {yearOpen && Object.entries(months).map(([month, monthShifts]) => {
                      const monthKey = `${year}-${month}`
                      const monthOpen = !!openMonths[monthKey]
                      return (
                        <div key={monthKey} className="ml-2 mt-1">
                          <button
                            onClick={() => setOpenMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }))}
                            className="w-full flex items-center justify-between px-1 py-1.5 hover:opacity-70 transition-opacity"
                          >
                            <p className="text-xs font-bold text-[#5a7a5c] uppercase tracking-wider">{month}</p>
                            <span className="text-xs text-[#8a9b8d]">
                              {monthShifts.length} shift{monthShifts.length !== 1 ? 's' : ''} {monthOpen ? '▲' : '▼'}
                            </span>
                          </button>
                          {monthOpen && monthShifts.map(shift => (
                            <button
                              key={shift.id}
                              onClick={() => setSelected(shift)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all mb-2 ${
                                selected?.id === shift.id
                                  ? 'bg-white border-[#c8d8ca] shadow-sm'
                                  : 'bg-white/60 border-transparent hover:border-[#e0e8e1] hover:bg-white/80'
                              }`}
                            >
                              <span className="font-bold text-[#1a2821] text-sm">
                                {new Date(shift.scheduled_start).toLocaleDateString('en-DE', { day: 'numeric', month: 'short' })} · {formatTime(shift.scheduled_start)}
                              </span>
                              <p className="font-semibold text-[#1a2821] text-sm mt-0.5">{shift.location.split(',')[0]}</p>
                              <p className="text-[#6b7b6e] text-xs">{shift.worker_name}</p>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })
            })() : filtered.map(shift => (
              <button
                key={shift.id}
                onClick={() => setSelected(shift)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected?.id === shift.id
                    ? 'bg-white border-[#c8d8ca] shadow-sm'
                    : 'bg-white/60 border-transparent hover:border-[#e0e8e1] hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#1a2821]">{formatTime(shift.scheduled_start)}</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${statusColor(shift.status)}`}>
                    ● {shift.status.toUpperCase()}
                  </span>
                </div>
                <p className="font-semibold text-[#1a2821] text-sm">{shift.location.split(',')[0]}</p>
                <p className="text-[#6b7b6e] text-xs">{shift.worker_name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: shift detail */}
        {selected ? (
          <div className="flex-1 bg-white rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider flex items-center gap-1 mb-1 ${statusColor(selected.status)}`}>
                  ● {selected.status === 'active' ? 'ACTIVE JOB' : selected.status.toUpperCase()}
                </p>
                <h2 className="text-3xl font-black text-[#1a2821]">{selected.location.split(',')[0]}</h2>
                <p className="text-[#6b7b6e] text-sm flex items-center gap-1 mt-1">
                  <MapPin size={14} strokeWidth={1.5} className="shrink-0" />
                  {selected.location.split(',').slice(1).join(',').trim() || selected.location}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <p className="text-2xl font-bold text-[#1a2821]">{formatTime(selected.scheduled_start)}</p>
                <p className="text-xs text-[#6b7b6e]">scheduled</p>
                <button
                  onClick={() => handleDeleteShift(selected)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors mt-1"
                >
                  <Trash2 size={13} /> Delete shift
                </button>
              </div>
            </div>

            <div className="h-px bg-[#f0f4f0] mb-6"></div>

            {/* Worker info */}
            <div className="mb-5">
              <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider mb-2">Worker</p>
              <div className="bg-[#f9fbf9] rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="font-semibold text-[#1a2821]">{selected.worker_name}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  selected.status === 'active'
                    ? 'bg-[#e8f4e8] text-[#5a7a5c]'
                    : selected.status === 'done'
                    ? 'bg-[#f0f4f0] text-[#6b7b6e]'
                    : 'bg-[#f0f4f0] text-[#8a9b8d]'
                }`}>
                  {selected.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="h-px bg-[#f0f4f0] mb-5"></div>

            {/* Timeline */}
            <div className="mb-5">
              <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider mb-3">Timeline</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#6b7b6e]">Scheduled start</p>
                  <p className="text-sm font-semibold text-[#1a2821]">{formatTime(selected.scheduled_start)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#6b7b6e]">Checked in</p>
                  <p className={`text-sm font-semibold ${selected.checked_in_at ? 'text-[#5a7a5c]' : 'text-[#c0c8c1]'}`}>
                    {selected.checked_in_at ? formatTime(selected.checked_in_at) : '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#6b7b6e]">Checked out</p>
                  <p className={`text-sm font-semibold ${selected.checked_out_at ? 'text-[#5a7a5c]' : 'text-[#c0c8c1]'}`}>
                    {selected.checked_out_at ? formatTime(selected.checked_out_at) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#f0f4f0] mb-5"></div>

            {/* Job Proof */}
            <div>
              <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider mb-3">Job Proof</p>

              {/* Photo */}
              {selected.photo_url ? (
                <div className="rounded-xl overflow-hidden border border-[#5a7a5c] mb-3 cursor-pointer" onClick={() => setLightbox(selected.photo_url)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.photo_url} alt="Job proof" className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
                  <div className="px-3 py-2 flex items-center gap-1 text-xs text-[#5a7a5c]">
                    <Camera size={12} strokeWidth={1.5} /> Photo uploaded · click to enlarge
                  </div>
                </div>
              ) : (
                <div className="border border-[#e0e8e1] rounded-xl p-3 flex items-start gap-2 mb-3">
                  <Camera size={14} strokeWidth={1.5} className="text-[#8a9b8d] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#1a2821]">No photo uploaded</p>
                    <p className="text-xs text-[#6b7b6e]">Not submitted yet</p>
                  </div>
                </div>
              )}

              {/* Voice */}
              {selected.voice_url ? (
                <div className="border border-[#5a7a5c] rounded-xl p-3">
                  <div className="flex items-center gap-1 text-xs text-[#5a7a5c] mb-2">
                    <Mic size={12} strokeWidth={1.5} /> Voice note recorded
                  </div>
                  <audio controls src={selected.voice_url} className="w-full h-8" />
                </div>
              ) : (
                <div className="border border-[#e0e8e1] rounded-xl p-3 flex items-start gap-2">
                  <Mic size={14} strokeWidth={1.5} className="text-[#8a9b8d] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#1a2821]">No voice note</p>
                    <p className="text-xs text-[#6b7b6e]">Not submitted yet</p>
                  </div>
                </div>
              )}
            </div>

            {selected.status === 'done' && (
              <>
                <div className="h-px bg-[#f0f4f0] mt-5"></div>
                <div className="mt-5 bg-[#f0f4f0] border-l-2 border-[#5a7a5c] rounded-r-xl px-4 py-3">
                  <p className="text-[#5a7a5c] text-sm font-medium">✓ Shift completed</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl p-6 flex items-center justify-center text-[#6b7b6e]">
            Select a shift to view details
          </div>
        )}
      </div>
    </div>
  )
}
