
export interface Booking {
    id: string;
    room_id: string;
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    platform: 'official' | 'booking' | 'agoda' | 'walk-in' | 'other';
    status: 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out';
    original_uid?: string;
    guest_email?: string;
    guest_phone?: string;
    created_at: string;
    rooms?: {
        room_number: string;
        room_type: string;
    };
}

export interface Room {
    id: string;
    room_number: string;
    room_type: string;
    status: 'clean' | 'dirty' | 'maintenance' | 'occupied';
    ical_booking_url?: string;
    ical_agoda_url?: string;
    created_at: string;
}

export interface Task {
    id: string;
    booking_id?: string;
    room_id: string;
    status: 'pending' | 'accepted' | 'completed' | 'verified';
    housekeeper_id?: string;
    image_url?: string;
    scheduled_date: string;
    completed_at?: string;
    created_at: string;
    rooms?: {
        room_number: string;
        room_type?: string;
    };
    profiles?: {
        full_name: string;
    };
}
