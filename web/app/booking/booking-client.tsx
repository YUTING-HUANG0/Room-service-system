'use client'

import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { addDays, format, differenceInDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
    Calendar as CalendarIcon,
    Search,
    BedDouble,
    Loader2,
    CheckCircle,
    MapPin,
    AlertCircle
} from 'lucide-react'
import { Room } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

export default function BookingClient() {
    const { toast } = useToast()

    // Search State
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 1),
    })
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [availableRooms, setAvailableRooms] = useState<Room[]>([])

    // Booking Form State
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const [bookingLoading, setBookingLoading] = useState(false)

    // Form Fields
    const [formData, setFormData] = useState({
        guest_name: '',
        email: '',
        phone: ''
    })

    const handleSearch = async () => {
        if (!date?.from || !date?.to) {
            toast({
                variant: 'destructive',
                title: '請選擇日期',
                description: '入住與退房日期皆需選擇',
            })
            return
        }

        setLoading(true)
        setSearched(false)
        try {
            const fromStr = format(date.from, 'yyyy-MM-dd')
            const toStr = format(date.to, 'yyyy-MM-dd')

            const res = await fetch(`/api/availability?from=${fromStr}&to=${toStr}`)
            if (!res.ok) throw new Error('查詢失敗')

            const data = await res.json()
            setAvailableRooms(data)
            setSearched(true)
        } catch (error) {
            console.error(error)
            toast({
                variant: 'destructive',
                title: '發生錯誤',
                description: '無法查詢空房，請稍後再試',
            })
        } finally {
            setLoading(false)
        }
    }

    const openBooking = (room: Room) => {
        setSelectedRoom(room)
        setIsBookingOpen(true)
    }

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRoom || !date?.from || !date?.to) return

        setBookingLoading(true)
        try {
            const payload = {
                room_id: selectedRoom.id,
                check_in_date: format(date.from, 'yyyy-MM-dd'),
                check_out_date: format(date.to, 'yyyy-MM-dd'),
                guest_name: formData.guest_name,
                email: formData.email,
                phone: formData.phone
            }

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const result = await res.json()

            if (!res.ok) {
                throw new Error(result.error || '預訂失敗')
            }

            setIsBookingOpen(false)
            toast({
                title: '預訂成功！',
                description: `您的訂單已確認。房號：${result.rooms?.room_number || selectedRoom.room_number}`,
                className: "bg-green-500 text-white"
            })

            // Clean up
            setFormData({ guest_name: '', email: '', phone: '' })
            setSearched(false) // Reset to force re-search or clean view
            setAvailableRooms([]) // Clear results

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '預訂失敗',
                description: error.message,
            })
        } finally {
            setBookingLoading(false)
        }
    }

    const daysCount = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        預約您的美好假期
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl">
                        探索舒適房型，享受極致住宿體驗
                    </p>
                </div>
            </div>

            {/* Search Container */}
            <div className="max-w-5xl mx-auto px-4 -mt-8">
                <Card className="shadow-lg border-0 ring-1 ring-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                            <div className="flex-1 w-full relative">
                                <Label className="mb-2 block text-xs text-muted-foreground uppercase tracking-wider font-semibold">入住 - 退房日期</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-12 text-base",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                            {date?.from ? (
                                                date.to ? (
                                                    <>
                                                        {format(date.from, "yyyy/MM/dd")} -{" "}
                                                        {format(date.to, "yyyy/MM/dd")}
                                                        <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                                            {daysCount} 晚
                                                        </span>
                                                    </>
                                                ) : (
                                                    format(date.from, "yyyy/MM/dd")
                                                )
                                            ) : (
                                                <span>選擇日期</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from}
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={2}
                                            locale={zhTW}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="w-full md:w-auto mt-6 md:mt-0">
                                <Button
                                    size="lg"
                                    className="w-full md:w-auto h-12 px-8 text-base shadow-md transition-all hover:scale-105 active:scale-95"
                                    onClick={handleSearch}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                                    搜尋空房
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Results Section */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                {searched && availableRooms.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                        <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-xl font-medium text-slate-900">暫無空房</h3>
                        <p className="text-slate-500 mt-2">很抱歉，所選日期已無可用房源，請嘗試其他日期。</p>
                    </div>
                )}

                {availableRooms.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableRooms.map((room) => (
                            <Card key={room.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                                <div className="aspect-video bg-slate-100 relative flex items-center justify-center">
                                    <BedDouble className="h-16 w-16 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>{room.room_type}</span>
                                        <span className="text-sm font-normal px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                                            {room.room_number}號房
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" /> 立即確認
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex justify-between">
                                            <span>入住日期</span>
                                            <span className="font-medium text-slate-900">{date?.from && format(date.from, 'MM/dd')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>退房日期</span>
                                            <span className="font-medium text-slate-900">{date?.to && format(date.to, 'MM/dd')}</span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-end">
                                            <span>總價 ({daysCount} 晚)</span>
                                            {/* Dummy Price Logic: Room Number * 100 + 2000 per night */}
                                            <span className="text-xl font-bold text-primary">
                                                NT$ {(2000 + (parseInt(room.room_number.replace(/\D/g, '')) || 0) * 10) * daysCount}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => openBooking(room)}>
                                        立即預訂
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Dialog */}
            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>預訂資料確認</DialogTitle>
                        <DialogDescription>
                            請填寫您的聯絡資訊以完成預訂
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleBookingSubmit} className="space-y-6 pt-4">
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm border">
                            <h4 className="font-medium flex items-center gap-2">
                                <BedDouble className="h-4 w-4" /> {selectedRoom?.room_type} ({selectedRoom?.room_number})
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-slate-500">
                                <div>入住: {date?.from && format(date.from, 'yyyy/MM/dd')}</div>
                                <div>退房: {date?.to && format(date.to, 'yyyy/MM/dd')}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">訂房人姓名 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="王小明"
                                    required
                                    value={formData.guest_name}
                                    onChange={e => setFormData({ ...formData, guest_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">手機號碼 <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="phone"
                                        placeholder="0912345678"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)}>取消</Button>
                            <Button type="submit" disabled={bookingLoading}>
                                {bookingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                確認預訂
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
