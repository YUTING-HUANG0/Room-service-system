
import { createClient } from '@/lib/supabase/server'
import { MyTasksClient } from './my-tasks-client'

export const dynamic = 'force-dynamic'

export default async function MyTasksPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>請先登入</div>
    }

    // Fetch tasks assigned to current user that are active (accepted, pending maybe if auto-assigned)
    // Ignoring 'completed' or 'verified' as they are done from HK perspective
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, rooms(room_number, room_type)')
        .eq('housekeeper_id', user.id)
        .in('status', ['accepted', 'pending'])
        .order('created_at', { ascending: false })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">我的任務</h2>
            </div>
            <MyTasksClient initialTasks={tasks as any || []} />
        </div>
    )
}
