import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { processRoomSync } from '@/lib/sync-logic'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const supabase = await createClient()

    // 1. 抓取房間資料
    const { data: rooms, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .or('ical_booking_url.neq.null,ical_agoda_url.neq.null')

    if (roomError) return NextResponse.json({ error: roomError.message }, { status: 500 })

    const totalResults = { processed: 0, inserted: 0, updated: 0, errors: [] as string[] }

    for (const room of rooms) {
        if (room.ical_booking_url) {
            const res = await processRoomSync(supabase, room, 'booking', room.ical_booking_url)
            totalResults.processed += res.processed
            totalResults.inserted += res.inserted
            totalResults.updated += res.updated
            totalResults.errors.push(...res.errors)
        }
        if (room.ical_agoda_url) {
            const res = await processRoomSync(supabase, room, 'agoda', room.ical_agoda_url)
            totalResults.processed += res.processed
            totalResults.inserted += res.inserted
            totalResults.updated += res.updated
            totalResults.errors.push(...res.errors)
        }
    }

    return NextResponse.json({ message: '同步完成', results: totalResults })
}