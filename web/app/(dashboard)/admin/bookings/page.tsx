
import { createClient } from '@/lib/supabase/server'
import { BookingClient } from './booking-client'

export const dynamic = 'force-dynamic'

export default async function BookingsPage() {
    const supabase = await createClient()

    // Fetch Bookings with Room info
    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, rooms(room_number, room_type)')
        .order('check_in_date', { ascending: false })
        .limit(100) // Simple limit for now

    // Fetch Rooms for the dropdown
    const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number')

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">訂單管理</h2>
            </div>
            <BookingClient
                initialBookings={bookings as any || []}
                rooms={rooms as any || []}
            />
        </div>
    )
}
