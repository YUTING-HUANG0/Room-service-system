'use client'

import { useState } from 'react'
import { Task } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface TaskClientProps {
    initialTasks: Task[]
}

export function TaskClient({ initialTasks }: TaskClientProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleVerify = async (task: Task) => {
        setLoading(task.id)
        try {
            // 1. Update Task Status
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'verified' })
                .eq('id', task.id)

            if (error) throw error

            // 2. Automatically set Room to 'clean'
            // NOTE: If task verification automatically implies room is clean
            // If the user wants separate flow, remove this.
            // But usually Cleaned -> Verified = Room Ready (Clean)
            await supabase
                .from('rooms')
                .update({ status: 'clean' })
                .eq('id', task.room_id)

            setTasks(tasks.filter(t => t.id !== task.id))
            router.refresh()
        } catch (e: any) {
            alert('驗收失敗: ' + e.message)
        } finally {
            setLoading(null)
        }
    }

    const handleReject = async (task: Task) => {
        if (!confirm('確定要退回此任務？房務員需重新提交。')) return
        setLoading(task.id)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'pending', image_url: null }) // Reset to pending and clear photo
                .eq('id', task.id)

            if (error) throw error

            setTasks(tasks.filter(t => t.id !== task.id))
            router.refresh()
        } catch (e: any) {
            alert('退回失敗: ' + e.message)
        } finally {
            setLoading(null)
        }
    }

    const getPublicUrl = (path: string | undefined) => {
        if (!path) return ''
        if (path.startsWith('http')) return path
        // Use 'tasks' bucket
        const { data } = supabase.storage.from('tasks').getPublicUrl(path)
        return data.publicUrl
    }

    if (tasks.length === 0) {
        return <div className="text-center text-gray-500 mt-10">目前沒有待審核的任務</div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
                <Card key={task.id}>
                    <CardHeader>
                        <CardTitle>房號: {task.rooms?.room_number}</CardTitle>
                        <p className="text-sm text-muted-foreground">房務員: {task.profiles?.full_name || '未知'}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="relative h-48 w-full bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                            {task.image_url ? (
                                <Image
                                    src={getPublicUrl(task.image_url)}
                                    alt="Cleaning"
                                    fill
                                    className="object-cover"
                                    unoptimized // For simplicity with Supabase storage domains
                                />
                            ) : (
                                <span className="text-gray-400">無照片</span>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleReject(task)}
                            disabled={loading === task.id}
                        >
                            <XCircle className="mr-2 h-4 w-4" /> 退回
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleVerify(task)}
                            disabled={loading === task.id}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> 驗收通過
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
