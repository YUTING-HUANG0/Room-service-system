import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
    console.error('Missing Env Vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl!, anonKey!)

async function stressTest() {
    console.log('🔥 Starting Stress Test (50 Concurrent Room Checks)...')
    const start = Date.now()

    const requests = Array.from({ length: 50 }).map(async (_, i) => {
        const { data, error } = await supabase.from('rooms').select('id, status').limit(1)
        return { i, success: !error }
    })

    const results = await Promise.all(requests)
    const successCount = results.filter(r => r.success).length
    const duration = Date.now() - start

    console.log(`✅ Completed in ${duration}ms`)
    console.log(`Success Rate: ${successCount}/50`)
}

stressTest()
