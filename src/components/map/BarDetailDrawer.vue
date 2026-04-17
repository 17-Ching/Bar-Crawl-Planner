<template>
  <!--
    fixed 底部抽屜：z-[920] 高於地圖與 header
    pb-24 避開底部導覽列；max-w-md mx-auto 跟隨全局佈局
  -->
  <div
    class="fixed bottom-0 inset-x-0 z-[920] flex justify-center"
    @click.stop
  >
    <div class="w-full max-w-md px-3 pb-24">
      <div
        class="card border-dark-600/60 backdrop-blur-2xl rounded-2xl overflow-hidden"
        style="background: rgba(12,12,22,0.97)"
      >
        <!-- 拖拉把手 -->
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 rounded-full bg-dark-600" />
        </div>

        <div class="px-4 pb-5 pt-2">
          <!-- 酒吧名稱 + 分類 + 關閉 -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex-1 min-w-0">
              <h2 class="font-display font-bold text-lg text-text-primary truncate">
                {{ bar.name || '未命名地點' }}
              </h2>
              <p class="text-text-muted text-xs mt-0.5 flex items-center gap-1">
                <span class="material-symbols-outlined" style="font-size:14px">location_on</span>
                <span class="truncate">{{ bar.tags?.['addr:full'] || bar.tags?.['addr:street'] || '地址未知' }}</span>
              </p>
            </div>
            <div class="shrink-0 flex items-center gap-2">
              <span :class="categoryBadge(bar.category)">{{ categoryLabel(bar.category) }}</span>
              <button
                @click="$emit('close')"
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-700
                       text-text-muted hover:text-white hover:bg-dark-600 transition-colors"
                aria-label="關閉"
              >
                <span class="material-symbols-outlined" style="font-size:18px">close</span>
              </button>
            </div>
          </div>

          <!-- 資訊 Chips -->
          <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="info-chip">
              <span class="material-symbols-outlined text-neon-purple">schedule</span>
              <span class="text-xs text-text-muted text-center leading-tight">
                {{ bar.tags?.opening_hours || '時間未知' }}
              </span>
            </div>
            <div class="info-chip">
              <span class="material-symbols-outlined text-neon-cyan">database</span>
              <span class="text-xs text-text-muted">OSM 資料</span>
            </div>
            <div class="info-chip">
              <span class="material-symbols-outlined text-neon-amber">payments</span>
              <span class="text-xs text-text-muted">
                {{ bar.avg_price ? `NT$${bar.avg_price}` : '未知' }}
              </span>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="flex gap-2">
            <!-- 打卡 -->
            <button
              id="bar-checkin-btn"
              @click="$emit('checkin', bar)"
              class="btn btn-primary flex-1 !py-2.5 gap-2"
            >
              <span class="material-symbols-outlined" style="font-size:18px">where_to_vote</span>
              打卡
            </button>

            <!-- Google Maps 導航（外部連結） -->
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${bar.lat},${bar.lng}`"
              target="_blank"
              rel="noopener"
              class="btn btn-secondary flex-1 !py-2.5 gap-2 flex items-center justify-center text-sm font-semibold"
            >
              <span class="material-symbols-outlined" style="font-size:18px">map</span>
              在 Google Maps 開啟
            </a>
          </div>
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
  @apply flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-dark-800 border border-dark-600;
}
</style>
