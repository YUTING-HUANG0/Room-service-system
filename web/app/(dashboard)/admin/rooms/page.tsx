
import { createClient } from '@/lib/supabase/server'
import { RoomClient } from './room-client'

export const dynamic = 'force-dynamic'

export default async function RoomsPage() {
    const supabase = await createClient()
    const { data: rooms } = await supabase.from('rooms').select('*').order('room_number')

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">房源管理</h2>
            </div>
            <RoomClient initialRooms={rooms as any || []} />
        </div>
    )
}
