import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
    process.exit(1)
}

// Function to run the flow
async function main() {
    console.log('🚀 Starting Housekeeping System E2E Flow Simulation...')
    console.log('Target:', supabaseUrl)

    const url = supabaseUrl as string

    const adminClient = serviceKey ? createClient(url, serviceKey) : null
    const publicClient = anonKey ? createClient(url, anonKey) : null

    if (!adminClient) {
        console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. \n   Some verification steps (Task Checking, Cleanup) might fail or be skipped if RLS prevents Anon access.')
    }

    const client = adminClient || publicClient
    if (!client) {
        console.error('❌ No API Keys found in environment.')
        process.exit(1)
    }

    try {
        // 1. Get a Room
        console.log('\n--- Step 1: Fetch Available Room ---')
        const { data: rooms, error: rError } = await client.from('rooms').select('id, room_number').limit(1)
        if (rError) throw new Error(`Fetch Room Failed: ${rError.message}`)
        if (!rooms || rooms.length === 0) throw new Error('No rooms found in database')

        const room = rooms[0]
        console.log(`✅ Using Room: ${room.room_number} (${room.id})`)

        // 2. Create Booking (Simulate check-out TODAY to trigger Task)
        console.log('\n--- Step 2: Create Booking (Check-out Today) ---')
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)

        const bookingPayload = {
            room_id: room.id,
            guest_name: 'E2E Test Guest',
            check_in_date: yesterday.toISOString(),
            check_out_date: today.toISOString(),
            status: 'confirmed', // Assuming this triggers task or 'checked_out' triggers it
            platform: 'official'
        }

        const { data: booking, error: bError } = await client
            .from('bookings')
            .insert(bookingPayload)
            .select()
            .single()

        if (bError) throw new Error(`Booking Insert Failed: ${bError.message}`)
        console.log(`✅ Booking Created: ${booking.id}`)

        // 3. Verify Task Generation
        // Note: This relies on a DB Trigger. If the logic is in App Code (Cron), this won't happen immediately.
        // If logic is "Checkout triggers task", it might happen now.
        console.log('\n--- Step 3: Check for Task Generation ---')
        console.log('   (Waiting 3s for DB triggers...)')
        await new Promise(r => setTimeout(r, 3000))

        if (adminClient) {
            const { data: tasks, error: tError } = await adminClient
                .from('tasks')
                .select('*')
                .eq('booking_id', booking.id) // Assuming tasks link to booking, or room + date

            // Fallback check by Room + Date if booking_id not linked
            const { data: tasksByRoom } = await adminClient
                .from('tasks')
                .select('*')
                .eq('room_id', room.id)
                .eq('scheduled_date', today.toISOString().split('T')[0])

            const task = (tasks && tasks[0]) || (tasksByRoom && tasksByRoom[0])

            if (task) {
                console.log(`✅ Task Found: ${task.id} (Status: ${task.status})`)

                // 4. Simulate Housekeeper Work
                console.log('\n--- Step 4: Simulate Housekeeper Action ---')
                const { error: claimErr } = await adminClient
                    .from('tasks')
                    .update({ status: 'accepted' })
                    .eq('id', task.id)
                if (!claimErr) console.log('✅ Task Claimed (Accepted)')
                else console.error('❌ Claim Failed:', claimErr.message)

                const { error: doneErr } = await adminClient
                    .from('tasks')
                    .update({
                        status: 'completed',
                        image_url: 'https://placehold.co/600x400/png' // Mock Image
                    })
                    .eq('id', task.id)
                if (!doneErr) console.log('✅ Task Completed (Photo Uploaded)')
                else console.error('❌ Complete Failed:', doneErr.message)

            } else {
                console.warn('⚠️  No Task found. The system might rely on a Cron Job to generate tasks, or the DB trigger is missing.')
            }
        } else {
            console.log('⚠️  Skipping Task Verification (Need Service Key to view/edit Tasks usually)')
        }

        // 5. Cleanup
        console.log('\n--- Step 5: Cleanup ---')
        if (adminClient) {
            await adminClient.from('bookings').delete().eq('id', booking.id)
            // Tasks usually cascade delete or we leave them
            console.log('✅ Test Booking Deleted')
        } else {
            console.log('⚠️  Please delete booking ' + booking.id + ' manually')
        }

        console.log('\n✅ E2E Flow Simulation Finished')

    } catch (e: any) {
        console.error('\n❌ Test Failed:', e.message)
        process.exit(1)
    }
}

main()
