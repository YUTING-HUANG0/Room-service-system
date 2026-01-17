import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BedDouble, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center border-b px-6 lg:px-10">
        <div className="flex items-center gap-2 font-bold text-xl">
          <BedDouble className="h-6 w-6" />
          <span>房務自動化中控</span>
        </div>
        <div className="ml-auto">
          <Button asChild variant="ghost">
            <Link href="/auth/login">
              <LogIn className="mr-2 h-4 w-4" />
              登入系統
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          現代化旅宿管理解決方案
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mb-8">
          整合 Booking 與 Agoda 訂單同步，自動化房務調度，讓老闆與房務員協作更輕鬆。
        </p>

        <div className="flex gap-4">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/booking">立即訂房 (Guest)</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">員工登入 (Staff)</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl text-left" id="features">
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">📅 跨平台同步</h3>
            <p className="text-sm text-muted-foreground">自動整合各大 OTA 平台行事曆，防止超賣。</p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">🧹 房務搶單</h3>
            <p className="text-sm text-muted-foreground">透明的房務調度系統，提升效率與公平性。</p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">🔔 即時通知</h3>
            <p className="text-sm text-muted-foreground">透過 LINE 接收第一手訂單與清掃通知。</p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © 2026 房務自動化中控平台. All rights reserved.
      </footer>
    </div>
  );
}
