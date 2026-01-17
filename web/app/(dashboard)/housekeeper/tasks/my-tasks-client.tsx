'use client'

import { useState, useRef } from 'react'
import { Task } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface MyTasksClientProps {
    initialTasks: Task[]
}

export function MyTasksClient({ initialTasks }: MyTasksClientProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedTask, setSelectedTask] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Handler to trigger hidden file input
    const handleUploadClick = (taskId: string) => {
        setSelectedTask(taskId)
        fileInputRef.current?.click()
    }

    // Handle File Change
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedTask) return

        setLoadingId(selectedTask)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedTask}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('tasks')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Update Task with Photo URL
            const { error: updateError } = await supabase
                .from('tasks')
                .update({ image_url: filePath })
                .eq('id', selectedTask)

            if (updateError) throw updateError

            // Refresh State
            setTasks(prev => prev.map(t =>
                t.id === selectedTask ? { ...t, image_url: filePath } : t
            ))
            alert('照片上傳成功！')

        } catch (e: any) {
            alert('上傳失敗: ' + e.message)
        } finally {
            setLoadingId(null)
            e.target.value = '' // Reset input
        }
    }

    const handleComplete = async (task: Task) => {
        if (!task.image_url) return alert('請先上傳完成照片')
        if (!confirm('確認已完成清掃並送出審核？')) return

        setLoadingId(task.id)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', task.id)

            if (error) throw error

            setTasks(prev => prev.filter(t => t.id !== task.id))
            alert('提交成功！等待老闆審核。')
            router.refresh()

        } catch (e: any) {
            alert('提交失敗: ' + e.message)
        } finally {
            setLoadingId(null)
        }
    }

    // Helper to get image URL for preview (simple public URL)
    const getPublicUrl = (path: string | undefined) => {
        if (!path) return ''
        if (path.startsWith('http')) return path // Already full URL
        const { data } = supabase.storage.from('tasks').getPublicUrl(path)
        return data.publicUrl
    }

    if (tasks.length === 0) {
        return <div className="text-gray-500 mt-10">目前沒有進行中的任務。去搶單大廳看看吧！</div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {tasks.map(task => (
                <Card key={task.id} className="border-l-4 border-l-orange-500 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <span>房號: {task.rooms?.room_number}</span>
                            <span className="text-sm font-normal text-gray-500">{task.scheduled_date}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-gray-50">
                            {task.image_url ? (
                                <Image
                                    src={getPublicUrl(task.image_url)}
                                    alt="Proof"
                                    fill
                                    className="object-contain rounded-md"
                                    unoptimized
                                />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Upload className="h-10 w-10 mx-auto mb-2" />
                                    <p className="text-sm">尚未上傳照片</p>
                                </div>
                            )}
                        </div>
                        {task.image_url && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleUploadClick(task.id)}
                            >
                                重傳照片
                            </Button>
                        )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        {!task.image_url && (
                            <Button
                                className="flex-1"
                                variant="secondary"
                                onClick={() => handleUploadClick(task.id)}
                                disabled={loadingId === task.id}
                            >
                                {loadingId === task.id ? <Loader2 className="animate-spin" /> : '上傳照片'}
                            </Button>
                        )}
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleComplete(task)}
                            disabled={loadingId === task.id || !task.image_url}
                        >
                            {loadingId === task.id ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" /> 完成任務
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
