'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function SyncButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSync = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ical/sync')
            const data = await res.json()
            alert('同步完成: \n' +
                `已處理: ${data.results.processed}\n` +
                `新增: ${data.results.inserted}\n` +
                `更新: ${data.results.updated}` +
                (data.results.errors.length > 0 ? `\n錯誤: ${data.results.errors.length}` : '')
            )
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('同步失敗')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleSync} disabled={loading}>
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    同步中...
                </>
            ) : (
                '同步訂單'
            )}
        </Button>
    )
}
