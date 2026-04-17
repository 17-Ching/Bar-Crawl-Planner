import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首頁', icon: '🏠' },
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('@/views/MapView.vue'),
    meta: { title: '探索地圖', icon: '🗺️' },
  },
  {
    path: '/route',
    name: 'RoutePlanner',
    component: () => import('@/views/RoutePlannerView.vue'),
    meta: { title: '路線規劃', icon: '🍺' },
  },
  {
    path: '/footprints',
    name: 'Footprints',
    component: () => import('@/views/FootprintsView.vue'),
    meta: { title: '我的足跡', icon: '🚩' },
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('@/views/LeaderboardView.vue'),
    meta: { title: '排行榜', icon: '🏆' },
  },
  {
    path: '/photo-wall',
    name: 'PhotoWall',
    component: () => import('@/views/PhotoWallView.vue'),
    meta: { title: '微醺時刻', icon: '📸' },
  },
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: () => import('@/views/ProfileEditView.vue'),
    meta: { title: '編輯個人資料' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
})

// 更新頁面 title
router.afterEach((to) => {
  const base = '不醉不歸'
  document.title = to.meta.title ? `${to.meta.title} — ${base}` : base
})

export default router
