<template>
  <div class="relative h-dvh w-full flex flex-col">

    <!-- ── 頂部搜尋列 ── -->
    <header class="absolute top-0 inset-x-0 z-[400] p-3">
      <div class="glass-card p-3 flex items-center gap-3">
        <!-- App Logo -->
        <div class="shrink-0">
          <span class="font-display font-bold text-lg text-neon-gradient">🍺</span>
        </div>

        <!-- 搜尋框 -->
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</span>
          <input
            id="map-search-input"
            v-model="searchQuery"
            type="text"
            placeholder="搜尋酒吧、地址..."
            class="input-base pl-9 pr-4 h-9 text-sm"
            @keydown.enter="handleSearch"
          />
        </div>

        <!-- 定位按鈕 -->
        <button
          id="map-locate-btn"
          @click="locateMe"
          class="btn btn-secondary btn-sm shrink-0 !px-3"
          :class="{ 'border-neon-cyan text-neon-cyan': isLocating }"
          aria-label="定位我的位置"
        >
          <span class="text-base">{{ isLocating ? '📡' : '📍' }}</span>
        </button>

        <!-- 登入 / 用戶頭像 -->
        <button
          id="map-login-btn"
          @click="showLoginModal = true"
          class="shrink-0 w-9 h-9 rounded-xl overflow-hidden border border-dark-600
                 hover:border-neon-purple transition-colors flex items-center justify-center
                 bg-dark-800 text-base"
          :aria-label="authStore.isLoggedIn ? '個人資料' : '登入'"
        >
          <img v-if="authStore.profile?.avatar_url"
               :src="authStore.profile.avatar_url"
               class="w-full h-full object-cover" />
          <span v-else>{{ authStore.isLoggedIn ? '👤' : '🔐' }}</span>
        </button>
      </div>

      <!-- 分類篩選 Chips -->
      <div class="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat.id"
          :id="`filter-${cat.id}`"
          @click="toggleCategory(cat.id)"
          class="shrink-0 btn btn-sm !gap-1.5 !py-1.5 transition-all"
          :class="activeCategories.has(cat.id)
            ? 'bg-gradient-brand text-white border-transparent shadow-neon-purple'
            : 'btn-secondary'"
        >
          <span>{{ cat.icon }}</span>
          <span class="text-xs">{{ cat.label }}</span>
          <span v-if="activeCategories.has(cat.id)" class="text-xs opacity-70">
            ({{ countByCategory(cat.id) }})
          </span>
        </button>
      </div>
    </header>

    <!-- ── Leaflet 地圖 ── -->
    <div id="main-map" class="flex-1 w-full" ref="mapEl" />

    <!-- ── 右下角工具按鈕 ── -->
    <div class="absolute bottom-28 right-4 z-[400] flex flex-col gap-2">
      <button
        id="map-refresh-btn"
        @click="loadPOIs"
        class="w-11 h-11 rounded-xl glass-card border flex items-center justify-center
               text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/40
               transition-all duration-200 active:scale-95"
        aria-label="重新載入附近地點"
        :class="{ 'animate-spin': barsStore.loading }"
      >
        🔄
      </button>
    </div>

    <!-- ── 底部統計列 ── -->
    <div class="absolute bottom-24 inset-x-3 z-[400]" v-if="barsStore.bars.length">
      <div class="glass-card px-4 py-2 flex items-center justify-between">
        <div class="flex items-center gap-4 text-sm">
          <span class="text-text-muted">附近</span>
          <span class="text-neon-purple font-semibold">{{ barsStore.bars.length }} 間酒吧</span>
          <span class="text-neon-cyan font-semibold">{{ convenienceCount }} 間超商</span>
        </div>
        <span class="badge-purple">{{ currentAreaName }}</span>
      </div>
    </div>

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

    <!-- ── 登入 Modal ── -->
    <Transition name="modal">
      <LoginModal v-if="showLoginModal" @close="showLoginModal = false" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import { useBarsStore } from '@/stores/bars'
import { useRouteStore } from '@/stores/routes'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { MAP_CONFIG } from '@/config'
import BarDetailDrawer from '@/components/map/BarDetailDrawer.vue'
import LoginModal from '@/components/auth/LoginModal.vue'

const barsStore  = useBarsStore()
const routeStore = useRouteStore()
const authStore  = useAuthStore()
const { success, error: toastError, info } = useToast()

const showLoginModal = ref(false)

// ── Demo 假資料（台北市知名酒吧，確保畫面不空白）─────────
const DEMO_BARS = [
  { id: 'demo_1', name: 'Alchemy Bar',        lat: 25.0445, lng: 121.5632, category: 'bar',         tags: { opening_hours: '20:00–02:00' } },
  { id: 'demo_2', name: 'The Rabbit Hole',    lat: 25.0412, lng: 121.5544, category: 'bar',         tags: { opening_hours: '19:00–02:00' } },
  { id: 'demo_3', name: 'Revolver',           lat: 25.0438, lng: 121.5607, category: 'pub',         tags: { opening_hours: '17:00–03:00' } },
  { id: 'demo_4', name: 'Draft Land',         lat: 25.0421, lng: 121.5578, category: 'bar',         tags: { opening_hours: '15:00–00:00' } },
  { id: 'demo_5', name: '全家 FamilyMart',    lat: 25.0430, lng: 121.5595, category: 'convenience', tags: {} },
  { id: 'demo_6', name: 'Bar Mood Taipei',    lat: 25.0397, lng: 121.5513, category: 'bar',         tags: { opening_hours: '20:00–03:00' } },
  { id: 'demo_7', name: 'Indulge Bistro',     lat: 25.0462, lng: 121.5620, category: 'bar',         tags: { opening_hours: '18:00–02:00' } },
  { id: 'demo_8', name: '7-ELEVEN',           lat: 25.0453, lng: 121.5648, category: 'convenience', tags: {} },
  { id: 'demo_9', name: 'C\'est La Vie',      lat: 25.0388, lng: 121.5532, category: 'pub',         tags: { opening_hours: '17:00–02:00' } },
  { id: 'demo_10',name: 'Marquee Taipei',     lat: 25.0475, lng: 121.5560, category: 'bar',         tags: { opening_hours: '22:00–06:00' } },
]

const mapEl      = ref(null)
const searchQuery = ref('')
const isLocating = ref(false)
const selectedBar = ref(null)
const currentAreaName = ref('台北市')

let map = null
let markersLayer = null
let userMarker   = null
let markerClicked = false  // flag 防止 marker click 被地圖 click 覆蓋

const categories = [
  { id: 'bar',         icon: '🍺', label: '酒吧'  },
  { id: 'pub',         icon: '🍻', label: 'Pub'   },
  { id: 'convenience', icon: '🏪', label: '超商'  },
]
const activeCategories = ref(new Set(['bar', 'pub', 'convenience']))

const filteredBars = computed(() =>
  barsStore.bars.filter(b => activeCategories.value.has(b.category))
)

const convenienceCount = computed(() =>
  barsStore.bars.filter(b => b.category === 'convenience').length
)

const countByCategory = (id) => barsStore.bars.filter(b => b.category === id).length

function toggleCategory(id) {
  activeCategories.value.has(id)
    ? activeCategories.value.delete(id)
    : activeCategories.value.add(id)
  renderMarkers()
}

// ── 地圖初始化 ───────────────────────────────────────────
onMounted(() => {
  map = L.map(mapEl.value, {
    center: MAP_CONFIG.defaultCenter,
    zoom: MAP_CONFIG.defaultZoom,
    zoomControl: false,
    attributionControl: true,
  })

  // CartoDB Dark Matter 免費深色底圖
  L.tileLayer(MAP_CONFIG.tileLayer.url, {
    attribution: MAP_CONFIG.tileLayer.attribution,
    subdomains:  MAP_CONFIG.tileLayer.subdomains,
    maxZoom:     MAP_CONFIG.tileLayer.maxZoom,
  }).addTo(map)

  // 縮放控制移到右上
  L.control.zoom({ position: 'topright' }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)

  // 點擊空白處關閉詳情（使用 flag 避免與 marker click 衝突）
  map.on('click', () => {
    if (markerClicked) { markerClicked = false; return }
    selectedBar.value = null
  })

  // 初始載入 POI
  loadPOIs()
})

onUnmounted(() => { map?.remove() })

// ── 載入 POI 標記 ────────────────────────────────────────
async function loadPOIs() {
  const center = map.getCenter()
  const zoom   = map.getZoom()
  const radiusM = zoom >= 15 ? 800 : zoom >= 13 ? 1500 : 3000

  // 同時查詢酒吧 + 超商
  const [bars, pubs, stores] = await Promise.all([
    barsStore.fetchFromOverpass({ lat: center.lat, lng: center.lng, radiusM, type: 'bar' }),
    barsStore.fetchFromOverpass({ lat: center.lat, lng: center.lng, radiusM, type: 'pub' }),
    barsStore.fetchFromOverpass({ lat: center.lat, lng: center.lng, radiusM, type: 'convenience' }),
  ])

  const all = [...bars, ...pubs, ...stores]
  // 若 Overpass 無結果（例如查詢逾時或離台以外地區），使用 Demo 資料
  barsStore.bars = all.length > 0 ? all : DEMO_BARS
  renderMarkers()
}

// ── 渲染標記點 ───────────────────────────────────────────
function renderMarkers() {
  markersLayer.clearLayers()
  filteredBars.value.forEach(bar => {
    const icon = createMarkerIcon(bar.category)
    const marker = L.marker([bar.lat, bar.lng], { icon })
    marker.on('click', () => {
      markerClicked = true
      selectedBar.value = bar
    })
    markersLayer.addLayer(marker)
  })
}

function createMarkerIcon(category) {
  const config = {
    bar:         { emoji: '🍺', color: '#C084FC', glow: 'rgba(192,132,252,0.6)' },
    pub:         { emoji: '🍻', color: '#F472B6', glow: 'rgba(244,114,182,0.6)' },
    convenience: { emoji: '🏪', color: '#22D3EE', glow: 'rgba(34,211,238,0.6)'  },
  }
  const c = config[category] || config.bar
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width:40px; height:40px;
        background:rgba(15,15,26,0.9);
        border:2px solid ${c.color};
        border-radius:50% 50% 50% 4px;
        transform:rotate(-45deg);
        box-shadow:0 0 12px ${c.glow};
        display:flex; align-items:center; justify-content:center;
        cursor:pointer;
      ">
        <span style="transform:rotate(45deg);font-size:18px;line-height:1;">${c.emoji}</span>
      </div>
    `,
    iconSize:   [40, 40],
    iconAnchor: [20, 40],
    popupAnchor:[0, -44],
  })
}

// ── 定位 ─────────────────────────────────────────────────
function locateMe() {
  if (!navigator.geolocation) {
    toastError('您的瀏覽器不支援 GPS 定位')
    return
  }
  isLocating.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { latitude: lat, longitude: lng } = coords
      map.flyTo([lat, lng], 15, { duration: 1.2 })

      if (userMarker) userMarker.remove()
      userMarker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: '#C084FC',
        fillOpacity: 1,
        color: '#fff',
        weight: 2,
        className: 'animate-ping-slow',
      }).addTo(map).bindPopup('你在這裡 📍')

      isLocating.value = false
      loadPOIs()
    },
    () => {
      isLocating.value = false
      toastError('無法取得位置，請確認已授權 GPS')
    },
    { timeout: 8000, enableHighAccuracy: true }
  )
}

function handleSearch() {
  info(`搜尋「${searchQuery.value}」功能開發中 ✨`)
}

function handleAddWaypoint(bar) {
  routeStore.addWaypoint(bar)
  success(`已將「${bar.name}」加入路線！`)
  selectedBar.value = null
}

function handleCheckin(bar) {
  info(`打卡功能請至「足跡」頁面操作`)
}

// 地圖移動完畢後重新載入 POI
watch(() => map?.getCenter(), () => {}, { lazy: true })
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { scrollbar-width: none; }

/* 底部抽屜動畫 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
/* Modal 動畫 */
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.95); }
</style>
