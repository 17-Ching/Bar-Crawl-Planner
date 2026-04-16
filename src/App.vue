<template>
  <div class="min-h-dvh flex flex-col bg-dark-950 text-text-primary">
    <!-- 全域背景光暈 -->
    <div class="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-pink/4 rounded-full blur-3xl" />
    </div>

    <!-- 主內容區 -->
    <main class="flex-1 relative z-10 pb-24">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </Transition>
      </RouterView>
    </main>

    <!-- 底部導覽列 -->
    <BottomNav />

    <!-- 全域 Toast 通知 -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BottomNav from '@/components/layout/BottomNav.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
onMounted(() => auth.init())
</script>

<style>
/* 頁面切換動畫 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
