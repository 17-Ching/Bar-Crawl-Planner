<template>
  <div class="min-h-dvh bg-dark-950 text-text-primary">

    <!-- 全域背景光暈 -->
    <div class="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <div class="absolute top-0 left-1/3 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-pink/4 rounded-full blur-3xl" />
    </div>

    <!-- 主內容區：解除全局 width 限制，將寬度控制下放到各自的視圖，以達成地圖滿版 -->
    <main class="relative z-10 min-h-dvh pb-24">
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

    <!-- 全域登入 Modal -->
    <Transition name="modal">
      <LoginModal v-if="auth.showLoginModal" @close="auth.showLoginModal = false" />
    </Transition>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BottomNav from '@/components/layout/BottomNav.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import LoginModal from '@/components/auth/LoginModal.vue'

const auth = useAuthStore()
onMounted(() => auth.init())
</script>

<style>
/* 頁面切換動畫 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to   { opacity: 0; transform: translateY(-3px); }

/* VueDatePicker 深色主題 */
.dp__theme_dark {
  --dp-background-color:    #161625 !important;
  --dp-text-color:          #F1F0FF !important;
  --dp-hover-color:         #2A2A45 !important;
  --dp-hover-text-color:    #C084FC !important;
  --dp-primary-color:       #C084FC !important;
  --dp-primary-text-color:  #FFFFFF !important;
  --dp-border-color:        #2A2A45 !important;
  --dp-border-color-hover:  #C084FC !important;
}

/* Material Symbols 全域設定 */
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
  font-size: 20px;
  line-height: 1;
  display: inline-flex;
  user-select: none;
}
</style>
