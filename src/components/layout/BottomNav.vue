<template>
  <nav class="fixed bottom-0 inset-x-0 z-50 pb-safe" role="navigation" aria-label="主選單">
    <!-- 毛玻璃背景 -->
    <div class="mx-3 mb-3 rounded-2xl border border-dark-600/60 backdrop-blur-xl overflow-hidden"
         style="background: rgba(10,10,20,0.85)">
      <div class="flex items-center justify-around px-2 py-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :id="`nav-${item.id}`"
          custom
          v-slot="{ isActive, navigate }"
        >
          <button
            @click="navigate"
            class="nav-btn group"
            :class="{ 'nav-btn--active': isActive }"
            :aria-label="item.label"
            :aria-current="isActive ? 'page' : undefined"
          >
            <!-- 活躍背景光暈 -->
            <span v-if="isActive" class="nav-glow" />

            <!-- 圖示 -->
            <span class="nav-icon" :class="{ 'scale-110': isActive }">
              {{ item.icon }}
            </span>

            <!-- 標籤 -->
            <span class="nav-label" :class="isActive ? 'text-neon-purple' : 'text-text-muted'">
              {{ item.label }}
            </span>

            <!-- 紅點通知（路線規劃有待規劃點時顯示） -->
            <span
              v-if="item.id === 'route' && routeStore.waypointCount > 0"
              class="absolute -top-0.5 right-2 flex items-center justify-center
                     w-4 h-4 rounded-full bg-neon-pink text-white text-2xs font-bold"
            >
              {{ routeStore.waypointCount }}
            </span>
          </button>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouteStore } from '@/stores/routes'

const routeStore = useRouteStore()

const navItems = [
  { id: 'map',         path: '/',            icon: '🗺️',  label: '探索' },
  { id: 'route',       path: '/route',       icon: '🍺',  label: '路跑' },
  { id: 'footprints',  path: '/footprints',  icon: '🚩',  label: '足跡' },
  { id: 'leaderboard', path: '/leaderboard', icon: '🏆',  label: '排行' },
  { id: 'photo-wall',  path: '/photo-wall',  icon: '📸',  label: '時刻' },
]
</script>

<style scoped>
.nav-btn {
  @apply relative flex flex-col items-center gap-0.5
         px-3 py-1.5 rounded-xl flex-1
         transition-all duration-200
         cursor-pointer select-none
         focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple;
}
.nav-btn--active .nav-icon {
  filter: drop-shadow(0 0 6px rgba(192,132,252,0.7));
}

.nav-glow {
  @apply absolute inset-0 rounded-xl -z-10;
  background: radial-gradient(ellipse at 50% 100%, rgba(192,132,252,0.18) 0%, transparent 70%);
}

.nav-icon {
  @apply text-xl leading-none transition-transform duration-200;
}

.nav-label {
  @apply text-2xs font-medium transition-colors duration-200;
}
</style>
