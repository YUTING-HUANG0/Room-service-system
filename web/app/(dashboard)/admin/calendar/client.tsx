"use client"

import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import { zhTW } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Booking, Task } from '@/types'

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

interface AdminCalendarProps {
    bookings: Booking[]
    tasks: Task[]
}

export default function AdminCalendarClient({ bookings, tasks }: AdminCalendarProps) {

    // Transform Bookings to Events
    const bookingEvents = bookings.map(b => ({
        id: b.id,
        title: `${b.rooms?.room_number || 'Unknown'} - ${b.guest_name} (${b.status})`,
        start: new Date(b.check_in_date),
        end: new Date(b.check_out_date), // Note: BigCalendar end date is exclusive for all-day? Need to check.
        allDay: true,
        resource: b,
        type: 'booking'
    }))

    // Transform Tasks to Events
    const taskEvents = tasks.map(t => ({
        id: t.id,
        title: `🧹 房務: ${t.rooms?.room_number} (${t.status})`,
        start: new Date(t.scheduled_date),
        end: new Date(t.scheduled_date),
        allDay: true,
        resource: t,
        type: 'task'
    }))

    const events = [...bookingEvents, ...taskEvents]

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3174ad'
        if (event.type === 'task') {
            backgroundColor = '#d97706' // Amber for tasks
            if (event.resource.status === 'completed') backgroundColor = '#16a34a' // Green
        } else {
            // Booking
            if (event.resource.status === 'cancelled') backgroundColor = '#ef4444'
            if (event.resource.status === 'checked_in') backgroundColor = '#2563eb'
        }
        return {
            style: {
                backgroundColor
            }
        }
    }

    return (
        <div className="h-[600px] mt-4 bg-white p-4 rounded-lg shadow">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'agenda']}
                defaultView="month"
                culture="zh-TW"
                eventPropGetter={eventStyleGetter}
                messages={{
                    next: "下個月",
                    previous: "上個月",
                    today: "今天",
                    month: "月",
                    week: "週",
                    day: "日",
                    agenda: "議程"
                }}
            />
        </div>
    )
}
