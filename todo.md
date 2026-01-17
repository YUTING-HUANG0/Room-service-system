# 房務自動化中控平台 (Housekeeping Automation Control Platform) - 待辦事項

此專案旨在為小型旅宿業者打造一站式管理平台，解決訂房同步與房務調度問題。

## 1. 專案初始化與架構設計 (Project Setup)
- [ ] **技術選型與環境建置**
    - [ ] 決定前端框架 (推薦: Next.js / React)
    - [ ] 決定後端架構 (推薦: Node.js / Next.js API Routes)
    - [ ] 資料庫設計 (PostgreSQL / Supabase / MongoDB) - 需包含 User, Room, Booking, CleaningTask 資料表
    - [ ] 設定專案 Repo 與 CI/CD 流程
- [ ] **UI/UX 設計系統**
    - [ ] 定義色彩計畫 (營造現代、專業感)
    - [ ] 建立基礎元件庫 (Buttons, Inputs, Cards, Modals)
    - [ ] 設計各角色 Dashboard 佈局

## 2. 核心功能：跨平台自動同步 (Cross-Platform Sync)
- [ ] **房況日曆系統**
    - [ ] 實作主要日曆視圖 (Calendar View)
    - [ ] 定義房型與房間資料結構
- [ ] **iCal 同步引擎**
    - [ ] 實作 iCal URL 解析功能 (Import)
    - [ ] 實作 iCal Feed 生成功能 (Export)
    - [ ] 整合 Booking.com iCal
    - [ ] 整合 Agoda iCal
    - [ ] 建立排程任務 (Cron Job) 定期抓取外部 iCal 更新本地資料庫
    - [ ] 實作「防超賣」邏輯 (衝突檢測)

## 3. 角色功能：老闆 / 管理員 (Boss Dashboard)
- [ ] **一站式中控台**
    - [ ] 總覽頁面 (今日入住/退房、待清掃房間數)
- [ ] **房源與訂單管理**
    - [ ] 房源狀態管理 (維修中、保留房)
    - [ ] 訂單列表與詳情查看
    - [ ] 手動建立訂單功能 (Walk-in 或電話訂房)
- [ ] **清掃品質審核**
    - [ ] 檢視房務員上傳的清掃照片
    - [ ] 標記任務為「已完成/驗收通過」或「需重清」

## 4. 角色功能：房務員 (Housekeeper App)
- [ ] **搶單中心 (Task Marketplace)**
    - [ ] 根據退房日期自動生成清掃任務
    - [ ] 任務列表視圖 (顯示房間號、截止時間)
    - [ ] 房務員「搶單/接單」功能
- [ ] **任務執行與回報**
    - [ ] 我的任務清單
    - [ ] 清掃完畢上傳照片功能 (整合相機/檔案上傳)
    - [ ] 標記任務完成

## 5. 角色功能：客人 (Guest Booking Portal)
- [ ] **官網訂房介面**
    - [ ] 首頁與房型展示
    - [ ] 搜尋空房功能 (依日期)
    - [ ] 訂單填寫與送出 (不經 OTA，直接寫入系統)
    - [ ] (選配) 串接金流支付

## 6. 即時通知系統 (Real-time Notifications)
- [ ] **LINE 整合**
    - [ ] 申請 LINE Messaging API 或 LINE Notify
    - [ ] 實作 Webhook 接收與發送邏輯
- [ ] **通知場景實作**
    - [ ] [給老闆] 收到新訂單 (來自官網 或 iCal 同步)
    - [ ] [給老闆] 房務員完成任務 (附照片連結)
    - [ ] [給房務員] 新增清掃任務通知
    [ ] 實作 LINE Notify 綁定流程：因為 Messaging API 較複雜，對於學生開發，LINE Notify 是實現「老闆收到通知」最快、最準、免開發費用的方法。

## 7. 測試與部屬 (Testing & Deployment)
- [ ] 進行單元測試 (特別是 iCal 解析與同步邏輯)
- [ ] 進行使用者流程測試 (User Walkthrough)
- [ ] 部署至正式環境 (Vercel / Railway / AWS)
