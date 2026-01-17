
import { createClient } from '@/lib/supabase/server'
import { TaskClient } from './task-client'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
    const supabase = await createClient()

    // Fetch only 'completed' tasks (waiting for verification)
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, rooms(room_number), profiles(full_name)')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">房務審核</h2>
            </div>
            <TaskClient initialTasks={tasks as any || []} />
        </div>
    )
}
