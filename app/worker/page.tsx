'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BlankaLogo, SparkleIcon } from '@/components/BlankaLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLang } from '@/lib/i18n'
import { Camera, Mic, MapPin, Loader2, X } from 'lucide-react'

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
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-DE', { hour: '2-digit', minute: '2-digit' })
}

export default function WorkerPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [selected, setSelected] = useState<Shift | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
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

      const { data: profile } = await supabase.from('profiles').select('full_name').single()
      setUserName(profile?.full_name ?? '')

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('worker_id', user.id)
        .gte('scheduled_start', todayStart.toISOString())
        .order('scheduled_start', { ascending: true })
      const list = data ?? []
      setShifts(list)
      const firstActive = list.find(s => s.status === 'active' || s.status === 'upcoming')
      setSelected(firstActive ?? list[0] ?? null)
      setLoading(false)
    }
    load()
  }, [router])

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
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selected) return

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

    const { error: dbError } = await supabase
      .from('shifts')
      .update({ photo_url: publicUrl })
      .eq('id', selected.id)

    if (dbError) {
      setUploadError('Save failed: ' + dbError.message)
    } else {
      updateShift(selected.id, { photo_url: publicUrl })
    }

    setUploading(false)
    e.target.value = ''
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
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <BlankaLogo size={22} />
          <span className="font-bold text-[#1a2821]">Blanka</span>
        </div>
        <p className="text-xs font-medium text-[#5a7a5c] uppercase tracking-wider flex items-center gap-2 mb-1">
          <span className="h-px w-6 bg-[#5a7a5c] inline-block"></span>
          Live Workspace
        </p>
        <div className="flex items-start justify-between">
          <div className="flex-1 text-center">
            <p className="text-[#6b7b6e] text-sm font-medium mb-1">{t.welcome}</p>
            <h1 className="text-5xl font-black text-[#1a2821]">{userName}</h1>
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

      <div className="h-px bg-[#e0e8e1] mx-8 mb-6"></div>

      {/* Two-panel layout */}
      <div className="flex gap-6 px-8 pb-8">

        {/* Left: shift list */}
        <div className="w-72 shrink-0">
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
                onClick={() => setSelected(shift)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected?.id === shift.id
                    ? 'bg-white border-[#c8d8ca] shadow-sm'
                    : 'bg-white/60 border-transparent hover:border-[#e0e8e1] hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#1a2821]">{formatTime(shift.scheduled_start)}</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${
                    shift.status === 'active' ? 'text-[#5a7a5c]' : 'text-[#8a9b8d]'
                  }`}>
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
          <div className="flex-1 bg-white rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider flex items-center gap-1 mb-1 ${
                  selected.status === 'active' ? 'text-[#5a7a5c]' : 'text-[#8a9b8d]'
                }`}>
                  ● {selected.status === 'active' ? 'ACTIVE JOB' : selected.status.toUpperCase()}
                </p>
                <h2 className="text-3xl font-black text-[#1a2821]">{selected.location.split(',')[0]}</h2>
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
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                {selected.status === 'upcoming' ? (
                  <div className="border border-[#e0e8e1] rounded-xl py-3 flex items-center justify-center gap-2 text-[#c0c8c1] text-sm">
                    <Camera size={16} strokeWidth={1.5} /> Check in first
                  </div>
                ) : selected.photo_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#e0e8e1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.photo_url}
                      alt="Job proof"
                      className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightbox(selected.photo_url)}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-white/90 text-[#1a2821] text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-white transition-colors"
                    >
                      <Camera size={12} strokeWidth={1.5} /> Replace
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full border border-[#e0e8e1] rounded-xl py-3 flex items-center justify-center gap-2 text-[#8a9b8d] text-sm hover:bg-[#f9fbf9] transition-colors disabled:opacity-50"
                    >
                      {uploading
                        ? <><Loader2 size={16} className="animate-spin" /> {t.saving}</>
                        : <><Camera size={16} strokeWidth={1.5} /> {t.uploadPhoto}</>
                      }
                    </button>
                    {uploadError && (
                      <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                    )}
                  </>
                )}
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
                  <div className="border border-[#5a7a5c] rounded-xl p-3">
                    <audio controls src={selected.voice_url} className="w-full h-8" />
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      className="mt-2 text-xs text-[#6b7b6e] hover:text-[#1a2821] flex items-center gap-1"
                    >
                      <Mic size={12} strokeWidth={1.5} /> {t.recordVoice}
                    </button>
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
                <div className="bg-[#f0f4f0] border-l-2 border-[#5a7a5c] rounded-r-xl px-4 py-3 flex items-center gap-2">
                  <p className="text-[#5a7a5c] text-sm font-medium">{t.done}</p>
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
    </div>
  )
}
