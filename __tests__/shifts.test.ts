type ShiftStatus = 'upcoming' | 'active' | 'done' | 'cancelled'

type Shift = {
  id: string
  worker_id: string
  location: string
  status: ShiftStatus
  scheduled_start: string
  checked_in_at: string | null
  checked_out_at: string | null
  photo_url: string | null
  voice_url: string | null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-DE', { hour: '2-digit', minute: '2-digit' })
}

function updateShift(shifts: Shift[], id: string, patch: Partial<Shift>): Shift[] {
  return shifts.map(s => s.id === id ? { ...s, ...patch } : s)
}

function getShiftDuration(shift: Shift): number | null {
  if (!shift.checked_in_at || !shift.checked_out_at) return null
  const ms = new Date(shift.checked_out_at).getTime() - new Date(shift.checked_in_at).getTime()
  return Math.round(ms / 60000)
}

function makeShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 'shift-1',
    worker_id: 'worker-1',
    location: 'North Tower, 12th floor, East wing',
    status: 'upcoming',
    scheduled_start: '2024-09-24T08:00:00.000Z',
    checked_in_at: null,
    checked_out_at: null,
    photo_url: null,
    voice_url: null,
    ...overrides,
  }
}

describe('formatTime', () => {
  it('formats ISO string to HH:MM', () => {
    const result = formatTime('2024-09-24T08:30:00.000Z')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns different times for different inputs', () => {
    const t1 = formatTime('2024-09-24T08:00:00.000Z')
    const t2 = formatTime('2024-09-24T14:00:00.000Z')
    expect(t1).not.toBe(t2)
  })
})

describe('shift status transitions', () => {
  it('starts as upcoming', () => {
    const shift = makeShift()
    expect(shift.status).toBe('upcoming')
    expect(shift.checked_in_at).toBeNull()
  })

  it('becomes active after check-in', () => {
    const shifts = [makeShift()]
    const now = new Date().toISOString()
    const updated = updateShift(shifts, 'shift-1', { status: 'active', checked_in_at: now })
    expect(updated[0].status).toBe('active')
    expect(updated[0].checked_in_at).toBe(now)
  })

  it('becomes done after check-out', () => {
    const now = new Date().toISOString()
    const shifts = [makeShift({ status: 'active', checked_in_at: now })]
    const updated = updateShift(shifts, 'shift-1', { status: 'done', checked_out_at: now })
    expect(updated[0].status).toBe('done')
    expect(updated[0].checked_out_at).toBe(now)
  })

  it('does not affect other shifts', () => {
    const shifts = [makeShift({ id: 'shift-1' }), makeShift({ id: 'shift-2' })]
    const updated = updateShift(shifts, 'shift-1', { status: 'active' })
    expect(updated[1].status).toBe('upcoming')
  })
})

describe('location display', () => {
  it('splits location into name and address', () => {
    const shift = makeShift({ location: 'North Tower, 12th floor, East wing' })
    const parts = shift.location.split(',')
    expect(parts[0].trim()).toBe('North Tower')
    expect(parts.slice(1).join(',').trim()).toBe('12th floor, East wing')
  })
})

describe('getShiftDuration', () => {
  it('returns duration in minutes between check-in and check-out', () => {
    const shift = makeShift({
      checked_in_at: '2024-09-24T08:00:00.000Z',
      checked_out_at: '2024-09-24T09:30:00.000Z',
    })
    expect(getShiftDuration(shift)).toBe(90)
  })

  it('returns null if not checked in', () => {
    const shift = makeShift()
    expect(getShiftDuration(shift)).toBeNull()
  })

  it('returns null if checked in but not checked out', () => {
    const shift = makeShift({ checked_in_at: '2024-09-24T08:00:00.000Z' })
    expect(getShiftDuration(shift)).toBeNull()
  })
})

describe('job proof', () => {
  it('photo starts as null', () => {
    const shift = makeShift()
    expect(shift.photo_url).toBeNull()
  })

  it('stores photo url after upload', () => {
    const shifts = [makeShift()]
    const url = 'https://storage.example.com/shift-1/photo.jpg'
    const updated = updateShift(shifts, 'shift-1', { photo_url: url })
    expect(updated[0].photo_url).toBe(url)
  })

  it('stores voice url after recording', () => {
    const shifts = [makeShift()]
    const url = 'https://storage.example.com/voices/shift-1/note.mp4'
    const updated = updateShift(shifts, 'shift-1', { voice_url: url })
    expect(updated[0].voice_url).toBe(url)
  })
})
