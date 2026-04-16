<template>
  <!-- fixed 定位：確保在任何頁面捲動狀態下都正確疊加 -->
  <div
    class="fixed bottom-0 inset-x-0 z-[600] pb-safe"
    @click.stop
  >
    <div class="mx-3 mb-3 card border-dark-600/60 backdrop-blur-xl rounded-2xl overflow-hidden"
         style="background:rgba(15,15,26,0.95)">
      <!-- 拖拉把手 -->
      <div class="flex justify-center pt-3 pb-1">
        <div class="w-10 h-1 rounded-full bg-dark-600" />
      </div>

      <div class="px-4 pb-5 pt-2">
        <!-- 酒吧名稱 + 分類 -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <h2 class="font-display font-bold text-lg text-text-primary truncate">
              {{ bar.name || '未命名地點' }}
            </h2>
            <p class="text-text-muted text-xs mt-0.5 truncate">
              {{ bar.tags?.['addr:full'] || bar.tags?.['addr:street'] || '地址未知' }}
            </p>
          </div>
          <div class="shrink-0 flex items-center gap-2">
            <span :class="categoryBadge(bar.category)">
              {{ categoryLabel(bar.category) }}
            </span>
            <button
              @click="$emit('close')"
              class="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-700
                     text-text-muted hover:text-text-primary hover:bg-dark-600 transition-colors"
              aria-label="關閉"
            >×</button>
          </div>
        </div>

        <!-- 資訊行 -->
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="info-chip">
            <span class="text-lg">🕐</span>
            <span class="text-xs text-text-muted">{{ bar.tags?.opening_hours || '時間未知' }}</span>
          </div>
          <div class="info-chip">
            <span class="text-lg">📡</span>
            <span class="text-xs text-text-muted">OSM 資料</span>
          </div>
          <div class="info-chip">
            <span class="text-lg">💰</span>
            <span class="text-xs text-text-muted">{{ bar.avg_price ? `NT$${bar.avg_price}` : '未知' }}</span>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex gap-2">
          <button
            id="bar-add-waypoint-btn"
            @click="$emit('add-waypoint', bar)"
            class="btn btn-primary flex-1 !py-2.5"
          >
            <span>🍺</span>
            加入路線
          </button>
          <button
            id="bar-checkin-btn"
            @click="$emit('checkin', bar)"
            class="btn btn-secondary flex-1 !py-2.5"
          >
            <span>🚩</span>
            打卡
          </button>
          <a
            :href="`https://www.google.com/maps/dir/?api=1&destination=${bar.lat},${bar.lng}`"
            target="_blank"
            rel="noopener"
            class="btn btn-ghost !px-3 !py-2.5"
            aria-label="Google Maps 導航"
          >
            🧭
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ bar: { type: Object, required: true } })
defineEmits(['close', 'add-waypoint', 'checkin'])

const categoryLabel = (cat) => ({ bar: '酒吧', pub: 'Pub', convenience: '超商' }[cat] || cat)
const categoryBadge = (cat) => ({
  bar:         'badge-purple',
  pub:         'badge-pink',
  convenience: 'badge-cyan',
}[cat] || 'badge-muted')
</script>

<style scoped>
.info-chip {
  @apply flex flex-col items-center gap-1 p-2 rounded-xl bg-dark-800 border border-dark-600;
}
</style>
