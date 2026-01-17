import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
        return NextResponse.json({ error: 'Missing dates' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Get all rooms
    const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number')

    if (roomsError) {
        return NextResponse.json({ error: roomsError.message }, { status: 500 })
    }

    // 2. Get bookings that overlap
    // Overlap condition: NOT (end <= from OR start >= to)
    // Equivalent to: end > from AND start < to
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('room_id')
        .neq('status', 'cancelled')
        .lt('check_in_date', to)
        .gt('check_out_date', from)

    if (bookingsError) {
        return NextResponse.json({ error: bookingsError.message }, { status: 500 })
    }

    const bookedRoomIds = new Set(bookings.map(b => b.room_id))

    // Filter out maintenance rooms too
    const availableRooms = rooms.filter(r => !bookedRoomIds.has(r.id) && r.status !== 'maintenance')

    return NextResponse.json(availableRooms)
}
