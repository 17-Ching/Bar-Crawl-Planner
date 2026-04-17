<template>
  <div class="min-h-dvh flex flex-col">
    <!-- ── 頁首 ── -->
    <header class="px-4 pt-14 pb-3">
      <h1 class="font-display font-bold text-2xl text-neon-gradient">🍺 酒精路跑規劃</h1>
      <p class="text-text-muted text-sm mt-1">點選地圖地標或選擇推薦路線，一鍵規劃！</p>
    </header>

    <!-- ── 地圖（可點選地標加入路線）── -->
    <div id="route-map" ref="mapEl"
         class="h-52 mx-3 rounded-2xl border border-dark-600 overflow-hidden shrink-0" />

    <div class="flex-1 px-4 mt-4 space-y-4 overflow-y-auto pb-6">

      <!-- ── 推薦路線區塊 ── -->
      <section>
        <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined" style="font-size:18px;color:#C084FC">local_bar</span>
          精選路線
        </h2>
        <div class="space-y-2">
          <div
            v-for="preset in PRESET_ROUTES"
            :key="preset.id"
            class="card p-3 flex items-center gap-3 hover:border-neon-purple/40 transition-all cursor-pointer group"
            @click="loadPresetRoute(preset)"
          >
            <!-- 路線顏色標籤 -->
            <div class="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-xl font-bold"
                 :style="`background: ${preset.color}22; border: 1.5px solid ${preset.color}66`">
              {{ preset.emoji }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm group-hover:text-neon-purple transition-colors">{{ preset.name }}</p>
              <p class="text-xs text-text-muted truncate">{{ preset.desc }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge-purple text-2xs px-2 py-0.5">{{ preset.waypoints.filter(w=>w.category!=='convenience').length }} 間酒吧</span>
                <span class="badge-cyan text-2xs px-2 py-0.5">{{ preset.waypoints.filter(w=>w.category==='convenience').length }} 間超商</span>
                <span class="text-2xs text-text-muted">約 {{ preset.estMin }} 分鐘</span>
              </div>
            </div>
            <span class="material-symbols-outlined text-text-muted group-hover:text-neon-purple transition-colors shrink-0">
              play_circle
            </span>
          </div>
        </div>
      </section>

      <!-- ── 中繼點列表 ── -->
      <section>
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <span class="material-symbols-outlined" style="font-size:18px;color:#22D3EE">route</span>
            路線中繼點
            <span v-if="routeStore.waypointCount" class="badge-cyan text-2xs">{{ routeStore.waypointCount }}</span>
          </h2>
          <button
            v-if="routeStore.waypointCount"
            @click="routeStore.clearWaypoints()"
            class="text-xs text-text-muted hover:text-neon-pink transition-colors flex items-center gap-1"
          >
            <span class="material-symbols-outlined" style="font-size:14px">delete_sweep</span>
            全部清除
          </button>
        </div>

        <!-- 空狀態 -->
        <div v-if="!routeStore.waypointCount" class="card border-dashed border-dark-500 p-6 text-center">
          <span class="material-symbols-outlined text-text-muted mb-2" style="font-size:40px">map</span>
          <p class="text-text-muted text-sm">點選上方地圖地標或選擇推薦路線<br>開始規劃你的酒精路跑</p>
        </div>

        <!-- 中繼點卡片 -->
        <TransitionGroup name="list" tag="div" class="space-y-2">
          <div
            v-for="(wp, idx) in routeStore.waypoints"
            :key="wp.bar.id"
            class="card p-3 flex items-center gap-3 animate-in"
            :class="`stagger-${Math.min(idx+1, 5)}`"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white"
                 :style="{ background: `hsl(${idx * 60 + 270}, 70%, 55%)` }">
              {{ idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm truncate">{{ wp.bar.name }}</p>
              <p class="text-xs text-text-muted">{{ categoryLabel(wp.bar.category) }}</p>
            </div>
            <button
              @click="routeStore.removeWaypoint(wp.bar.id)"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted
                     hover:text-neon-pink hover:bg-dark-700 transition-colors shrink-0"
              aria-label="移除"
            >
              <span class="material-symbols-outlined" style="font-size:18px">close</span>
            </button>
          </div>
        </TransitionGroup>
      </section>

      <!-- ── 路線統計 ── -->
      <Transition name="fade">
        <section v-if="routeStore.routeStats" class="card p-4 border-neon-purple/20">
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">路線統計</h2>
          <div class="grid grid-cols-2 gap-3">
            <StatCard icon="📏" label="總距離" :value="`${routeStore.routeStats.distanceKm} km`" color="purple" />
            <StatCard icon="⏱️" label="步行時間" :value="`${routeStore.routeStats.durationMin} 分鐘`" color="cyan" />
            <StatCard icon="🍺" label="酒吧站點" :value="`${routeStore.routeStats.barCount} 間`" color="pink" />
            <StatCard icon="🏪" label="超商補給" :value="`${routeStore.routeStats.convenienceCount} 間`" color="amber" />
          </div>
          <div class="mt-3 flex items-center gap-2">
            <span class="text-text-muted text-xs">難度：</span>
            <span :class="difficultyBadgeClass">{{ difficultyLabelText }}</span>
          </div>
        </section>
      </Transition>

      <!-- ── 操作按鈕 ── -->
      <div class="space-y-2 pb-2">
        <button
          id="plan-route-btn"
          @click="planRoute"
          :disabled="!routeStore.canPlan || routeStore.loading"
          class="btn btn-primary w-full btn-lg"
          :class="{ 'opacity-50 cursor-not-allowed': !routeStore.canPlan }"
        >
          <span v-if="routeStore.loading" class="material-symbols-outlined animate-spin">progress_activity</span>
          <span v-else class="material-symbols-outlined">directions_walk</span>
          {{ routeStore.loading ? '規劃中...' : '開始規劃路線' }}
        </button>

        <button
          v-if="routeStore.routeStats"
          id="save-route-btn"
          @click="showSaveModal = true"
          class="btn btn-secondary w-full gap-2"
        >
          <span class="material-symbols-outlined" style="font-size:18px">save</span>
          儲存此路線
        </button>
      </div>
    </div>

    <!-- ── 儲存路線 Modal ── -->
    <Transition name="modal">
      <SaveRouteModal
        v-if="showSaveModal"
        @save="handleSave"
        @cancel="showSaveModal = false"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import { useRouteStore } from '@/stores/routes'
import { useAuthStore } from '@/stores/auth'
import { useBarsStore } from '@/stores/bars'
import { useToast } from '@/composables/useToast'
import { MAP_CONFIG } from '@/config'
import StatCard from '@/components/ui/StatCard.vue'
import SaveRouteModal from '@/components/route/SaveRouteModal.vue'

const routeStore = useRouteStore()
const authStore  = useAuthStore()
const barsStore  = useBarsStore()
const { success, error: toastError } = useToast()

const mapEl        = ref(null)
const showSaveModal = ref(false)

let map          = null
let routeLayer   = null
let markerGroup  = null
let poiGroup     = null

// ── 推薦路線資料（由產品經理規劃）──────────────────────────
const PRESET_ROUTES = [
  {
    id: 'xinyi_express',
    name: '信義區失憶快線',
    emoji: '🌃',
    desc: '從 ATT 到林安泰，信義夜晚一路微醺跌撞',
    color: '#C084FC',
    estMin: 90,
    waypoints: [
      { id: 'pr_1',  name: 'Marquee Taipei',   lat: 25.0339, lng: 121.5644, category: 'bar',         tags: {} },
      { id: 'pr_2',  name: 'A-ONE Mixology',   lat: 25.0358, lng: 121.5621, category: 'bar',         tags: {} },
      { id: 'pr_3',  name: '7-ELEVEN 補給站',  lat: 25.0370, lng: 121.5602, category: 'convenience', tags: {} },
      { id: 'pr_4',  name: 'Barcode Taipei',   lat: 25.0382, lng: 121.5580, category: 'bar',         tags: {} },
      { id: 'pr_5',  name: 'Alchemy Bar',      lat: 25.0394, lng: 121.5555, category: 'bar',         tags: {} },
    ],
  },
  {
    id: 'zhongshan_literary',
    name: '中山文青微醺遊',
    emoji: '🎨',
    desc: '赤峰街出發，沿林森北路，玩轉文青 × 夜生活',
    color: '#F472B6',
    estMin: 75,
    waypoints: [
      { id: 'pr_6',  name: 'Revolver',         lat: 25.0536, lng: 121.5228, category: 'pub',         tags: {} },
      { id: 'pr_7',  name: '赤峰 25 號',       lat: 25.0522, lng: 121.5220, category: 'bar',         tags: {} },
      { id: 'pr_8',  name: '全家前進站',       lat: 25.0508, lng: 121.5232, category: 'convenience', tags: {} },
      { id: 'pr_9',  name: 'Bar de Luxe',      lat: 25.0492, lng: 121.5250, category: 'bar',         tags: {} },
      { id: 'pr_10', name: 'The Diner Bar',    lat: 25.0475, lng: 121.5270, category: 'pub',         tags: {} },
    ],
  },
  {
    id: 'daan_craft',
    name: '大安精釀冒險',
    emoji: '🍻',
    desc: '師大夜市出發，精釀啤酒一路向東探索',
    color: '#22D3EE',
    estMin: 60,
    waypoints: [
      { id: 'pr_11', name: 'Draft Land',       lat: 25.0258, lng: 121.5316, category: 'bar',         tags: {} },
      { id: 'pr_12', name: '樂啤露',           lat: 25.0272, lng: 121.5340, category: 'pub',         tags: {} },
      { id: 'pr_13', name: '全家師大路',       lat: 25.0285, lng: 121.5364, category: 'convenience', tags: {} },
      { id: 'pr_14', name: 'The Tap Room',     lat: 25.0298, lng: 121.5392, category: 'bar',         tags: {} },
    ],
  },
]

const categoryLabel = (cat) => ({ bar: '酒吧', pub: 'Pub', convenience: '超商' }[cat] || cat)

// ── 難度標籤 computed ──────────────────────────────────────
const DIFFICULTY_LABELS = { easy: '輕鬆入門 🟢', medium: '小有挑戰 🟡', hard: '重度路跑 🔴' }
const DIFFICULTY_BADGES = {
  easy:   'badge-cyan',
  medium: 'badge-amber',
  hard:   'badge bg-red-500/15 text-red-400 border border-red-500/30',
}
const difficultyLabelText = computed(() =>
  DIFFICULTY_LABELS[routeStore.routeStats?.difficulty] || '—'
)
const difficultyBadgeClass = computed(() =>
  DIFFICULTY_BADGES[routeStore.routeStats?.difficulty] || 'badge-muted'
)

// ── 地圖初始化 ─────────────────────────────────────────────
onMounted(() => {
  map = L.map(mapEl.value, {
    center:      MAP_CONFIG.defaultCenter,
    zoom:        MAP_CONFIG.defaultZoom,
    zoomControl: false,
  })
  L.tileLayer(MAP_CONFIG.tileLayer.url, {
    attribution: MAP_CONFIG.tileLayer.attribution,
    subdomains:  MAP_CONFIG.tileLayer.subdomains,
  }).addTo(map)

  routeLayer  = L.layerGroup().addTo(map)
  markerGroup = L.layerGroup().addTo(map)  // 已加入路線的標記（帶序號）
  poiGroup    = L.layerGroup().addTo(map)  // 可點選的 POI 地標

  // 渲染 barsStore 現有地標（從探索頁帶過來的資料）
  renderPOIMarkers()
})

onUnmounted(() => map?.remove())

// ── 渲染可點選 POI（讓使用者在路跑頁也能點選加入）─────────
function renderPOIMarkers() {
  poiGroup?.clearLayers()
  const bars = barsStore.bars.length > 0 ? barsStore.bars : []
  bars.forEach(bar => {
    const cfg = {
      bar:         { emoji: '🍺', color: '#C084FC' },
      pub:         { emoji: '🍻', color: '#F472B6' },
      convenience: { emoji: '🏪', color: '#22D3EE' },
    }
    const c = cfg[bar.category] || cfg.bar
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-inner" style="
        width:34px;height:34px;
        background:rgba(15,15,26,0.9);
        border:2px solid ${c.color};
        border-radius:50% 50% 50% 4px;transform:rotate(-45deg);
        box-shadow:0 0 8px ${c.color}60;
        display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <span style="transform:rotate(45deg);font-size:15px;line-height:1;">${c.emoji}</span>
      </div>`,
      iconSize: [34,34], iconAnchor: [17,34],
    })
    const marker = L.marker([bar.lat, bar.lng], { icon })
    marker.on('click', () => {
      routeStore.addWaypoint(bar)
      success(`✅ 已加入「${bar.name}」`)
    })
    poiGroup.addLayer(marker)
  })
}

// ── 監聽中繼點：更新路線序號 Marker ──────────────────────
watch(() => routeStore.waypoints, (wps) => {
  markerGroup?.clearLayers()
  wps.forEach((wp, idx) => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;background:hsl(${idx*60+270},70%,55%);
        border-radius:50%;border:2px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:12px;font-weight:700;color:#fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.4)">
        ${idx+1}</div>`,
      iconSize: [28,28], iconAnchor: [14,14],
    })
    L.marker([wp.bar.lat, wp.bar.lng], { icon }).addTo(markerGroup)
  })
  if (wps.length) {
    const bounds = L.latLngBounds(wps.map(w => [w.bar.lat, w.bar.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }
}, { deep: true })

// ── 監聽路線繪製 ───────────────────────────────────────────
watch(() => routeStore.routeGeometry, (geom) => {
  routeLayer?.clearLayers()
  if (!geom) return
  L.geoJSON(geom, {
    style: { color: '#C084FC', weight: 4, opacity: 0.85, dashArray: '8,6', lineCap: 'round' },
  }).addTo(routeLayer)
})

// ── 一鍵載入推薦路線 ───────────────────────────────────────
async function loadPresetRoute(preset) {
  routeStore.clearWaypoints()
  preset.waypoints.forEach(bar => routeStore.addWaypoint(bar))
  success(`🗺️ 已載入「${preset.name}」，正在規劃路線…`)
  await routeStore.planRoute()
  if (routeStore.routeStats) {
    success(`✅「${preset.name}」規劃完成！共 ${routeStore.routeStats.distanceKm} km`)
  }
}

// ── 手動規劃路線 ───────────────────────────────────────────
async function planRoute() {
  if (!routeStore.canPlan) return
  await routeStore.planRoute()
  if (routeStore.routeStats) success('路線規劃完成！✨')
  else toastError('路線規劃失敗，請稍後再試')
}

async function handleSave(formData) {
  if (!authStore.isLoggedIn) {
    toastError('請先登入才能儲存路線')
    showSaveModal.value = false
    return
  }
  const { error } = await routeStore.saveRoute({
    ...formData,
    creatorId: authStore.user.id,
  })
  if (!error) { success('路線已儲存！🎉'); showSaveModal.value = false }
  else toastError('儲存失敗，請稍後再試')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.list-enter-active { transition: all 0.3s ease; }
.list-leave-active { transition: all 0.2s ease; }
.list-enter-from   { opacity: 0; transform: translateX(-16px); }
.list-leave-to     { opacity: 0; transform: translateX(16px); }

.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.95); }
</style>
