import { createClient } from '@/lib/supabase/server'
import AdminCalendarClient from './client'

export const dynamic = 'force-dynamic'

export default async function AdminCalendarPage() {
    const supabase = await createClient()

    // Fetch Bookings
    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, rooms(room_number, room_type)')
        .neq('status', 'cancelled')

    // Fetch Tasks
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, rooms(room_number, room_type)')

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">行事曆總覽</h2>
            </div>
            <AdminCalendarClient bookings={bookings as any || []} tasks={tasks as any || []} />
        </div>
    )
}
