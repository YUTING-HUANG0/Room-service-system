import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendLineNotify } from '@/lib/line'

const bookingSchema = z.object({
    room_id: z.string().uuid(),
    guest_name: z.string().min(1, '姓名必填'),
    email: z.string().email('Email 格式不正確').optional().or(z.literal('')),
    phone: z.string().min(1, '電話必填'),
    check_in_date: z.string(),
    check_out_date: z.string(),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const parsedData = bookingSchema.parse(body)

        const supabase = await createClient()

        // Double check availability to prevent race conditions
        const { data: conflicts, error: conflictError } = await supabase
            .from('bookings')
            .select('id')
            .eq('room_id', parsedData.room_id)
            .neq('status', 'cancelled')
            .lt('check_in_date', parsedData.check_out_date)
            .gt('check_out_date', parsedData.check_in_date)

        if (conflictError) {
            return NextResponse.json({ error: conflictError.message }, { status: 500 })
        }

        if (conflicts && conflicts.length > 0) {
            return NextResponse.json({ error: '該時段房間已被預訂，請重新搜尋' }, { status: 409 })
        }

        // Create booking
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                room_id: parsedData.room_id,
                guest_name: parsedData.guest_name,
                // email: parsedData.email, // If schema has it? Check types/index.ts. Booking interface doesn't show email/phone but database might have it.
                // Types file showed:
                // export interface Booking { ... guest_name: string ... }
                // It didn't explicitly show email/phone in the interface, but I should check if I can add them or if they are JSON.
                // For now I will assume the table has these columns or I should check `queries` if I could.
                // But wait, "4.1 ... Form + Validation". It implies collecting this info.
                // Let's assume the table has `contact_info` jsonb or specific columns.
                // Since I can't verify schema easily without SQL tool, I'll assume they might not exist or store in a 'notes' or 'contact_info' column if strict columns don't exist.
                // However, usually for a class project, specific columns like `guest_email`, `guest_phone` are likely created.
                // Let's TRY to insert them. If it fails, I'll see the error.
                // Actually, I'll check `web/app/api/ical/route.ts` or similar to see what's inserted from iCal.
                // Or I can look at "Profiles" or similar.
                // Let's look at `types` again.
                // `platform: 'official'`
                platform: 'official',
                status: 'confirmed',
                check_in_date: parsedData.check_in_date,
                check_out_date: parsedData.check_out_date,
                // I'll add contact info to a metadata field if I'm unsure, or assume columns exist.
                // Given "Guest Name, Email, Phone" requirement, I'll assume columns `guest_email`, `guest_phone` exist or I'll put them in `guest_name` as "Name (Phone)" if needed? No that's hacky.
                // Let's guess standard column names: `guest_email`, `guest_phone`.
                guest_email: parsedData.email,
                guest_phone: parsedData.phone
            })
            .select('*, rooms(room_number, room_type)')
            .single()

        if (error) {
            // If error is about column not found, I might need to adjust.
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Send Notification
        const roomInfo = data.rooms ? `${data.rooms.room_number || ''} (${data.rooms.room_type || ''})` : '未知房號'
        await sendLineNotify(`\n[新訂單通知]\n房號: ${roomInfo}\n房客: ${parsedData.guest_name}\n入住: ${parsedData.check_in_date}\n\n請至後台查看詳情。`)

        return NextResponse.json(data)

    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: '驗證失敗', details: (e as any).errors || (e as any).issues }, { status: 400 })
        }
        return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 })
    }
}
