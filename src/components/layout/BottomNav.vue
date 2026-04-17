<template>
  <!--
    固定於螢幕最底部（viewpoint 底部，非容器底部）
    z-[5000] 確保在地圖、Modal 等所有圖層之上
  -->
  <nav
    class="fixed bottom-0 max-w-[1280px] left-1/2 -translate-x-1/2 w-full z-[5000] pb-safe"
    role="navigation"
    aria-label="主選單"
  >
    <!-- 滿版背景 + 毛玻璃 -->
    <div style="background: rgba(10,10,20,0.92); backdrop-filter: blur(20px); border-top: 1px solid rgba(255,255,255,0.06)">
      <!--
        內部按鈕容器：max-w-5xl 置中
        → 手機：按鈕跨滿寬
        → 桌機：按鈕限制於 1024px 內並置中，不散落於最兩側
      -->
      <div class="max-w-5xl mx-auto px-4 flex items-center justify-around py-2">
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
            <!-- 活躍光暈 -->
            <span v-if="isActive" class="nav-glow" />

            <!-- Lucide 圖示 -->
            <span
              class="nav-icon transition-all duration-200"
              :class="isActive ? 'text-neon-purple' : 'text-text-muted group-hover:text-text-secondary'"
            >
              <component :is="item.icon" :size="22" :stroke-width="isActive ? 2 : 1.5" />
            </span>

            <!-- 標籤 -->
            <span
              class="nav-label text-2xs font-medium transition-colors duration-200"
              :class="isActive ? 'text-neon-purple' : 'text-text-muted'"
            >
              {{ item.label }}
            </span>

            <!-- 路線計數胸章 -->
            <span
              v-if="item.id === 'route' && routeStore.waypointCount > 0"
              class="absolute -top-0.5 right-1.5 flex items-center justify-center
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
import { Map, Beer, Flag, Trophy, Camera, Home } from 'lucide-vue-next'
import { useRouteStore } from '@/stores/routes'

const routeStore = useRouteStore()

const navItems = [
  { id: 'home',        path: '/',            icon: Home,   label: '首頁' },
  { id: 'map',         path: '/map',         icon: Map,    label: '探索' },
  { id: 'route',       path: '/route',       icon: Beer,   label: '路跑' },
  { id: 'footprints',  path: '/footprints',  icon: Flag,   label: '足跡' },
  { id: 'leaderboard', path: '/leaderboard', icon: Trophy, label: '排行' },
  { id: 'photo-wall',  path: '/photo-wall',  icon: Camera, label: '時刻' },
]
</script>

<style scoped>
.nav-btn {
  @apply relative flex flex-col items-center gap-0.5
         px-4 py-2 rounded-xl flex-1 max-w-[80px]
         transition-all duration-200
         cursor-pointer select-none
         focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple;
}

.nav-glow {
  @apply absolute inset-0 rounded-xl -z-10;
  background: radial-gradient(ellipse at 50% 100%, rgba(192,132,252,0.18) 0%, transparent 70%);
}

.nav-btn--active .nav-icon {
  filter: drop-shadow(0 0 5px rgba(192,132,252,0.55));
}
</style>
