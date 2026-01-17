
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { formatInTimeZone } from 'date-fns-tz'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    const supabase = await createClient()
    const today = formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyy-MM-dd')

    // Optional: Allow generating for a specific date range if payload provided
    // const body = await request.json().catch(() => ({}))

    // Logic: Find confirmed bookings checking out TODAY that don't have a task yet

    // 1. Get Bookings checking out today
    const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        // .eq('check_out_date', today)
        .neq('status', 'cancelled')

    if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 })

    if (!bookings || bookings.length === 0) {
        return NextResponse.json({ message: 'No bookings checking out today', count: 0 })
    }

    let createdCount = 0
    let errors = []

    for (const booking of bookings) {
        // 2. Check if task exists
        const { data: existingTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('booking_id', booking.id)
            .single()

        if (!existingTask) {
            // 3. Create Task
            const { error: insertError } = await supabase
                .from('tasks')
                .insert({
                    booking_id: booking.id,
                    room_id: booking.room_id,
                    status: 'pending',
                    scheduled_date: today
                })

            if (insertError) {
                errors.push(`Failed to create task for booking ${booking.id}: ${insertError.message}`)
            } else {
                // Also update room status to 'dirty'
                await supabase.from('rooms').update({ status: 'dirty' }).eq('id', booking.room_id)
                createdCount++
            }
        }
    }

    return NextResponse.json({
        message: 'Task generation complete',
        created: createdCount,
        errors
    })
}
