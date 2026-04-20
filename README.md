# 🍺 不醉不歸 — Bar Crawl Planner

> 台北酒吧地圖 × 打卡路線規劃 × 微醺社群的一站式 PWA 應用

---

## 📖 專案介紹

**不醉不歸**是一款以台北市為核心的酒吧巡禮規劃工具，結合即時地圖、打卡記錄、路線規劃與社群功能，讓每一次 Bar Hopping 都留下足跡。

### 主要功能

| 功能        | 說明                                                     |
| ----------- | -------------------------------------------------------- |
| 🗺️ 探索地圖 | 即時顯示周邊酒吧、Pub、超商地標；支援地區搜尋與 GPS 定位 |
| 📍 打卡記錄 | GPS 驗證距離範圍內打卡，可附上照片、心情 Emoji 與備註    |
| 🗓️ 路線規劃 | 自訂多站 Bar Hopping 路線，計算步行距離與預估時間        |
| 📸 微醺時刻 | 社群相片牆，瀏覽所有用戶上傳的打卡照片並猜地點           |
| 🏆 排行榜   | 依打卡數量排名，展示本週最活躍的酒徒                     |
| 👤 個人檔案 | 等級系統（共 5 級）、成就徽章、歷史足跡瀏覽              |

### 遊戲化機制

- 每次打卡 **+10 XP**、完成路線 **+50 XP**、上傳照片 **+5 XP**
- 等級：🍺 入門酒徒 → 🌙 夜行達人 → 🏃 Bar Hopper → ⚡ 路跑老手 → 👑 微醺傳說

---

## 🛠️ 技術棧

| 類別          | 使用技術                                         |
| ------------- | ------------------------------------------------ |
| 前端框架      | Vue 3 (Composition API + `<script setup>`)       |
| 建構工具      | Vite 8                                           |
| 狀態管理      | Pinia                                            |
| 路由          | Vue Router 4                                     |
| 樣式          | Tailwind CSS 3 + PostCSS                         |
| 後端 / 資料庫 | Supabase (PostgreSQL + PostGIS + Storage + Auth) |
| 部署          | Vercel                                           |

---

## 🗺️ 地圖服務說明

本專案全程使用**開放地圖服務（OpenStreetMap 生態系）**，無需付費 API Key：

| 服務                    | 用途                                      | 端點                                                                                      |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Leaflet**             | 地圖渲染 JavaScript 函式庫                | —                                                                                         |
| **CartoDB Dark Matter** | 深色風格地圖底圖 Tile                     | `basemaps.cartocdn.com`                                                                   |
| **Overpass API**        | 即時搜尋周邊酒吧 / 超商 POI               | 主：`overpass-api.de`<br>備1：`overpass.openstreetmap.ru`<br>備2：`overpass.kumi.systems` |
| **Nominatim**           | 地區 / 街道名稱地理編碼（搜尋框自動補全） | `nominatim.openstreetmap.org`                                                             |
| **OSRM**                | 步行路線規劃（路線規劃頁計算距離與時間）  | `router.project-osrm.org`                                                                 |

> **Overpass API 備援機制**：若主節點回傳 5xx 或逾時，系統會自動依序切換備用節點，確保地標搜尋穩定運作。

---

## ⚙️ 環境變數

在專案根目錄建立 `.env` 檔，填入 Supabase 專案資訊：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> 可在 [Supabase Dashboard](https://supabase.com/dashboard) → 專案設定 → API 取得上述兩個值。

---

## 🚀 本地啟動方式

### 前置需求

- **Node.js** >= 18
- **npm** >= 9（或使用 pnpm / yarn）

### 步驟

```bash
# 1. 複製專案
git clone https://github.com/your-username/BarCrawlPlanner.git
cd BarCrawlPlanner

# 2. 安裝相依套件
npm install

# 3. 設定環境變數（參考上方說明）
cp .env.example .env
# 編輯 .env，填入 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY

# 4. 啟動開發伺服器
npm run dev
```

瀏覽器開啟 [http://localhost:5173](http://localhost:5173) 即可看到應用。

### 其他指令

```bash
# 建構生產版本
npm run build

# 預覽生產建構結果
npm run preview
```

---

## 🗄️ 資料庫初始化

首次使用需在 Supabase SQL Editor 執行初始化腳本：

```bash
# 複製 supabase/init.sql 內容，貼入 Supabase Dashboard → SQL Editor → 執行
```

**Storage Bucket 設定（需手動建立）：**

1. Supabase Dashboard → Storage → 新增 Bucket
2. Bucket 名稱：`photos`
3. 設定為 **Public**（允許未登入用戶讀取圖片 URL）

**關閉 Email 驗證（開發期間建議）：**

Supabase Dashboard → Authentication → Providers → Email → 關閉「Confirm email」

---

## 📁 專案結構

```
src/
├── views/          # 頁面元件（Map、Footprints、RoutePlanner、PhotoWall、Leaderboard、Profile）
├── components/     # 可複用 UI 元件
│   ├── auth/       # 登入 Modal
│   ├── footprints/ # 打卡 Modal
│   ├── layout/     # 導覽列、個人按鈕
│   ├── map/        # 地標詳情抽屜
│   ├── route/      # 儲存路線 Modal
│   └── ui/         # 通用元件（Toast、StatCard）
├── stores/         # Pinia 狀態管理（auth、bars、routes）
├── composables/    # 可複用邏輯（useToast）
├── router/         # Vue Router 路由設定
├── lib/            # Supabase 客戶端
└── config.js       # 地圖、遊戲化全域設定
supabase/
└── init.sql        # 資料庫結構與 RLS 政策
```

---

## 📄 授權

MIT License
