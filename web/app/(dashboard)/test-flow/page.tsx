'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function TestFlowPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const supabase = createClient()

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`])

    const runTest = async () => {
        setLogs([])
        setLoading(true)
        setCurrentStep(0)

        try {
            // Step 1: Create a test Room
            addLog('Step 1: Creating/Checking Room 999...')
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .upsert({
                    room_number: '999',
                    room_type: 'Test Room',
                    status: 'clean'
                }, { onConflict: 'room_number' })
                .select()
                .single()

            if (roomError) throw new Error(`Room Creation Failed: ${roomError.message}`)
            addLog('✅ Room 999 Ready')
            setCurrentStep(1)

            // Step 2: Create a Booking checking out TODAY
            addLog('Step 2: Creating Test Booking (Checkout Today)...')
            const today = format(new Date(), 'yyyy-MM-dd')
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    room_id: room.id,
                    guest_name: 'Test Flow Bot',
                    check_in_date: today, // Check in today
                    check_out_date: today, // Check out today (IMMEDIATE)
                    platform: 'walk-in',
                    status: 'confirmed'
                })
                .select()
                .single()

            if (bookingError) throw new Error(`Booking Creation Failed: ${bookingError.message}`)
            addLog(`✅ Booking Created (ID: ${booking.id})`)
            setCurrentStep(2)

            // Step 3: Trigger Task Generation API
            addLog('Step 3: Triggering Task Generation API...')
            const res = await fetch('/api/tasks/generate', { method: 'POST' })
            const genData = await res.json()

            if (!res.ok) throw new Error(`API Error: ${genData.error || res.statusText}`)
            addLog(`✅ Task Generation Result: Created ${genData.created} tasks`)
            if (genData.created === 0 && genData.errors.length === 0) addLog('⚠️ No new tasks created (maybe duplicate?)')
            setCurrentStep(3)

            // Step 4: Verify Task Exists
            addLog('Step 4: Verifying Task was created in DB...')
            const { data: task, error: taskError } = await supabase
                .from('tasks')
                .select('*')
                .eq('booking_id', booking.id)
                .single()

            if (taskError || !task) throw new Error('Task not found in DB!')
            addLog(`✅ Task Found (ID: ${task.id}, Status: ${task.status})`)
            setCurrentStep(4)

            addLog('🎉 測試流程前半段 (生成) 成功！後半段 (搶單/執行) 需人工或模擬使用者切換角色。')

        } catch (e: any) {
            addLog(`❌ ERROR: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold">系統流程整合測試 (Integration Test)</h1>
            <p className="text-muted-foreground">此工具將模擬完整訂房流程，從建立測試房間到觸發任務生成。</p>

            <Button onClick={runTest} disabled={loading} size="lg" className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '開始自動化測試'}
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>執行日誌</CardTitle>
                </CardHeader>
                <CardContent className="bg-slate-950 text-green-400 font-mono text-sm p-4 h-64 overflow-auto rounded-b-lg">
                    {logs.length === 0 ? '等待執行...' : logs.map((log, i) => <div key={i}>{log}</div>)}
                </CardContent>
            </Card>

            <div className="text-sm text-gray-500">
                <h3>接下來請手動測試：</h3>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>前往 <strong>房務員中心 (/housekeeper)</strong></li>
                    <li>確認可以看到剛剛生成的任務 (999號房)。</li>
                    <li>點擊「搶單」。</li>
                    <li>上傳一張照片並完成任務。</li>
                    <li>切換回 <strong>老闆中控台 (/admin/tasks)</strong>。</li>
                    <li>驗收該任務。</li>
                </ol>
            </div>
        </div>
    )
}
