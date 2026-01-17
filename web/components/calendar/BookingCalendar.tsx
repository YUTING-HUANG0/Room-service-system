'use client'

import { useState } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Booking } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const locales = {
    'zh-TW': zhTW,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface BookingCalendarProps {
    bookings: Booking[]
}

interface CalendarEvent {
    id: string
    title: string
    start: Date
    end: Date
    resource?: Booking
    allDay?: boolean
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
    const [view, setView] = useState<View>(Views.MONTH)
    const [date, setDate] = useState(new Date())

    // Transform bookings to events
    const events: CalendarEvent[] = bookings.map((booking) => ({
        id: booking.id,
        title: `${booking.guest_name} (${booking.rooms?.room_number || booking.room_id})`,
        start: new Date(booking.check_in_date),
        end: new Date(booking.check_out_date),
        resource: booking,
        allDay: true, // Bookings are usually day-based
    }))

    const eventStyleGetter = (event: CalendarEvent) => {
        // Different colors based on status
        let backgroundColor = '#3174ad'
        const status = event.resource?.status

        switch (status) {
            case 'confirmed':
                backgroundColor = '#2ecc71'
                break
            case 'cancelled':
                backgroundColor = '#e74c3c'
                break
            case 'checked_in':
                backgroundColor = '#3498db'
                break
            case 'checked_out':
                backgroundColor = '#95a5a6'
                break
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
            },
        }
    }

    return (
        <Card className="h-[800px] w-full p-4 shadow-md">
            <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle>訂房日曆</CardTitle>
            </CardHeader>
            <CardContent className="h-[700px] p-0">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    view={view}
                    date={date}
                    onView={(newView) => setView(newView)}
                    onNavigate={(newDate) => setDate(newDate)}
                    culture="zh-TW"
                    eventPropGetter={eventStyleGetter}
                    messages={{
                        next: "下一個",
                        previous: "上一個",
                        today: "今天",
                        month: "月",
                        week: "週",
                        day: "日",
                        agenda: "議程",
                        date: "日期",
                        time: "時間",
                        event: "事件",
                        noEventsInRange: "在此期間沒有訂單",
                    }}
                    onSelectEvent={(event) => {
                        alert(`訂單詳情:\n客人: ${event.resource?.guest_name}\n狀態: ${event.resource?.status}`)
                    }}
                />
            </CardContent>
        </Card>
    )
}
