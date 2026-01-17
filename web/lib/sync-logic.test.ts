import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processRoomSync } from './sync-logic'
import { Room } from '@/types'

const mockRoom = {
    id: 'room-1',
    room_number: '101',
    room_type: 'Double',
    status: 'clean',
    created_at: '2023-01-01'
} as Room

const sampleIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//
BEGIN:VEVENT
UID:uid-123
DTSTART;VALUE=DATE:20260201
DTEND;VALUE=DATE:20260203
SUMMARY:Guest A
END:VEVENT
END:VCALENDAR`

describe('processRoomSync', () => {
    let mockSupabase: any;
    let mockFrom: any;

    beforeEach(() => {
        mockFrom = vi.fn()
        mockSupabase = { from: mockFrom }
    })

    it('should insert new booking when no existing and no conflict', async () => {
        // 1. Existing check -> null
        const chainExisting = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null })
        }

        // 2. Conflict check -> empty array
        const chainConflict = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve({ data: [] }).then(cb)
        }

        // 3. Insert -> success
        const chainInsert = {
            insert: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue({})
        }

        mockFrom
            .mockReturnValueOnce(chainExisting)
            .mockReturnValueOnce(chainConflict)
            .mockReturnValueOnce(chainInsert)

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => sampleIcal
        })

        const result = await processRoomSync(mockSupabase, mockRoom, 'booking', 'http://test.com', mockFetch)

        expect(result.inserted).toBe(1)
        expect(result.errors).toHaveLength(0)
        expect(chainInsert.insert).toHaveBeenCalledTimes(1)
    })

    it('should skip if conflict exists', async () => {
        // 1. Existing -> null
        const chainExisting = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null })
        }

        // 2. Conflict -> found one
        const chainConflict = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve({ data: [{ guest_name: 'Existing Guest' }] }).then(cb)
        }

        mockFrom
            .mockReturnValueOnce(chainExisting)
            .mockReturnValueOnce(chainConflict)

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => sampleIcal
        })

        const result = await processRoomSync(mockSupabase, mockRoom, 'booking', 'http://test.com', mockFetch)

        expect(result.inserted).toBe(0)
        expect(result.updated).toBe(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toContain('衝突')
    })

    it('should update if booking exists', async () => {
        // 1. Existing -> found
        const chainExisting = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'booking-1' } })
        }

        // 2. Conflict -> empty
        const chainConflict = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve({ data: [] }).then(cb)
        }

        // 3. Update -> success
        const chainUpdate = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({})
        }

        mockFrom
            .mockReturnValueOnce(chainExisting)
            .mockReturnValueOnce(chainConflict)
            .mockReturnValueOnce(chainUpdate)

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => sampleIcal
        })

        const result = await processRoomSync(mockSupabase, mockRoom, 'booking', 'http://test.com', mockFetch)

        expect(result.updated).toBe(1)
        expect(result.errors).toHaveLength(0)
        expect(chainUpdate.update).toHaveBeenCalled()
    })
})
