<template>
  <!-- 半透明遮罩 -->
  <div
    class="fixed inset-0 z-[700] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
    @click.self="$emit('close')"
  >
    <div class="card w-full max-w-sm p-7 space-y-6 animate-in relative">
      <!-- 關閉按鈕 -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg
               text-text-muted hover:text-text-primary hover:bg-dark-700 text-xl transition-colors"
        aria-label="關閉"
      >×</button>

      <!-- Logo & 標題 -->
      <div class="text-center space-y-2">
        <div class="text-5xl animate-float inline-block">🍺</div>
        <h2 class="font-display font-bold text-2xl text-neon-gradient">不醉不歸</h2>
        <p class="text-text-muted text-sm">登入以解鎖打卡、路線儲存與排行榜功能</p>
      </div>

      <!-- 已登入狀態 -->
      <template v-if="authStore.isLoggedIn">
        <div class="bg-dark-800 rounded-2xl p-4 flex items-center gap-3 border border-neon-purple/20">
          <div class="w-12 h-12 rounded-full overflow-hidden bg-dark-700 border-2 border-neon-purple shrink-0 flex items-center justify-center text-2xl">
            <img v-if="authStore.profile?.avatar_url" :src="authStore.profile.avatar_url" class="w-full h-full object-cover" />
            <span v-else>👤</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-white truncate">{{ authStore.profile?.username || authStore.user?.email }}</p>
            <p class="text-xs text-text-muted flex items-center gap-1">
              <span>{{ authStore.currentLevel.icon }}</span>
              {{ authStore.currentLevel.name }}
            </p>
          </div>
          <span class="badge-purple">Lv.{{ authStore.currentLevel.level }}</span>
        </div>

        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2 text-center">
            <div class="bg-dark-800 rounded-xl p-3 border border-dark-600">
              <p class="font-display font-bold text-xl text-neon-purple">{{ authStore.profile?.total_bars_visited ?? 0 }}</p>
              <p class="text-xs text-text-muted">酒吧打卡</p>
            </div>
            <div class="bg-dark-800 rounded-xl p-3 border border-dark-600">
              <p class="font-display font-bold text-xl text-neon-cyan">{{ authStore.profile?.total_routes_completed ?? 0 }}</p>
              <p class="text-xs text-text-muted">路跑完成</p>
            </div>
          </div>
          <button @click="signOut" class="btn btn-secondary w-full">
            🚪 登出
          </button>
        </div>
      </template>

      <!-- 未登入狀態 -->
      <template v-else>
        <!-- Demo 模式提示 -->
        <div v-if="isDemoMode" class="bg-neon-amber/10 border border-neon-amber/30 rounded-xl p-3 text-center">
          <p class="text-neon-amber text-xs font-semibold">⚠️ Demo 模式</p>
          <p class="text-text-muted text-xs mt-1">
            請在 <code class="text-neon-cyan">.env.local</code> 設定 Supabase 憑證<br>才能啟用 Google 登入
          </p>
        </div>

        <div class="space-y-3">
          <!-- Google 登入 -->
          <button
            id="login-google-btn"
            @click="loginWithGoogle"
            :disabled="isDemoMode || loading"
            class="btn w-full !justify-start gap-4 bg-white text-gray-800 hover:bg-gray-100
                   border border-gray-200 !rounded-2xl !py-3.5 disabled:opacity-40"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span class="font-semibold">使用 Google 帳號登入</span>
          </button>

          <!-- 分隔 -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-dark-600" />
            <span class="text-text-muted text-xs">或</span>
            <div class="flex-1 h-px bg-dark-600" />
          </div>

          <!-- Email 登入 -->
          <div class="space-y-2">
            <input
              id="login-email"
              v-model="email"
              type="email"
              placeholder="Email"
              class="input-base"
              @keydown.enter="loginWithEmail"
            />
            <input
              id="login-password"
              v-model="password"
              type="password"
              placeholder="密碼"
              class="input-base"
              @keydown.enter="loginWithEmail"
            />
            <p v-if="errorMsg" class="text-xs text-neon-red">{{ errorMsg }}</p>
            <button
              id="login-email-btn"
              @click="loginWithEmail"
              :disabled="!email || !password || loading"
              class="btn btn-primary w-full disabled:opacity-40"
            >
              <span v-if="loading" class="animate-spin">⏳</span>
              <span v-else>🔓</span>
              {{ isSignUp ? '建立帳號' : '登入' }}
            </button>
            <button @click="isSignUp = !isSignUp" class="w-full text-center text-xs text-text-muted hover:text-neon-purple transition-colors">
              {{ isSignUp ? '已有帳號？登入' : '還沒帳號？立刻加入' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase, isDemoMode } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'

const emit = defineEmits(['close'])
const authStore = useAuthStore()
const { success, error: toastError } = useToast()

const email    = ref('')
const password = ref('')
const errorMsg = ref('')
const loading  = ref(false)
const isSignUp = ref(false)

async function loginWithGoogle() {
  if (isDemoMode) return
  await authStore.signInWithGoogle()
  emit('close')
}

async function loginWithEmail() {
  if (!email.value || !password.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const method = isSignUp.value ? 'signUp' : 'signInWithPassword'
    const { error } = await supabase.auth[method]({
      email: email.value,
      password: password.value,
    })
    if (error) throw error
    if (isSignUp.value) {
      success('帳號建立成功！請確認信箱驗證郵件 📧')
    } else {
      success('登入成功！歡迎回來 🍺')
    }
    emit('close')
  } catch (e) {
    errorMsg.value = e.message.includes('Invalid') ? '帳號或密碼錯誤' : e.message
  } finally {
    loading.value = false
  }
}

async function signOut() {
  await authStore.signOut()
  success('已登出，下次再來！')
  emit('close')
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.95); }
</style>
