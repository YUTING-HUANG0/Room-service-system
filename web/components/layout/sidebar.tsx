"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, BedDouble, CalendarDays, ClipboardCheck, LogOut } from "lucide-react"

export function Sidebar() {
    const pathname = usePathname()

    // 根據角色顯示不同選單 (目前先混合顯示，未來可拆分)
    const adminRoutes = [
        {
            label: "總覽",
            icon: LayoutDashboard,
            href: "/admin",
        },
        {
            label: "行事曆",
            icon: CalendarDays,
            href: "/admin/calendar",
        },
        {
            label: "房源管理",
            icon: BedDouble,
            href: "/admin/rooms",
        },
        {
            label: "訂單管理",
            icon: CalendarDays,
            href: "/admin/bookings",
        },
        {
            label: "任務審核",
            icon: ClipboardCheck,
            href: "/admin/tasks",
        },
    ]

    const housekeeperRoutes = [
        {
            label: "搶單中心",
            icon: LayoutDashboard,
            href: "/housekeeper"
        },
        {
            label: "我的任務",
            icon: ClipboardCheck,
            href: "/housekeeper/tasks"
        }
    ]

    const isHousekeeper = pathname.includes('housekeeper')
    const routes = isHousekeeper ? housekeeperRoutes : adminRoutes

    return (
        <div className="flex h-full w-[250px] flex-col border-r bg-background">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <BedDouble className="h-6 w-6" />
                    <span className="">房務中控</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {routes.map((route, index) => (
                        <Link
                            key={index}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === route.href
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <route.icon className="h-4 w-4" />
                            {route.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t">
                <Link href="/auth/login">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                        <LogOut className="h-4 w-4" />
                        登出
                    </Button>
                </Link>
            </div>
        </div>
    )
}
