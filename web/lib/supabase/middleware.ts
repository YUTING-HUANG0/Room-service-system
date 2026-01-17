import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes
    // Protected routes
    if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/housekeeper')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }

        // Check Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

        // Admin Only
        if (request.nextUrl.pathname.startsWith('/admin') && role !== 'boss') {
            const url = request.nextUrl.clone()
            url.pathname = '/housekeeper' // Redirect to HK dashboard
            return NextResponse.redirect(url)
        }

        // Housekeeper Only (Optional: Boss can view HK pages? Usually yes, but let's restrict purely for clarity or allow boss)
        // If we want Boss to be able to see HK view, remove this check or adjust.
        // Let's assume strict separation for now to test permissions.
        if (request.nextUrl.pathname.startsWith('/housekeeper') && role !== 'housekeeper' && role !== 'boss') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    // Redirect if logged in (optional, improved UX)
    if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
        // We can't easily know the role here without querying DB which is expensive in middleware
        // So we just let them go to login, or redirect to a generic dashboard.
        // For now, let's keep it simple.
    }

    return supabaseResponse
}
