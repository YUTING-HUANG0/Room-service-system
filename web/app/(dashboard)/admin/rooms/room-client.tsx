'use client'

import { useState } from 'react'
import { Room } from '@/types'
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
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RoomClientProps {
    initialRooms: Room[]
}

export function RoomClient({ initialRooms }: RoomClientProps) {
    const [rooms, setRooms] = useState<Room[]>(initialRooms)
    const [isOpen, setIsOpen] = useState(false)
    const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleOpenPromise = () => {
        setEditingRoom({})
        setIsOpen(true)
    }

    const handleEdit = (room: Room) => {
        setEditingRoom(room)
        setIsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此房源嗎？這將會影響關聯的訂單！')) return

        const { error } = await supabase.from('rooms').delete().eq('id', id)
        if (error) {
            alert('刪除失敗: ' + error.message)
        } else {
            setRooms(rooms.filter(r => r.id !== id))
            router.refresh()
        }
    }

    const handleSave = async () => {
        if (!editingRoom?.room_number) return alert('房號必填')

        setLoading(true)
        try {
            if (editingRoom.id) {
                // Update
                const { error } = await supabase
                    .from('rooms')
                    .update({
                        room_number: editingRoom.room_number,
                        room_type: editingRoom.room_type,
                        status: editingRoom.status,
                        ical_booking_url: editingRoom.ical_booking_url,
                        ical_agoda_url: editingRoom.ical_agoda_url
                    })
                    .eq('id', editingRoom.id)

                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase
                    .from('rooms')
                    .insert({
                        room_number: editingRoom.room_number,
                        room_type: editingRoom.room_type || '雙人房',
                        status: editingRoom.status || 'clean',
                        ical_booking_url: editingRoom.ical_booking_url,
                        ical_agoda_url: editingRoom.ical_agoda_url
                    })

                if (error) throw error
            }

            // Refresh local data (simple way) or re-fetch
            // For now, strict reload to be safe and sync server state
            router.refresh()
            setIsOpen(false)
            // Optimistic update could go here but skipping for simplicity
            const { data } = await supabase.from('rooms').select('*').order('room_number')
            if (data) setRooms(data as Room[])

        } catch (e: any) {
            alert('儲存失敗: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">房源列表</h2>
                <Button onClick={handleOpenPromise}>
                    <Plus className="mr-2 h-4 w-4" /> 新增房源
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>房號</TableHead>
                            <TableHead>房型</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead>iCal 設定</TableHead>
                            <TableHead>操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms.map((room) => (
                            <TableRow key={room.id}>
                                <TableCell className="font-medium">{room.room_number}</TableCell>
                                <TableCell>{room.room_type}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs ${room.status === 'clean' ? 'bg-green-100 text-green-800' :
                                            room.status === 'dirty' ? 'bg-yellow-100 text-yellow-800' :
                                                room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-red-100 text-red-800'
                                        }`}>
                                        {room.status === 'clean' ? '已打掃' :
                                            room.status === 'dirty' ? '未打掃' :
                                                room.status === 'occupied' ? '入住中' : '維修中'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                                    {room.ical_booking_url ? '🔵 Booking ' : ''}
                                    {room.ical_agoda_url ? '🟠 Agoda ' : ''}
                                    {(!room.ical_booking_url && !room.ical_agoda_url) && '無'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(room)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(room.id)}>
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
                        <DialogTitle>{editingRoom?.id ? '編輯房源' : '新增房源'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room_number" className="text-right">房號</Label>
                            <Input
                                id="room_number"
                                value={editingRoom?.room_number || ''}
                                onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room_type" className="text-right">房型</Label>
                            <Input
                                id="room_type"
                                value={editingRoom?.room_type || ''}
                                onChange={(e) => setEditingRoom({ ...editingRoom, room_type: e.target.value })}
                                className="col-span-3"
                                placeholder="例如: 雙人房"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">狀態</Label>
                            <Select
                                value={editingRoom?.status || 'clean'}
                                onValueChange={(val: any) => setEditingRoom({ ...editingRoom, status: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="選擇狀態" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="clean">已打掃 (Clean)</SelectItem>
                                    <SelectItem value="dirty">未打掃 (Dirty)</SelectItem>
                                    <SelectItem value="occupied">入住中 (Occupied)</SelectItem>
                                    <SelectItem value="maintenance">維修中 (Maintenance)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="booking_url" className="text-right">Booking iCal</Label>
                            <Input
                                id="booking_url"
                                value={editingRoom?.ical_booking_url || ''}
                                onChange={(e) => setEditingRoom({ ...editingRoom, ical_booking_url: e.target.value })}
                                className="col-span-3"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="agoda_url" className="text-right">Agoda iCal</Label>
                            <Input
                                id="agoda_url"
                                value={editingRoom?.ical_agoda_url || ''}
                                onChange={(e) => setEditingRoom({ ...editingRoom, ical_agoda_url: e.target.value })}
                                className="col-span-3"
                                placeholder="https://..."
                            />
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
