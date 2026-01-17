
import { createClient } from '@/lib/supabase/server'
import { BookingCalendar } from '@/components/calendar/BookingCalendar'
import { SyncButton } from '@/components/admin/SyncButton'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
    const supabase = await createClient()

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, rooms(room_number, room_type)')

    if (error) {
        console.error('Error fetching bookings:', error)
        return <div className="p-8">Error loading calendar: {error.message}</div>
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">訂房日曆</h2>
                <div className="flex items-center space-x-2">
                    <SyncButton />
                </div>
            </div>
            <div className="h-full">
                <BookingCalendar bookings={bookings as any} />
            </div>
        </div>
    )
}
