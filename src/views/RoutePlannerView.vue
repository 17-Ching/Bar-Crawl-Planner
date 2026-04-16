<template>
  <div class="min-h-dvh flex flex-col">
    <!-- ── 頁面標題 ── -->
    <header class="px-4 pt-14 pb-4">
      <h1 class="font-display font-bold text-2xl text-neon-gradient">🍺 酒精路跑規劃</h1>
      <p class="text-text-muted text-sm mt-1">在地圖上加入酒吧或超商，一鍵規劃最佳路線</p>
    </header>

    <!-- ── 地圖 ── -->
    <div id="route-map" ref="mapEl" class="h-56 mx-3 rounded-2xl border border-dark-600 overflow-hidden" />

    <div class="flex-1 px-4 mt-4 space-y-4 overflow-y-auto pb-4">

      <!-- ── 中繼點列表 ── -->
      <section>
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider">路線中繼點</h2>
          <button
            v-if="routeStore.waypointCount"
            @click="routeStore.clearWaypoints()"
            class="text-xs text-text-muted hover:text-neon-pink transition-colors"
          >全部清除</button>
        </div>

        <!-- 空狀態 -->
        <div v-if="!routeStore.waypointCount" class="card border-dashed border-dark-500 p-6 text-center">
          <p class="text-3xl mb-2">🗺️</p>
          <p class="text-text-muted text-sm">點擊地圖上的酒吧標記，<br>按「加入路線」來新增中繼點</p>
        </div>

        <!-- 中繼點卡片 -->
        <TransitionGroup name="list" tag="div" class="space-y-2">
          <div
            v-for="(wp, idx) in routeStore.waypoints"
            :key="wp.bar.id"
            class="card p-3 flex items-center gap-3 animate-in"
            :class="`stagger-${Math.min(idx+1, 5)}`"
          >
            <!-- 順序號 -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                 :style="{ background: `hsl(${idx * 60 + 270}, 70%, 60%)` }">
              {{ idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm truncate">{{ wp.bar.name }}</p>
              <p class="text-xs text-text-muted">{{ categoryLabel(wp.bar.category) }}</p>
            </div>
            <button
              @click="routeStore.removeWaypoint(wp.bar.id)"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted
                     hover:text-neon-pink hover:bg-dark-700 transition-colors text-lg shrink-0"
              aria-label="移除"
            >×</button>
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
          <!-- 難度標示 -->
          <div class="mt-3 flex items-center gap-2">
            <span class="text-text-muted text-xs">難度：</span>
            <span :class="difficultyBadge">{{ difficultyLabel }}</span>
          </div>
        </section>
      </Transition>

      <!-- ── 操作按鈕區 ── -->
      <div class="space-y-2 pb-2">
        <button
          id="plan-route-btn"
          @click="planRoute"
          :disabled="!routeStore.canPlan || routeStore.loading"
          class="btn btn-primary w-full btn-lg"
          :class="{ 'opacity-50 cursor-not-allowed': !routeStore.canPlan }"
        >
          <span v-if="routeStore.loading" class="animate-spin">⏳</span>
          <span v-else>🗺️</span>
          {{ routeStore.loading ? '規劃中...' : '開始規劃路線' }}
        </button>

        <button
          v-if="routeStore.routeStats"
          id="save-route-btn"
          @click="showSaveModal = true"
          class="btn btn-secondary w-full"
        >
          💾 儲存此路線
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import { useRouteStore } from '@/stores/routes'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { MAP_CONFIG } from '@/config'
import StatCard from '@/components/ui/StatCard.vue'
import SaveRouteModal from '@/components/route/SaveRouteModal.vue'

const routeStore = useRouteStore()
const authStore  = useAuthStore()
const { success, error: toastError } = useToast()

const mapEl       = ref(null)
const showSaveModal = ref(false)

let map = null
let routeLayer  = null
let markerGroup = null

const categoryLabel = (cat) => ({ bar: '酒吧', pub: 'Pub', convenience: '超商' }[cat] || cat)

const difficultyLabel = { easy: '輕鬆入門 🟢', medium: '小有挑戰 🟡', hard: '重度路跑 🔴' }
const difficultyBadge = {
  easy:   'badge-cyan',
  medium: 'badge-amber',
  hard:   'badge badge-red bg-red-500/15 text-red-400 border-red-500/30',
}

const difficultyLabel2 = routeStore.routeStats
  ? difficultyLabel[routeStore.routeStats.difficulty] : ''

onMounted(() => {
  map = L.map(mapEl.value, {
    center: MAP_CONFIG.defaultCenter,
    zoom: MAP_CONFIG.defaultZoom,
    zoomControl: false,
  })
  L.tileLayer(MAP_CONFIG.tileLayer.url, {
    attribution: MAP_CONFIG.tileLayer.attribution,
    subdomains:  MAP_CONFIG.tileLayer.subdomains,
  }).addTo(map)

  routeLayer  = L.layerGroup().addTo(map)
  markerGroup = L.layerGroup().addTo(map)
})

onUnmounted(() => map?.remove())

// 監聽中繼點變化，更新地圖標記
watch(() => routeStore.waypoints, (wps) => {
  markerGroup?.clearLayers()
  wps.forEach((wp, idx) => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;background:hsl(${idx*60+270},70%,60%);
        border-radius:50%;border:2px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:12px;font-weight:700;color:#fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.4)">
        ${idx+1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
    L.marker([wp.bar.lat, wp.bar.lng], { icon }).addTo(markerGroup)
  })
  if (wps.length) {
    const bounds = L.latLngBounds(wps.map(w => [w.bar.lat, w.bar.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }
}, { deep: true })

// 監聽路線繪製
watch(() => routeStore.routeGeometry, (geom) => {
  routeLayer?.clearLayers()
  if (!geom) return
  L.geoJSON(geom, {
    style: {
      color: '#C084FC',
      weight: 4,
      opacity: 0.85,
      dashArray: '8, 6',
      lineCap: 'round',
      lineJoin: 'round',
    },
  }).addTo(routeLayer)
})

async function planRoute() {
  if (!routeStore.canPlan) return
  await routeStore.planRoute()
  if (routeStore.routeStats) {
    success('路線規劃完成！✨')
  } else {
    toastError('路線規劃失敗，請稍後再試')
  }
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
  if (!error) {
    success('路線已儲存！🎉')
    showSaveModal.value = false
  } else {
    toastError('儲存失敗，請稍後再試')
  }
}

const difficultyBadgeClass = (d) => ({
  easy: 'badge-cyan', medium: 'badge-amber', hard: 'badge text-red-400 bg-red-500/15 border-red-500/30'
}[d] || 'badge-muted')
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
