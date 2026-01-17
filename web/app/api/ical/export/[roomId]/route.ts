
import { createClient } from '@/lib/supabase/server'
import iCalGenerator from 'ical-generator'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const roomId = (await params).roomId
    const supabase = await createClient()

    // 1. Get Room Info
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('room_number, room_type')
        .eq('id', roomId)
        .single()

    if (roomError || !room) {
        return new Response('Room not found', { status: 404 })
    }

    // 2. Get Bookings
    const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .neq('status', 'cancelled')

    if (bookingError) {
        return new Response('Error fetching bookings', { status: 500 })
    }

    // 3. Generate Calendar
    const calendar = iCalGenerator({
        name: `Room ${room.room_number} - Bookings`,
        timezone: 'Asia/Taipei'
    })

    bookings?.forEach(booking => {
        calendar.createEvent({
            start: new Date(booking.check_in_date),
            end: new Date(booking.check_out_date),
            summary: '已預訂', // Protect guest privacy for external sync
            description: `Platform: ${booking.platform}`,
            id: booking.id, // Use our DB ID as UID
            allDay: true
        })
    })

    return new Response(calendar.toString(), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="room-${room.room_number}.ics"`
        }
    })
}
