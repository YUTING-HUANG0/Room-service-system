'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Camera, Upload } from 'lucide-react'
import { Task } from '@/types'
import Image from 'next/image'

export function MyTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [uploadingId, setUploadingId] = useState<string | null>(null)
    const supabase = createClient()

    const fetchMyTasks = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('tasks')
            .select('*, rooms(room_number)')
            .eq('housekeeper_id', user.id)
            .eq('status', 'accepted') // 只顯示已接單但尚未完工的

        if (data) setTasks(data as any)
    }

    useEffect(() => { fetchMyTasks() }, [])

    const handleUploadAndComplete = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingId(taskId)
        try {
            // 1. 上傳照片到 Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${taskId}-${Math.random()}.${fileExt}`
            const filePath = `task-photos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('tasks') // 確保你的 Supabase 有建立名為 'tasks' 的 bucket
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. 取得公開 URL
            const { data: { publicUrl } } = supabase.storage.from('tasks').getPublicUrl(filePath)

            // 3. 更新資料庫狀態 (一勞永逸：同步更新房間狀態)
            // 3. 更新資料庫狀態 (呼叫 API 以觸發通知)
            const res = await fetch('/api/tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, imageUrl: publicUrl })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || '提交失敗')
            }

            alert('任務完成！已送交管理員審核。')
            fetchMyTasks() // 刷新列表
        } catch (error: any) {
            alert('操作失敗: ' + error.message)
        } finally {
            setUploadingId(null)
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">執行中任務</h3>
            {tasks.length === 0 && <p className="text-muted-foreground">目前沒有進行中的任務</p>}
            {tasks.map(task => (
                <Card key={task.id} className="border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center">
                            <span>房號: {task.rooms?.room_number}</span>
                            <span className="text-sm font-normal text-muted-foreground">{task.scheduled_date}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-yellow-600 font-bold bg-yellow-50 px-2 py-1 rounded">狀態：執行中</span>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => handleUploadAndComplete(task.id, e)}
                                    disabled={uploadingId === task.id}
                                />
                                <Button disabled={uploadingId === task.id} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {uploadingId === task.id ? <Loader2 className="animate-spin" /> : <><Camera className="mr-2 h-4 w-4" /> 拍照上傳</>}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}