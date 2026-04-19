<template>
  <div class="flex items-center shrink-0">
    <!-- 未登入時顯示文字按鈕 -->
    <button
      v-if="!authStore.isLoggedIn"
      @click="handleClick"
      class="btn btn-primary btn-sm shrink-0 whitespace-nowrap px-4 w-full"
    >
      登入 / 註冊
    </button>

    <!-- 已登入時顯示大頭貼圓角按鈕 -->
    <button
      v-else
      @click="handleClick"
      class="w-10 h-10 flex items-center justify-center rounded-full border-2 transition-transform hover:scale-105 shrink-0 overflow-hidden border-neon-purple p-0.5 bg-dark-800 shadow-neon-purple"
      aria-label="個人資料"
    >
      <img v-if="authStore.profile?.avatar_url" :src="authStore.profile.avatar_url" class="w-full h-full object-cover rounded-full" />
      <span v-else class="material-symbols-outlined text-neon-purple" style="font-size:24px">account_circle</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleClick() {
  if (authStore.isLoggedIn) {
    router.push('/profile/edit')
  } else {
    authStore.showLoginModal = true
  }
}
</script>
