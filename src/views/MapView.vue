<template>
  <div class="relative w-full flex flex-col h-[calc(100vh-80px)]">

    <!-- ── 頂部搜尋列（z-[900] 高於 Leaflet 控制 z-800）── -->
    <header class="absolute top-0 inset-x-0 z-[900] p-3 pointer-events-none max-w-[1280px] mx-auto">
      <div class="glass-card p-2.5 flex items-center gap-2 pointer-events-auto">
        <!-- App 標誌 -->
        <span class="font-display font-bold text-sm text-neon-gradient shrink-0">🍺</span>

        <!-- 區域搜尋框 -->
        <div class="flex-1 relative">
          <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10" />
          <input
            id="map-area-search"
            v-model="areaQuery"
            type="text"
            placeholder="輸入地區、街道名稱…"
            class="input-base pl-8 pr-3 h-9 text-sm w-full"
            @keyup.enter="doSearch"
            @input="onQueryInput"
            autocomplete="off"
          />
          <!-- 搜尋建議下拉 -->
          <ul
            v-if="areaSuggestions.length"
            class="absolute top-full left-0 right-0 mt-1 card border border-dark-600 z-50 overflow-hidden"
          >
            <li
              v-for="s in areaSuggestions"
              :key="s.place_id"
              @click="flyToSuggestion(s)"
              class="px-3 py-2.5 text-sm hover:bg-dark-700 cursor-pointer flex items-center gap-2"
            >
              <MapPin :size="13" class="text-neon-purple shrink-0" />
              <span class="truncate">{{ s.display_name }}</span>
            </li>
          </ul>
        </div>

        <!-- 搜尋按鈕 -->
        <button
          id="map-search-btn"
          @click="doSearch"
          :disabled="!areaQuery.trim() || isSearching"
          class="w-9 h-9 flex items-center justify-center rounded-xl border transition-all shrink-0 disabled:opacity-40"
          :class="isSearching
            ? 'border-neon-purple text-neon-purple bg-neon-purple/10 animate-spin'
            : 'border-dark-600 text-text-muted hover:border-neon-purple hover:text-neon-purple bg-dark-800'"
          aria-label="搜尋"
        >
          <Loader2 v-if="isSearching" :size="16" />
          <Search v-else :size="16" />
        </button>

        <!-- 定位 -->
        <button
          id="map-locate-btn"
          @click="locateMe"
          class="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors shrink-0"
          :class="isLocating
            ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10 animate-pulse'
            : 'border-dark-600 text-text-muted hover:border-neon-cyan hover:text-neon-cyan bg-dark-800'"
          aria-label="定位"
        >
          <LocateFixed :size="16" />
        </button>

        <!-- 登入 -->
        <ProfileButton />
      </div>

      <!-- ── 模式切換 Toggle ── -->
      <div class="flex gap-2 mt-2 pointer-events-auto">
        <button
          id="mode-bar-btn"
          @click="setMode('bar')"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 border"
          :class="mapMode === 'bar'
            ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-transparent shadow-neon-purple'
            : 'bg-dark-800/90 text-text-muted border-dark-600/60 hover:border-neon-purple'"
        >
          <Beer :size="15" />
          酒吧模式
          <span v-if="barCount > 0" class="text-xs opacity-70">({{ barCount }})</span>
        </button>
        <button
          id="mode-store-btn"
          @click="setMode('convenience')"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 border"
          :class="mapMode === 'convenience'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-neon-cyan'
            : 'bg-dark-800/90 text-text-muted border-dark-600/60 hover:border-neon-cyan'"
        >
          <ShoppingCart :size="15" />
          超商模式
          <span v-if="storeCount > 0" class="text-xs opacity-70">({{ storeCount }})</span>
        </button>
      </div>
    </header>

    <!-- ── Leaflet 地圖 ── -->
    <div id="main-map" ref="mapEl" class="flex-1 w-full" />

    <!-- ── 全螢幕微醺載入動畫 ── -->
    <Transition name="fade-overlay">
      <div
        v-if="mapLoading"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090e]/95 backdrop-blur-md pb-24"
      >
        <div class="text-6xl animate-bounce mb-6">🥂</div>
        <h2 class="font-display font-bold text-2xl text-neon-gradient mb-3 tracking-widest">不醉不歸</h2>
        <div class="px-5 py-3 flex items-center gap-3">
          <div class="w-5 h-5 rounded-full border-2 border-neon-purple/30 border-t-neon-purple animate-spin" />
          <span class="text-sm text-text-secondary font-medium tracking-wider">
            {{ loadingHint }}
          </span>
        </div>
      </div>
    </Transition>

    <!-- ── 右下浮動按鈕 ── -->
    <div class="absolute bottom-[100px] left-1/2 -translate-x-1/2 z-[400] flex flex-col gap-2">
      <button
        id="map-refresh-btn"
        @click="loadPOIs"
        class="w-11 h-11 rounded-xl glass-card border flex items-center justify-center
               text-text-muted hover:text-neon-cyan hover:border-neon-cyan/40 transition-all duration-200"
        aria-label="重新載入地標"
      >
        <RefreshCw :size="18" :class="{ 'animate-spin': mapLoading }" />
      </button>
    </div>

    <!-- ── 底部統計列 ── -->
    <Transition name="fade-overlay">
      <div v-if="barsStore.bars.length" class="absolute bottom-[60px] inset-x-3 z-[400] max-w-[1280px] mx-auto flex flex-col items-center">
        <div class="glass-card px-4 py-2 flex items-center justify-between max-w-[500px] w-full">
          <div class="flex items-center gap-3 text-sm">
            <span class="text-text-muted text-xs">附近</span>
            <span class="text-neon-purple font-semibold">{{ barCount }} 間酒吧</span>
            <span class="text-neon-cyan font-semibold">{{ storeCount }} 間超商</span>
          </div>
          <span class="badge-purple text-xs">{{ currentAreaName }}</span>
        </div>
      </div>
    </Transition>

    <!-- ── 酒吧詳情抽屜 ── -->
    <Transition name="slide-up">
      <BarDetailDrawer
        v-if="selectedBar"
        :bar="selectedBar"
        @close="selectedBar = null"
        @add-waypoint="handleAddWaypoint"
        @checkin="handleCheckin"
      />
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import {
  Search, MapPin, LocateFixed, Lock, UserCircle,
  Beer, ShoppingCart, RefreshCw, Loader2,
} from 'lucide-vue-next'
import { useBarsStore } from '@/stores/bars'
import { useRouteStore } from '@/stores/routes'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { MAP_CONFIG } from '@/config'
import BarDetailDrawer from '@/components/map/BarDetailDrawer.vue'
import ProfileButton from '@/components/layout/ProfileButton.vue'

const barsStore  = useBarsStore()
const routeStore = useRouteStore()
const authStore  = useAuthStore()
const router     = useRouter()
const { success, error: toastError, info } = useToast()

// ── Demo 假資料 ───────────────────────────────────────────
const DEMO_BARS = [
  { id: 'demo_1',  name: 'Alchemy Bar',      lat: 25.0445, lng: 121.5632, category: 'bar',         tags: { opening_hours: '20:00–02:00' } },
  { id: 'demo_2',  name: 'The Rabbit Hole',  lat: 25.0412, lng: 121.5544, category: 'bar',         tags: { opening_hours: '19:00–02:00' } },
  { id: 'demo_3',  name: 'Revolver',         lat: 25.0438, lng: 121.5607, category: 'pub',         tags: { opening_hours: '17:00–03:00' } },
  { id: 'demo_4',  name: 'Draft Land',       lat: 25.0421, lng: 121.5578, category: 'bar',         tags: { opening_hours: '15:00–00:00' } },
  { id: 'demo_5',  name: '全家 FamilyMart',  lat: 25.0430, lng: 121.5595, category: 'convenience', tags: {} },
  { id: 'demo_6',  name: 'Bar Mood Taipei',  lat: 25.0397, lng: 121.5513, category: 'bar',         tags: { opening_hours: '20:00–03:00' } },
  { id: 'demo_7',  name: 'Indulge Bistro',   lat: 25.0462, lng: 121.5620, category: 'bar',         tags: { opening_hours: '18:00–02:00' } },
  { id: 'demo_8',  name: '7-ELEVEN',         lat: 25.0453, lng: 121.5648, category: 'convenience', tags: {} },
  { id: 'demo_9',  name: "C'est La Vie",     lat: 25.0388, lng: 121.5532, category: 'pub',         tags: { opening_hours: '17:00–02:00' } },
  { id: 'demo_10', name: 'Marquee Taipei',   lat: 25.0475, lng: 121.5560, category: 'bar',         tags: { opening_hours: '22:00–06:00' } },
]

// ── State ──────────────────────────────────────────────────
const mapEl           = ref(null)
const areaQuery       = ref('')
const areaSuggestions = ref([])
const isLocating      = ref(false)
const isSearching     = ref(false)
const selectedBar     = ref(null)
const currentAreaName = ref('台北市')
const mapMode         = ref('bar')   // 'bar' | 'convenience'
const mapLoading      = ref(false)   // 載入動畫
const loadingHint     = ref('正在載入地標…')
let markerClicked     = false

let map          = null
let markersLayer = null
let userMarker   = null

// ── Computed ───────────────────────────────────────────────
const barCount = computed(() =>
  barsStore.bars.filter(b => b.category === 'bar' || b.category === 'pub').length
)
const storeCount = computed(() =>
  barsStore.bars.filter(b => b.category === 'convenience').length
)
const filteredBars = computed(() =>
  mapMode.value === 'bar'
    ? barsStore.bars.filter(b => b.category === 'bar' || b.category === 'pub')
    : barsStore.bars.filter(b => b.category === 'convenience')
)

// ── 地圖初始化（生命週期修復）──────────────────────────────
// 問題根因：onMounted 時 DOM 已準備好，但 Leaflet 容器尺寸計算可能還未完成
// 修復方案：await nextTick() 確保 DOM 繪製完成 → invalidateSize() → whenReady() 後載入 POI
onMounted(async () => {
  // 等待 Vue 完成 DOM 繪製
  await nextTick()

  map = L.map(mapEl.value, {
    center:             MAP_CONFIG.defaultCenter,
    zoom:               MAP_CONFIG.defaultZoom,
    zoomControl:        false,
    attributionControl: true,
  })

  L.tileLayer(MAP_CONFIG.tileLayer.url, {
    attribution: MAP_CONFIG.tileLayer.attribution,
    subdomains:  MAP_CONFIG.tileLayer.subdomains,
    maxZoom:     MAP_CONFIG.tileLayer.maxZoom,
  }).addTo(map)

  L.control.zoom({ position: 'topright' }).addTo(map)
  markersLayer = L.layerGroup().addTo(map)

  // 修正容器尺寸（解決 [Leaflet] Map container has no height; 類問題）
  map.invalidateSize()

  map.on('click', () => {
    if (markerClicked) { markerClicked = false; return }
    selectedBar.value    = null
    areaSuggestions.value = []
  })

  // ★ whenReady 確保地圖完全就緒後才載入資料，解決「首次無地標」問題
  map.whenReady(() => {
    loadPOIs()
  })

  // 加入地圖拖曳結束後的防抖搜尋
  map.on('moveend', debouncedLoadPOIs)
})

onUnmounted(() => map?.remove())

// ── 模式切換 ───────────────────────────────────────────────
function setMode(mode) {
  mapMode.value = mode
  renderMarkers()
}

let poiSearchTimeout = null
function debouncedLoadPOIs() {
  if (poiSearchTimeout) clearTimeout(poiSearchTimeout)
  poiSearchTimeout = setTimeout(() => {
    loadPOIs()
  }, 800)
}

// ── 載入 POI ───────────────────────────────────────────────
async function loadPOIs() {
  if (!map) return
  mapLoading.value = true
  loadingHint.value = '正在搜尋附近地標…'

  const center  = map.getCenter()
  const zoom    = map.getZoom()
  const radiusM = zoom >= 15 ? 800 : zoom >= 13 ? 1500 : 3000

  try {
    // 改成只發送 1 個請求，將酒吧、Pub、超商查詢合併，速度提升 3 倍
    const all = await barsStore.fetchFromOverpass({ lat: center.lat, lng: center.lng, radiusM, type: 'all' })

    barsStore.bars = all.length > 0 ? all : DEMO_BARS

    if (all.length === 0) loadingHint.value = 'API 逾時，顯示示範資料'
  } catch (e) {
    if (e.message === 'rate_limited') {
      info('目前探索人數較多，API 暫時限流，請稍候幾秒再試 🍻')
    } else {
      toastError('載入地標失敗')
    }
    // Fallback：即使 API 全部失敗也能顯示地標
    barsStore.bars = DEMO_BARS
    loadingHint.value = '載入失敗，顯示示範資料'
  }

  renderMarkers()
  mapLoading.value = false
}

// ── 渲染 Marker ───────────────────────────────────────────
function renderMarkers() {
  if (!markersLayer) return
  markersLayer.clearLayers()
  filteredBars.value.forEach(bar => {
    const icon   = createMarkerIcon(bar.category)
    const marker = L.marker([bar.lat, bar.lng], { icon })
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e)
      markerClicked     = true
      selectedBar.value = bar
    })
    markersLayer.addLayer(marker)
  })
}

function createMarkerIcon(category) {
  const cfg = {
    bar:         { emoji: '🍺', color: '#C084FC', glow: 'rgba(192,132,252,0.6)' },
    pub:         { emoji: '🍻', color: '#F472B6', glow: 'rgba(244,114,182,0.6)' },
    convenience: { emoji: '🏪', color: '#22D3EE', glow: 'rgba(34,211,238,0.6)'  },
  }
  const c = cfg[category] || cfg.bar
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-inner" style="
        width:40px; height:40px;
        background:rgba(15,15,26,0.92);
        border:2px solid ${c.color};
        border-radius:50% 50% 50% 4px;
        transform:rotate(-45deg);
        box-shadow:0 0 12px ${c.glow};
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; pointer-events:all;
      ">
        <span style="transform:rotate(45deg);font-size:18px;line-height:1;">${c.emoji}</span>
      </div>
    `,
    iconSize:    [40, 40],
    iconAnchor:  [20, 40],
    popupAnchor: [0, -44],
  })
}

// ── 定位 ───────────────────────────────────────────────────
function locateMe() {
  if (!navigator.geolocation) { toastError('瀏覽器不支援 GPS 定位'); return }
  isLocating.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords: { latitude: lat, longitude: lng } }) => {
      map.flyTo([lat, lng], 15, { duration: 1.2 })
      if (userMarker) userMarker.remove()
      userMarker = L.circleMarker([lat, lng], {
        radius: 8, fillColor: '#C084FC', fillOpacity: 1,
        color: '#fff', weight: 2,
      }).addTo(map).bindPopup('你在這裡 📍')
      isLocating.value = false
      loadPOIs()
    },
    () => { isLocating.value = false; toastError('無法取得位置，請確認已授權 GPS') },
    { timeout: 8000, enableHighAccuracy: true }
  )
}

// ── 區域搜尋：Typing debounce（自動完成）─────────────────
let searchTimer = null
function onQueryInput() {
  const q = areaQuery.value.trim()
  if (!q || q.length < 2) { areaSuggestions.value = []; return }
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchSuggestions(q), 400)
}

// ── 區域搜尋：Enter / 按鈕點擊（立即觸發）────────────────
async function doSearch() {
  const q = areaQuery.value.trim()
  if (!q) return
  clearTimeout(searchTimer)
  isSearching.value = true
  await fetchSuggestions(q)
  isSearching.value = false

  // 取得結果後，直接跳轉到最佳吻合（第一筆）
  if (areaSuggestions.value.length >= 1) {
    flyToSuggestion(areaSuggestions.value[0])
  } else {
    toastError('找不到該地區，請換個關鍵字試試')
  }
}

async function fetchSuggestions(q) {
  try {
    const url = `${MAP_CONFIG.nominatimUrl}?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=tw&accept-language=zh-TW`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BarCrawlPlannerApp/1.0', 'Accept-Language': 'zh-TW' },
    })
    areaSuggestions.value = await res.json()
  } catch {
    areaSuggestions.value = []
  }
}

function flyToSuggestion(s) {
  map.flyTo([parseFloat(s.lat), parseFloat(s.lon)], 15, { duration: 1.2 })
  currentAreaName.value  = s.display_name.split(',')[0]
  areaQuery.value        = s.display_name.split(',')[0]
  areaSuggestions.value  = []
  // flyTo 完成後重新載入 POI
  setTimeout(loadPOIs, 1400)
}

// ── 事件處理 ───────────────────────────────────────────────
function handleAddWaypoint(bar) {
  routeStore.addWaypoint(bar)
  success('已加入酒精路跑路線！')
  selectedBar.value = null
}

function handleCheckin(bar) {
  if (!authStore.isLoggedIn) { authStore.showLoginModal = true; return }
  sessionStorage.setItem('checkin_bar', JSON.stringify(bar))
  router.push('/footprints')
}
</script>

<style scoped>
/* 底部抽屜動畫 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }

/* Modal 動畫 */
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.95); }

/* Loading overlay 動畫 */
.fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity 0.4s ease; }
.fade-overlay-enter-from, .fade-overlay-leave-to       { opacity: 0; }
</style>
