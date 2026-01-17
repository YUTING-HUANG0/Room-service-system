import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processRoomSync } from '../lib/sync-logic'
import { Room } from '@/types'

// Mock Data for Booking.com .ics
// Note: Booking.com usually puts Guest Name in Summary and ID in UID
const MOCK_BOOKING_ICS = `BEGIN:VCALENDAR
PRODID:-//Booking.com//
VERSION:2.0
BEGIN:VEVENT
UID:12345678@booking.com
DTSTART;VALUE=DATE:20260214
DTEND;VALUE=DATE:20260216
SUMMARY:Chen Tai-Man
DESCRIPTION:CHECKIN: 2026-02-14\nCHECKOUT: 2026-02-16
END:VEVENT
BEGIN:VEVENT
UID:87654321@booking.com
DTSTART;VALUE=DATE:20260301
DTEND;VALUE=DATE:20260305
SUMMARY:Wang Xiao-Ming
END:VEVENT
END:VCALENDAR`

const mockRoom: Room = {
    id: 'room-uuid-001',
    room_number: '205',
    room_type: 'Deluxe Double',
    status: 'clean',
    created_at: '2023-01-01'
}

describe('iCal Sync Logic (Booking.com Simulation)', () => {
    let mockSupabase: any;
    let mockFrom: any;

    beforeEach(() => {
        // Reset mocks
        mockFrom = vi.fn()
        mockSupabase = { from: mockFrom }
    })

    it('should correctly parse dates and assign to the specific room', async () => {
        // Setup Supabase Mocks
        // 1. check existing -> null (not found)
        const chainExisting = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }) // New booking
        }

        // 2. check conflicts -> empty (no conflict)
        const chainConflict = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve({ data: [] }).then(cb)
        }

        // 3. insert -> success
        const chainInsert = {
            insert: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue({})
        }

        // We expect 2 events, so the chain will be called 2 times for each step
        mockFrom
            // Event 1
            .mockReturnValueOnce(chainExisting)
            .mockReturnValueOnce(chainConflict)
            .mockReturnValueOnce(chainInsert)
            // Event 2
            .mockReturnValueOnce(chainExisting)
            .mockReturnValueOnce(chainConflict)
            .mockReturnValueOnce(chainInsert)

        // Mock Fetch
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => MOCK_BOOKING_ICS
        })

        // Execute
        const result = await processRoomSync(mockSupabase, mockRoom, 'booking', 'https://mock.url', mockFetch)

        // Verifications
        expect(result.processed).toBe(2)
        expect(result.inserted).toBe(2)
        expect(result.errors).toHaveLength(0)

        // Check if correct data was inserted
        // First Insert Call
        expect(chainInsert.insert).toHaveBeenNthCalledWith(1, expect.objectContaining({
            room_id: 'room-uuid-001', // Correct Room ID
            guest_name: 'Chen Tai-Man',
            check_in_date: '2026-02-14',
            check_out_date: '2026-02-16',
            platform: 'booking'
        }))

        // Second Insert Call
        expect(chainInsert.insert).toHaveBeenNthCalledWith(2, expect.objectContaining({
            room_id: 'room-uuid-001',
            guest_name: 'Wang Xiao-Ming',
            check_in_date: '2026-03-01',
            check_out_date: '2026-03-05'
        }))
    })

    it('should handle fetch errors gracefully', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: 'Not Found'
        })

        const result = await processRoomSync(mockSupabase, mockRoom, 'booking', 'bad-url', mockFetch)

        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toContain('Fetch failed')
    })
})
