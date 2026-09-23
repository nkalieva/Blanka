import Link from 'next/link'
import { BlankaLogo } from '@/components/BlankaLogo'
import { MapPin } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f0f4f0]">
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <BlankaLogo size={26} />
          <span className="font-bold text-[#1a2821] text-lg">Blanka</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-[#4a5c4d]">
          <span className="cursor-pointer hover:text-[#1a2821]">Product</span>
          <span className="cursor-pointer hover:text-[#1a2821]">Photo proof</span>
          <span className="cursor-pointer hover:text-[#1a2821]">Voice</span>
        </div>
      </nav>

      <div className="flex items-center gap-12 px-16 py-12 max-w-7xl mx-auto">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[#5a7a5c] text-xs font-medium mb-6 uppercase tracking-wider">
            <div className="h-px w-8 bg-[#5a7a5c]"></div>
            Field Operations
          </div>
          <h1 className="text-6xl font-black text-[#1a2821] leading-tight mb-6">
            Your team.<br />
            Every job.<br />
            One tap.
          </h1>
          <p className="text-[#4a5c4d] text-lg mb-8 leading-relaxed">
            Real-time field management for cleaning services.<br />
            Check-in, photo proof, voice in any language.
          </p>
          <div className="flex gap-4">
            <Link href="/signup" className="bg-[#5a7a5c] text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-[#4a6a4c] transition-colors">
              Start Free →
            </Link>
            <Link href="/login" className="border border-[#1a2821]/30 text-[#1a2821] px-6 py-3 rounded-full font-medium hover:bg-white/60 transition-colors">
              See how it works
            </Link>
          </div>
          <p className="text-[#6b7b6e] text-sm mt-8 flex items-center gap-2">
            <span className="text-[#5a7a5c]">●</span>
            Live status across every active job
          </p>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="bg-white rounded-3xl shadow-lg p-6 w-80">
            <p className="text-[#6b7b6e] text-xs font-medium uppercase tracking-wider mb-1">Today&apos;s Shift</p>
            <h3 className="text-xl font-bold text-[#1a2821] mb-1">North Tower</h3>
            <p className="text-[#6b7b6e] text-xs mb-4">08:30–12:30</p>
            <div className="bg-[#f0f4f0] rounded-xl p-3 flex items-center gap-3 mb-3">
              <MapPin size={14} strokeWidth={1.5} className="text-[#5a7a5c] shrink-0" />
              <div>
                <p className="font-medium text-[#1a2821] text-xs">12th floor · East wing</p>
                <p className="text-[#5a7a5c] text-xs">You&apos;re inside the job zone ✓</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="border border-[#e0e8e1] rounded-xl p-3">
                <p className="text-xs text-[#6b7b6e] mb-1">Photo proof</p>
                <p className="text-xs font-medium text-[#1a2821]">0 of 3</p>
              </div>
              <div className="border border-[#e0e8e1] rounded-xl p-3">
                <p className="text-xs text-[#6b7b6e] mb-1">Voice notes</p>
                <p className="text-xs font-medium text-[#1a2821]">Any language</p>
              </div>
            </div>
            <p className="text-[#6b7b6e] text-xs text-center mb-3">Ready when you are</p>
            <button className="w-full bg-[#5a7a5c] text-white py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2">
              <span className="text-[#a8c8a8]">●</span> Check In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
