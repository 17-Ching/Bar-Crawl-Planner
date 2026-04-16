// ── Supabase 連線設定 ──────────────────────────────────
// 請在 .env 檔或 Vercel Environment Variables 設定以下兩個值
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// ── 地圖設定 ───────────────────────────────────────────
export const MAP_CONFIG = {
  // 預設中心點：台北 101 附近
  defaultCenter: [25.0330, 121.5654],
  defaultZoom: 14,
  minZoom: 11,
  maxZoom: 19,

  // CartoDB Dark Matter 免費深色底圖（無需 API Key）
  tileLayer: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  },

  // OSRM 公共路線規劃 API（步行）
  osrmBase: 'https://router.project-osrm.org/route/v1/foot',

  // Overpass API（OSM POI 查詢）
  overpassUrl: 'https://overpass-api.de/api/interpreter',

  // 打卡驗證容許範圍（公尺）
  checkinRadius: 200,
}

// ── 遊戲化設定 ─────────────────────────────────────────
export const GAME_CONFIG = {
  // 每打卡 1 間酒吧得 10 點 XP
  xpPerCheckin: 10,
  xpPerRoute: 50,
  xpPerPhotoUpload: 5,

  // 等級門檻（總 XP）
  levels: [
    { level: 1, name: '入門酒徒',     xpRequired: 0,    icon: '🍺' },
    { level: 2, name: '夜行達人',     xpRequired: 100,  icon: '🌙' },
    { level: 3, name: 'Bar Hopper',  xpRequired: 300,  icon: '🏃' },
    { level: 4, name: '路跑老手',    xpRequired: 700,  icon: '⚡' },
    { level: 5, name: '微醺傳說',    xpRequired: 1500, icon: '👑' },
  ],

  // 照片上傳限制
  maxPhotosPerCheckin: 3,
  maxPhotoSizeKB: 800,
}

// ── 應用常數 ───────────────────────────────────────────
export const APP_NAME = '不醉不歸'
export const APP_TAGLINE = '深夜尋 Bar，路跑記憶，留下足跡'
