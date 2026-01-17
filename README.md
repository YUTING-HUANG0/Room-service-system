# 房務自動化中控平台 (Housekeeping Automation Control Platform)

這是一套專為中小型旅宿業者設計的房務管理系統，解決了傳統手動排班的混亂、重複訂房風險以及溝通效率低落的問題。

## 🛠 技術棧 (Tech Stack)

*   **Frontend**: Next.js 15 (App Router), React 19
*   **UI Framework**: Tailwind CSS, shadcn/ui
*   **Database & Auth**: Supabase (PostgreSQL, Auth, Storage, Realtime)
*   **Calendar Sync**: node-ical, ical.js
*   **Notifications**: LINE Notify

## ✨ 主要功能 (Key Features)

1.  **iCal 雙向同步 (iCal Sync)**:
    *   自動抓取 Agoda / Booking.com 的訂單資料。
    *   防止重複訂房 (Overbooking) 的衝突檢測機制。
2.  **房務搶單系統 (Housekeeping Tasks)**:
    *   依據退房日期自動產生清潔任務。
    *   房務員透過手機介面「搶單」並上傳清潔照片回報。
3.  **LINE 通知整合 (LINE Notifications)**:
    *   新訂單成立時通知老闆。
    *   房務員完工後通知管理員驗收。

## 🚀 部署設定 (Deployment)

本專案支援 **Vercel** 一鍵部署。請在專案設定 (Settings > Environment Variables) 中填入以下變數：

| 變數名稱 (Variable Name) | 說明 (Description) |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案網址 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (用於後端 Cron Jobs) |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Notify Access Token (權杖) |
| `LINE_USER_ID` | (選填) 指定接收通知的 LINE User ID |
