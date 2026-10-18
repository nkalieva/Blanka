'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BlankaLogo, SparkleIcon } from '@/components/BlankaLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLang } from '@/lib/i18n'
import { Camera, Mic, MapPin, Loader2, X, Trash2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { FloatingChat } from '@/components/FloatingChat'
import { VoicePlayer } from '@/components/VoicePlayer'

type Shift = {
  id: string
  worker_id: string
  manager_id: string
  location: string
  status: 'upcoming' | 'active' | 'done' | 'cancelled'
  scheduled_start: string
  checked_in_at: string | null
  checked_out_at: string | null
  photo_url: string | null
  photo_urls: string[] | null
  voice_url: string | null
  notes: string | null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-DE', { hour: '2-digit', minute: '2-digit' })
}


function shiftCardBg(status: Shift['status'], isSelected: boolean) {
  if (status === 'done') {
    return isSelected
      ? 'bg-green-50 border-green-200 shadow-sm'
      : 'bg-green-50/60 border-transparent hover:border-green-200 hover:bg-green-50/80'
  }
  return isSelected
    ? 'bg-red-50 border-red-200 shadow-sm'
    : 'bg-red-50/50 border-transparent hover:border-red-200 hover:bg-red-50/70'
}

export default function WorkerPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [managerId, setManagerId] = useState('')
  const [selected, setSelected] = useState<Shift | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const { t } = useLang()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setWorkerId(user.id)
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      setUserName(profile?.full_name ?? '')

      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('worker_id', user.id)
        .order('scheduled_start', { ascending: false })
      const list = data ?? []
      setShifts(list)
      const firstActive = list.find(s => s.status === 'active') ?? list.find(s => s.status === 'upcoming')
      setSelected(firstActive ?? list[0] ?? null)
      // get manager_id from shifts (more reliable than profile)
      const mgrId = list.find(s => s.manager_id)?.manager_id ?? ''
      setManagerId(mgrId)
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    setNoteText(selected?.notes ?? '')
  }, [selected?.id])

  function updateShift(id: string, patch: Partial<Shift>) {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
    setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev)
  }

  async function handleCheckIn(id: string) {
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from('shifts').update({ status: 'active', checked_in_at: now }).eq('id', id)
    updateShift(id, { status: 'active', checked_in_at: now })
  }

  async function handleCheckOut(id: string) {
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from('shifts').update({ status: 'done', checked_out_at: now }).eq('id', id)
    updateShift(id, { status: 'done', checked_out_at: now })

    const duration = 3000
    const end = Date.now() + duration
    const colors = ['#5a7a5c', '#86efac', '#1a2821', '#fbbf24', '#f472b6', '#60a5fa']
    ;(function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors })
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selected) return

    const existing = selected.photo_urls ?? (selected.photo_url ? [selected.photo_url] : [])
    if (existing.length >= 10) { setUploadError('Max 10 photos'); return }

    setUploading(true)
    setUploadError(null)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${selected.id}/${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('shift-photos')
      .upload(path, file, { upsert: true })

    if (storageError) {
      setUploadError('Upload failed: ' + storageError.message)
      setUploading(false)
      e.target.value = ''
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('shift-photos')
      .getPublicUrl(path)

    const newUrls = [...existing, publicUrl]
    const { error: dbError } = await supabase
      .from('shifts')
      .update({ photo_urls: newUrls })
      .eq('id', selected.id)

    if (dbError) {
      setUploadError('Save failed: ' + dbError.message)
    } else {
      updateShift(selected.id, { photo_urls: newUrls })
    }

    setUploading(false)
    e.target.value = ''
  }

  async function handlePhotoRemove(url: string) {
    if (!selected) return
    const existing = selected.photo_urls ?? (selected.photo_url ? [selected.photo_url] : [])
    const newUrls = existing.filter(u => u !== url)
    const supabase = createClient()
    await supabase.from('shifts').update({ photo_urls: newUrls }).eq('id', selected.id)
    updateShift(selected.id, { photo_urls: newUrls })
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const mimeType = ['audio/mp4', 'audio/webm', 'audio/ogg'].find(
      t => MediaRecorder.isTypeSupported(t)
    ) ?? ''

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
    const chunks: BlobPart[] = []

    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/mp4' })
      await uploadVoice(blob, recorder.mimeType)
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
    setRecordingSeconds(0)
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1)
    }, 1000)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    setRecording(false)
  }

  async function uploadVoice(blob: Blob, mimeType?: string) {
    if (!selected) return
    setUploading(true)
    const supabase = createClient()
    const ext = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm'
    const path = `voices/${selected.id}/${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('shift-photos')
      .upload(path, blob, { upsert: true, contentType: mimeType || 'audio/mp4' })

    if (storageError) {
      setUploadError('Voice upload failed: ' + storageError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('shift-photos')
      .getPublicUrl(path)

    const { error: dbError } = await supabase
      .from('shifts')
      .update({ voice_url: publicUrl })
      .eq('id', selected.id)

    if (!dbError) updateShift(selected.id, { voice_url: publicUrl })
    else setUploadError('Save failed: ' + dbError.message)
    setUploading(false)
  }

  async function handleVoiceDelete() {
    if (!selected) return
    const supabase = createClient()
    await supabase.from('shifts').update({ voice_url: null }).eq('id', selected.id)
    updateShift(selected.id, { voice_url: null })
  }

  async function handleNoteSave() {
    if (!selected) return
    setNoteSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('shifts')
      .update({ notes: noteText })
      .eq('id', selected.id)
    if (!error) updateShift(selected.id, { notes: noteText })
    setNoteSaving(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f0f4f0] flex items-center justify-center text-[#6b7b6e]">
      {t.loading}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f0f4f0]">
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
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <BlankaLogo size={22} />
          <span className="font-bold text-[#1a2821]">Blanka</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#5a7a5c] inline-block"></span>
              Live Workspace
            </p>
            <p className="text-[#6b7b6e] text-sm font-medium">{t.welcome}</p>
            <h1 className="text-4xl md:text-5xl font-black text-[#1a2821]">{userName}</h1>
            <p className="text-[#6b7b6e] text-sm mt-2">
              {new Date().toLocaleDateString('en-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            <button onClick={handleSignOut} className="text-[#6b7b6e] text-sm px-3 py-2 hover:text-[#1a2821] transition-colors">
              {t.signOut}
            </button>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e0e8e1] mx-4 md:mx-8 mb-6"></div>

      {/* Mobile: show list or detail */}
      {/* Desktop: two-panel side by side */}
      <div className="flex flex-col md:flex-row gap-6 px-4 md:px-8 pb-8">

        {/* Left: shift list — hidden on mobile when detail is open */}
        <div className={`w-full md:w-72 md:shrink-0 ${showDetail ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider">{t.today}</p>
              <p className="text-xs text-[#6b7b6e]">
                {new Date().toLocaleDateString('en-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <span className="text-xs border border-[#e0e8e1] bg-white rounded px-2 py-1 text-[#6b7b6e]">
              {shifts.length} jobs
            </span>
          </div>

          <div className="space-y-2">
            {shifts.map(shift => (
              <button
                key={shift.id}
                onClick={() => { setSelected(shift); setShowDetail(true) }}
                className="w-full text-left p-4 rounded-2xl border transition-all"
                style={{
                  backgroundColor: shift.status === 'done' ? '#dcfce7' : '#fee2e2',
                  borderColor: selected?.id === shift.id
                    ? (shift.status === 'done' ? '#86efac' : '#fca5a5')
                    : 'transparent',
                  boxShadow: selected?.id === shift.id ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#1a2821]">{formatTime(shift.scheduled_start)}</span>
                  <span
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: shift.status === 'done' ? '#16a34a' : shift.status === 'active' ? '#5a7a5c' : '#dc2626' }}
                  >
                    ● {shift.status.toUpperCase()}
                  </span>
                </div>
                <p className="font-semibold text-[#1a2821] text-sm">{shift.location.split(',')[0]}</p>
                <p className="text-[#6b7b6e] text-xs">{shift.location.split(',').slice(1).join(',').trim()}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: shift detail */}
        {selected ? (
          <div className={`flex-1 bg-white rounded-2xl p-6 ${!showDetail ? 'hidden md:block' : 'block'}`}>
            {/* Mobile back button */}
            <button
              className="md:hidden flex items-center gap-1 text-[#5a7a5c] text-sm mb-4"
              onClick={() => setShowDetail(false)}
            >
              ← Back to shifts
            </button>

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider flex items-center gap-1 mb-1 ${
                  selected.status === 'done' ? 'text-green-600' :
                  selected.status === 'active' ? 'text-[#5a7a5c]' : 'text-red-500'
                }`}>
                  ● {selected.status === 'active' ? 'ACTIVE JOB' : selected.status.toUpperCase()}
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-[#1a2821]">{selected.location.split(',')[0]}</h2>
                <p className="text-[#6b7b6e] text-sm flex items-center gap-1 mt-1">
                  <MapPin size={14} strokeWidth={1.5} className="shrink-0" />
                  {selected.location.split(',').slice(1).join(',').trim() || selected.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#1a2821]">{formatTime(selected.scheduled_start)}</p>
                <p className="text-xs text-[#6b7b6e]">{t.scheduled}</p>
              </div>
            </div>

            <div className="h-px bg-[#f0f4f0] mb-6"></div>

            <div className="space-y-5">
              {/* Step 1: Check In */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-[#1a2821]">{t.checkIn}</p>
                  <p className="text-xs text-[#6b7b6e]">Required</p>
                </div>
                {selected.status === 'upcoming' && (
                  <button
                    onClick={() => handleCheckIn(selected.id)}
                    className="w-full bg-[#5a7a5c] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#4a6a4c] transition-colors"
                  >
                    → {t.checkIn}
                  </button>
                )}
                {selected.status !== 'upcoming' && (
                  <p className="text-sm text-[#5a7a5c] flex items-center gap-1">
                    ✓ Checked in at {selected.checked_in_at ? formatTime(selected.checked_in_at) : ''}
                  </p>
                )}
              </div>

              <div className="h-px bg-[#f0f4f0]"></div>

              {/* Step 2: Upload photo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-[#1a2821]">{t.uploadPhoto}</p>
                  <p className="text-xs text-[#6b7b6e]">Optional</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                {(() => {
                  const photos = selected.photo_urls ?? (selected.photo_url ? [selected.photo_url] : [])
                  return selected.status === 'upcoming' ? (
                    <div className="border border-[#e0e8e1] rounded-xl py-3 flex items-center justify-center gap-2 text-[#c0c8c1] text-sm">
                      <Camera size={16} strokeWidth={1.5} /> Check in first
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {photos.map((url, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#e0e8e1] shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Photo ${i + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setLightbox(url)}
                            />
                            <button
                              onClick={() => handlePhotoRemove(url)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-black/80 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {photos.length < 10 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-20 h-20 rounded-xl border border-dashed border-[#c0c8c1] flex flex-col items-center justify-center gap-1 text-[#8a9b8d] hover:bg-[#f9fbf9] transition-colors disabled:opacity-50 shrink-0"
                          >
                            {uploading
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Camera size={16} strokeWidth={1.5} />
                            }
                            <span className="text-xs">{photos.length === 0 ? 'Add' : `${photos.length}/10`}</span>
                          </button>
                        )}
                      </div>
                      {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                    </>
                  )
                })()}
              </div>

              <div className="h-px bg-[#f0f4f0]"></div>

              {/* Step 3: Voice note */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-[#1a2821]">{t.recordVoice}</p>
                  <p className="text-xs text-[#6b7b6e]">Optional · any language</p>
                </div>

                {selected.status === 'upcoming' ? (
                  <div className="border border-[#e0e8e1] rounded-xl py-3 flex items-center justify-center gap-2 text-[#c0c8c1] text-sm">
                    <Mic size={16} strokeWidth={1.5} /> Check in first
                  </div>
                ) : selected.voice_url ? (
                  <div className="space-y-2">
                    <VoicePlayer src={selected.voice_url} />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={recording ? stopRecording : startRecording}
                        className="flex items-center gap-1.5 text-xs text-[#5a7a5c] border border-[#c8d8ca] rounded-lg px-3 py-1.5 hover:bg-[#f0f4f0] transition-colors"
                      >
                        <Mic size={12} strokeWidth={1.5} />
                        {recording ? `Recording ${recordingSeconds}s · stop` : 'Re-record'}
                      </button>
                      <button
                        onClick={handleVoiceDelete}
                        className="flex items-center gap-1.5 text-xs text-red-400 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ) : recording ? (
                  <button
                    onClick={stopRecording}
                    className="w-full bg-red-50 border border-red-200 rounded-xl py-3 flex items-center justify-center gap-2 text-red-500 text-sm hover:bg-red-100 transition-colors"
                  >
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Recording {recordingSeconds}s · tap to stop
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={uploading}
                    className="w-full border border-[#e0e8e1] rounded-xl py-3 flex items-center justify-center gap-2 text-[#8a9b8d] text-sm hover:bg-[#f9fbf9] transition-colors disabled:opacity-50"
                  >
                    {uploading
                      ? <><Loader2 size={16} className="animate-spin" /> {t.saving}</>
                      : <><Mic size={16} strokeWidth={1.5} /> {t.recordVoice}</>
                    }
                  </button>
                )}
              </div>

              <div className="h-px bg-[#f0f4f0]"></div>

              {/* Step 4: Note */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-[#1a2821]">Note</p>
                  <p className="text-xs text-[#6b7b6e]">Optional</p>
                </div>
                {selected.status === 'upcoming' ? (
                  <div className="border border-[#e0e8e1] rounded-xl py-3 flex items-center justify-center gap-2 text-[#c0c8c1] text-sm">
                    Check in first
                  </div>
                ) : (
                  <div>
                    <textarea
                      className="w-full text-sm border border-[#e0e8e1] rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#5a7a5c] text-[#1a2821] placeholder-[#b0bcb2] bg-white"
                      rows={3}
                      placeholder="Add a note about this shift..."
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                    />
                    <button
                      onClick={handleNoteSave}
                      disabled={noteSaving}
                      className="mt-1.5 text-xs text-[#5a7a5c] hover:text-[#1a2821] transition-colors disabled:opacity-50"
                    >
                      {noteSaving ? 'Saving...' : '✓ Save note'}
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#f0f4f0]"></div>

              {/* Job Proof */}
              <div>
                <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider mb-2">Job Proof</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`border rounded-xl p-3 flex items-start gap-2 ${selected.photo_url ? 'border-[#5a7a5c] bg-[#f9fbf9]' : 'border-[#e0e8e1]'}`}>
                    <Camera size={14} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${selected.photo_url ? 'text-[#5a7a5c]' : 'text-[#8a9b8d]'}`} />
                    <div>
                      <p className="text-xs font-medium text-[#1a2821]">
                        {selected.photo_url ? `${t.photo} ✓` : `${t.photo} —`}
                      </p>
                      <p className="text-xs text-[#6b7b6e]">Optional</p>
                    </div>
                  </div>
                  <div className={`border rounded-xl p-3 flex items-start gap-2 ${selected.voice_url ? 'border-[#5a7a5c] bg-[#f9fbf9]' : 'border-[#e0e8e1]'}`}>
                    <Mic size={14} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${selected.voice_url ? 'text-[#5a7a5c]' : 'text-[#8a9b8d]'}`} />
                    <div>
                      <p className="text-xs font-medium text-[#1a2821]">
                        {selected.voice_url ? `${t.voice} ✓` : `${t.voice} —`}
                      </p>
                      <p className="text-xs text-[#6b7b6e]">Optional · any language</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#f0f4f0]"></div>

              {/* Check Out */}
              {selected.status === 'active' && (
                <div>
                  <div className="bg-[#f0f4f0] border-l-2 border-[#5a7a5c] rounded-r-xl px-4 py-3 mb-4">
                    <p className="text-[#5a7a5c] text-sm">✓ Shift in progress</p>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-[#1a2821]">{t.checkOut}</p>
                    <p className="text-xs text-[#6b7b6e]">Optional proof</p>
                  </div>
                  <button
                    onClick={() => handleCheckOut(selected.id)}
                    className="w-full bg-[#5a7a5c] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#4a6a4c] transition-colors"
                  >
                    → {t.done}
                  </button>
                </div>
              )}

              {selected.status === 'done' && (
                <div className="bg-green-50 border-l-2 border-green-500 rounded-r-xl px-4 py-3 flex items-center gap-2">
                  <p className="text-green-600 text-sm font-medium">{t.done}</p>
                  <SparkleIcon size={16} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl p-6 flex items-center justify-center text-[#6b7b6e]">
            {t.noShiftsToday}
          </div>
        )}
      </div>
      <FloatingChat workerName={userName} workerId={workerId} managerId={managerId} />
    </div>
  )
}
