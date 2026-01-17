# 房務自動化中控平台 (Housekeeping Automation Control Platform)

這是一套專為中小型旅宿業者設計的房務管理系統，解決了傳統手動排班的混亂、重複訂房風險以及溝通效率低落的問題。

## 🛠 技術棧 (Tech Stack)

*   **Frontend**: Next.js 15 (App Router), React 19
*   **UI Framework**: Tailwind CSS, shadcn/ui
*   **Database & Auth**: Supabase (PostgreSQL, Auth, Storage, Realtime)
*   **Calendar Sync**: node-ical, ical.js
*   **Notifications**: LINE Messaging API (LINE Developers)

## ✨ 主要功能 (Key Features)

1.  **iCal 雙向同步 (iCal Sync)**:
    *   自動抓取 Agoda / Booking.com 的訂單資料。
    *   防止重複訂房 (Overbooking) 的衝突檢測機制。
2.  **房務搶單系統 (Housekeeping Tasks)**:
    *   依據退房日期自動產生清潔任務。
    *   房務員透過手機介面「搶單」並上傳清潔照片回報。
3.  **LINE 通知整合 (LINE Messaging API)**:
    *   透過官方 LINE Bot 發送通知。
    *   新訂單成立時通知老闆。
    *   房務員完工後通知管理員驗收。

## 🚀 部署設定 (Deployment)

本專案支援 **Vercel** 一鍵部署。請在專案設定 (Settings > Environment Variables) 中填入以下變數：

| 變數名稱 (Variable Name) | 說明 (Description) | 如何取得 (How to get) |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案網址 | Supabase Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Key | Supabase Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Supabase Project Settings > API (注意：這是機密金鑰，不可外洩) |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API Token | LINE Developers > Channel > Messaging API > **Channel access token (long-lived)** |
| `LINE_USER_ID` | 接收通知的管理員 User ID | LINE Developers > Channel > Basic settings > **Your User ID** |

---

### 🟢 如何設定 LINE Messaging API (取得 Token 與 User ID)

由於 LINE Notify 服務已停止申請，本系統採用 **LINE Messaging API** (LINE Bot) 方案。

1.  登入 [LINE Developers Console](https://developers.line.biz/)。
2.  建立一個 Provider (如果還沒有)。
3.  建立一個新 Channel，類型選擇 **"Messaging API"**。
    *   填寫 Channel name (例如：房務小幫手)。
    *   填寫 Description。
4.  取得 **Channel Access Token**:
    *   進入剛建立的 Channel 頁面。
    *   點選上方標籤 **"Messaging API"**。
    *   滑到最下方找到 **Channel access token**。
    *   點擊 **"Issue"** 按鈕產生一組長效 Token。 -> 複製填入 Vercel `LINE_CHANNEL_ACCESS_TOKEN`。
5.  取得 **Admin User ID** (用於接收通知):
    *   點選上方標籤 **"Basic settings"**。
    *   滑到下方找到 **"Your User ID"** (格式通常為 `U` 開頭的字串)。 -> 複製填入 Vercel `LINE_USER_ID`。
    *   *注意：請務必用手機掃描 Messaging API 頁面的 QR Code，將此 Bot 加為好友，否則無法收到通知。*
