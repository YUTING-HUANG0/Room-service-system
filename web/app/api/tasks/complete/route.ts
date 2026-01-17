import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendLineNotify } from '@/lib/line'
import { z } from 'zod'

const schema = z.object({
    taskId: z.string().uuid(),
    imageUrl: z.string().url()
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { taskId, imageUrl } = schema.parse(body)

        const supabase = await createClient()

        // Update task status
        const { data: task, error } = await supabase
            .from('tasks')
            .update({
                status: 'completed',
                image_url: imageUrl,
                completed_at: new Date().toISOString()
            })
            .eq('id', taskId)
            .select('*, rooms(room_number)')
            .single()

        if (error) throw error

        // Get housekeeper name
        // Since we can't always rely on complex joins if not configured, let's fetch profile separately if needed or just use ID or generic message.
        // Or assume join works if FK exists. Let's try separate fetch to be safe if join fails? 
        // Actually, let's just use "房務員 (ID...)" if name missing, or try to join.
        // But for simplicity in this turn, I'll send basic info.

        const roomNumber = task.rooms?.room_number || '未知'

        // Try to get user name
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', task.housekeeper_id).single()
        const housekeeperName = profile?.full_name || '房務員'

        await sendLineNotify(`\n[任務完成報告]\n房號: ${roomNumber}\n執行人員: ${housekeeperName}\n\n照片已上傳，請管理員進行驗收。`)

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('Task Complete Error:', e)
        return NextResponse.json({ error: e.message || 'Update failed' }, { status: 500 })
    }
}
