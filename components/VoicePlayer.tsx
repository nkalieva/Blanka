'use client'

import { useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

export function VoicePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  function toggle() {
    const a = audioRef.current
    if (!a) return
    playing ? a.pause() : a.play()
    setPlaying(!playing)
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-[#e0e8e1] rounded-xl px-4 py-3">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
      />
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-[#1a2821] flex items-center justify-center shrink-0 hover:bg-[#2a3831] transition-colors"
      >
        {playing
          ? <Pause size={14} fill="white" color="white" />
          : <Play size={14} fill="white" color="white" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <div
          className="relative h-1.5 bg-[#e8ede8] rounded-full cursor-pointer"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const a = audioRef.current
            if (a && duration) a.currentTime = ((e.clientX - rect.left) / rect.width) * duration
          }}
        >
          <div
            className="absolute left-0 top-0 h-full bg-[#5a7a5c] rounded-full"
            style={{ width: duration ? `${(current / duration) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#6b7b6e] mt-1">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  )
}
