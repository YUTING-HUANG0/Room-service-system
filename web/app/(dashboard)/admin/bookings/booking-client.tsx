'use client'

import { useState } from 'react'
import { Booking, Room } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface BookingClientProps {
    initialBookings: Booking[]
    rooms: Room[]
}

export function BookingClient({ initialBookings, rooms }: BookingClientProps) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings)
    const [isOpen, setIsOpen] = useState(false)
    const [editingBooking, setEditingBooking] = useState<Partial<Booking> | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleOpenCreate = () => {
        setEditingBooking({
            status: 'confirmed',
            platform: 'walk-in',
            check_in_date: format(new Date(), 'yyyy-MM-dd'),
            check_out_date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
        })
        setIsOpen(true)
    }

    const handleEdit = (booking: Booking) => {
        setEditingBooking(booking)
        setIsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此訂單嗎？')) return

        const { error } = await supabase.from('bookings').delete().eq('id', id)
        if (error) {
            alert('刪除失敗: ' + error.message)
        } else {
            setBookings(bookings.filter(b => b.id !== id))
            router.refresh()
        }
    }

    const handleSave = async () => {
        if (!editingBooking?.guest_name || !editingBooking.room_id) return alert('客人姓名與房號必填')

        setLoading(true)
        try {
            const dataToSave = {
                guest_name: editingBooking.guest_name,
                room_id: editingBooking.room_id,
                check_in_date: editingBooking.check_in_date,
                check_out_date: editingBooking.check_out_date,
                platform: editingBooking.platform || 'walk-in',
                status: editingBooking.status || 'confirmed'
            }

            if (editingBooking.id) {
                // Update
                const { error } = await supabase
                    .from('bookings')
                    .update(dataToSave)
                    .eq('id', editingBooking.id)

                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase
                    .from('bookings')
                    .insert(dataToSave)

                if (error) throw error
            }

            router.refresh()
            setIsOpen(false)
            // Re-fetch to sort and show proper room number
            const { data } = await supabase
                .from('bookings')
                .select('*, rooms(room_number, room_type)')
                .order('check_in_date', { ascending: false })
            if (data) setBookings(data as any)

        } catch (e: any) {
            alert('儲存失敗: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">訂單列表</h2>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" /> 建立訂單
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>房號</TableHead>
                            <TableHead>客人姓名</TableHead>
                            <TableHead>入住日期</TableHead>
                            <TableHead>退房日期</TableHead>
                            <TableHead>來源</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead>操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium">{booking.rooms?.room_number || '未知'}</TableCell>
                                <TableCell>{booking.guest_name}</TableCell>
                                <TableCell>{booking.check_in_date}</TableCell>
                                <TableCell>{booking.check_out_date}</TableCell>
                                <TableCell>{booking.platform}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                booking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(booking)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(booking.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingBooking?.id ? '編輯訂單' : '建立訂單'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="guest_name" className="text-right">客人姓名</Label>
                            <Input
                                id="guest_name"
                                value={editingBooking?.guest_name || ''}
                                onChange={(e) => setEditingBooking({ ...editingBooking, guest_name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room_id" className="text-right">房間</Label>
                            <Select
                                value={editingBooking?.room_id || ''}
                                onValueChange={(val) => setEditingBooking({ ...editingBooking, room_id: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="選擇房間" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map(room => (
                                        <SelectItem key={room.id} value={room.id}>{room.room_number} ({room.room_type})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="check_in" className="text-right">入住日</Label>
                            <Input
                                id="check_in"
                                type="date"
                                value={editingBooking?.check_in_date || ''}
                                onChange={(e) => setEditingBooking({ ...editingBooking, check_in_date: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="check_out" className="text-right">退房日</Label>
                            <Input
                                id="check_out"
                                type="date"
                                value={editingBooking?.check_out_date || ''}
                                onChange={(e) => setEditingBooking({ ...editingBooking, check_out_date: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="platform" className="text-right">來源</Label>
                            <Select
                                value={editingBooking?.platform || 'walk-in'}
                                onValueChange={(val: any) => setEditingBooking({ ...editingBooking, platform: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="選擇來源" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="walk-in">Walk-in (現場)</SelectItem>
                                    <SelectItem value="official">官網</SelectItem>
                                    <SelectItem value="booking">Booking.com</SelectItem>
                                    <SelectItem value="agoda">Agoda</SelectItem>
                                    <SelectItem value="other">其他</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">狀態</Label>
                            <Select
                                value={editingBooking?.status || 'confirmed'}
                                onValueChange={(val: any) => setEditingBooking({ ...editingBooking, status: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="選擇狀態" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="confirmed">已確認 (Confirmed)</SelectItem>
                                    <SelectItem value="checked_in">已入住 (Checked In)</SelectItem>
                                    <SelectItem value="checked_out">已退房 (Checked Out)</SelectItem>
                                    <SelectItem value="cancelled">取消 (Cancelled)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? '儲存中...' : '儲存'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
