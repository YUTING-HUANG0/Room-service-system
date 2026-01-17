
import { MyTasks } from './my-tasks'
import { AvailableTasks } from './available-tasks'

export default function HousekeeperDashboardPage() {
    return (
        <div className="flex flex-col gap-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">房務員中心</h2>
            <p className="text-muted-foreground">即時搶單，多勞多得。</p>

            <div className="mt-2">
                <MyTasks />
            </div>

            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">搶單大廳 (Realtime)</h3>
                <AvailableTasks />
            </div>
        </div>
    )
}
