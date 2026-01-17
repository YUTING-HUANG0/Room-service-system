'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function AvailableTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const supabase = createClient()
    // const { toast } = useToast() // Assuming toast hook exists or allow alert

    const fetchTasks = async () => {
        const { data } = await supabase
            .from('tasks')
            .select('*, rooms(room_number, room_type)')
            .eq('status', 'pending')
            .is('housekeeper_id', null)
            .order('created_at', { ascending: false })

        if (data) setTasks(data as any)
    }

    useEffect(() => {
        fetchTasks()

        // Realtime Subscription
        const channel = supabase
            .channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                console.log('Change received!', payload)
                fetchTasks() // Refresh list on any change
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleGrab = async (taskId: string) => {
        setLoadingId(taskId)
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return alert('請先登入')

            const { error } = await supabase
                .from('tasks')
                .update({
                    housekeeper_id: user.id,
                    status: 'accepted'
                })
                .eq('id', taskId)
                .is('housekeeper_id', null) // Double check availability (concurrency)

            if (error) throw error

            // Optimistic update handled by realtime subscription usually, but let's manual too
            setTasks(prev => prev.filter(t => t.id !== taskId))
            alert('搶單成功！請至「我的任務」查看。')

        } catch (e: any) {
            alert('搶單失敗: ' + e.message)
            fetchTasks() // Refresh in case it was taken
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.length === 0 && <div className="col-span-full text-center text-muted-foreground p-10">目前沒有待接任務</div>}

            {tasks.map(task => (
                <Card key={task.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>房號: {task.rooms?.room_number}</span>
                            <Badge variant="secondary">{task.rooms?.room_type}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">日期: {task.scheduled_date}</p>
                        <p className="text-sm text-gray-500">狀態: <span className="text-blue-600 font-bold">待接單</span></p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleGrab(task.id)}
                            disabled={loadingId === task.id}
                        >
                            {loadingId === task.id ? <Loader2 className="animate-spin" /> : '立即搶單'}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
