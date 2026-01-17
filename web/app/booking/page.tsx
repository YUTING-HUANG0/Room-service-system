import { Metadata } from 'next'
import BookingClient from './booking-client'

export const metadata: Metadata = {
    title: '線上訂房 | 房務系統',
    description: '查詢空房並立即預訂您的住宿',
}

export default function BookingPage() {
    return <BookingClient />
}
