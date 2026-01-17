
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, ClipboardList, AlertCircle, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatInTimeZone } from 'date-fns-tz'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const supabase = await createClient()
    const today = formatInTimeZone(new Date(), 'Asia/Taipei', 'yyyy-MM-dd')

    // 1. Today's Check-ins
    const { data: checkIns } = await supabase
        .from('bookings')
        .select('*, rooms(room_number)')
        .eq('check_in_date', today)
        .neq('status', 'cancelled')

    // 2. Today's Check-outs
    const { data: checkOuts } = await supabase
        .from('bookings')
        .select('*, rooms(room_number)')
        .eq('check_out_date', today)
        .neq('status', 'cancelled')

    // 3. Pending Tasks (Housekeeper completed, Boss needs to verify)
    const { count: pendingTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

    // 4. Maintenance Rooms
    const { count: maintenanceCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'maintenance')

    return (
        <div className="flex flex-col gap-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">老闆中控台</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">今日入住</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{checkIns?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {checkIns?.length ? `房號: ${checkIns.map(b => b.rooms?.room_number).join(', ')}` : '今日無入住'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">今日退房</CardTitle>
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{checkOuts?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {checkOuts?.length ? `房號: ${checkOuts.map(b => b.rooms?.room_number).join(', ')}` : '今日無退房'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">待審核任務</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingTasksCount || 0}</div>
                        <p className="text-xs text-muted-foreground">需要老闆驗收照片</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">維修中房源</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{maintenanceCount || 0}</div>
                        <p className="text-xs text-muted-foreground">暫停販售</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
