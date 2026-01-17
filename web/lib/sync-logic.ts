import { SupabaseClient } from '@supabase/supabase-js'
import { formatInTimeZone } from 'date-fns-tz'
import ICAL from 'ical.js'
import { Room } from '@/types'

const TIMEZONE = 'Asia/Taipei'

export interface SyncResult {
    processed: number
    inserted: number
    updated: number
    errors: string[]
}

export async function processRoomSync(
    supabase: SupabaseClient,
    room: Room,
    platform: 'booking' | 'agoda',
    url: string,
    fetchImpl: (url: string) => Promise<Response> = fetch
): Promise<SyncResult> {
    const results: SyncResult = { processed: 0, inserted: 0, updated: 0, errors: [] }

    try {
        const response = await fetchImpl(url)
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.statusText}`)
        }
        const text = await response.text()

        const jcalData = ICAL.parse(text)
        const comp = new ICAL.Component(jcalData)
        const vevents = comp.getAllSubcomponents('vevent')

        for (const vevent of vevents) {
            const event = new ICAL.Event(vevent)
            const uid = event.uid
            const summary = event.summary || 'Google 行程'

            const start = event.startDate.toJSDate()
            const end = event.endDate.toJSDate()

            const checkIn = formatInTimeZone(new Date(start), TIMEZONE, 'yyyy-MM-dd')
            const checkOut = formatInTimeZone(new Date(end), TIMEZONE, 'yyyy-MM-dd')

            // Check if existing booking exists by original_uid
            const { data: existing } = await supabase
                .from('bookings')
                .select('id')
                .eq('original_uid', uid)
                .single()

            // Check for conflicts (Overlap)
            const { data: conflicts } = await supabase
                .from('bookings')
                .select('id, guest_name')
                .eq('room_id', room.id)
                .neq('status', 'cancelled')
                .lt('check_in_date', checkOut)
                .gt('check_out_date', checkIn)
                // Exclude self if updating
                .neq('original_uid', uid)

            if (conflicts && conflicts.length > 0) {
                results.errors.push(`衝突: ${summary} (${checkIn}~${checkOut}) 與訂單 ${conflicts[0].guest_name} 重疊`)
                continue // Skip this event
            }

            const bookingData = {
                check_in_date: checkIn,
                check_out_date: checkOut,
                status: 'confirmed',
                guest_name: summary,
                room_id: room.id,
                platform: platform
            }

            if (existing) {
                await supabase.from('bookings').update(bookingData).eq('id', existing.id)
                results.updated++
            } else {
                await supabase.from('bookings').insert({ ...bookingData, original_uid: uid })
                results.inserted++
            }
            results.processed++
        }
    } catch (e: any) {
        results.errors.push(`房間 ${room.room_number || 'Unknown'} 同步失敗: ${e.message}`)
    }
    return results
}
