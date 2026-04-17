<template>
  <div
    class="fixed inset-0 z-[700] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
    @click.self="$emit('close')"
  >
    <div class="card w-full max-w-sm animate-in relative overflow-y-auto max-h-[90dvh]">

      <!-- 關閉 -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg
               text-text-muted hover:text-white hover:bg-dark-700 transition-colors z-10"
        aria-label="關閉"
      >
        <X :size="18" />
      </button>

      <div class="p-7 space-y-5">
        <!-- Logo -->
        <div class="text-center">
          <div class="text-4xl animate-float inline-block mb-2">🍺</div>
          <h2 class="font-display font-bold text-2xl text-neon-gradient">不醉不歸</h2>
        </div>

        <!-- ── 已登入狀態 ── -->
        <template v-if="authStore.isLoggedIn">
          <div class="bg-dark-800 rounded-2xl p-4 flex items-center gap-3 border border-neon-purple/20">
            <div class="w-12 h-12 rounded-full overflow-hidden bg-dark-700 border-2 border-neon-purple shrink-0 flex items-center justify-center">
              <img v-if="authStore.profile?.avatar_url" :src="authStore.profile.avatar_url" class="w-full h-full object-cover" />
              <User v-else :size="24" class="text-text-muted" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold truncate">{{ authStore.profile?.display_name || authStore.profile?.username || '用戶' }}</p>
              <p class="text-xs text-text-muted flex items-center gap-1">
                <span>{{ authStore.currentLevel.icon }}</span>
                {{ authStore.currentLevel.name }}
              </p>
            </div>
            <span class="badge-purple">Lv.{{ authStore.currentLevel.level }}</span>
          </div>

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

          <button @click="signOut" class="btn btn-secondary w-full gap-2">
            <LogOut :size="16" /> 登出
          </button>
        </template>

        <!-- ── 未登入：Tab 切換 ── -->
        <template v-else>
          <!-- Tabs -->
          <div class="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-600">
            <button
              v-for="tab in ['登入','註冊']"
              :key="tab"
              @click="activeTab = tab"
              class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              :class="activeTab === tab
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-neon-purple'
                : 'text-text-muted hover:text-white'"
            >{{ tab }}</button>
          </div>

          <!-- ── 登入表單 ── -->
          <form v-if="activeTab === '登入'" @submit.prevent="doLogin" class="space-y-3">
            <!-- username -->
            <div class="relative">
              <User :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="login-username" v-model="loginForm.username"
                type="text" placeholder="帳號（Username）"
                class="input-base pl-9" autocomplete="username" required
              />
            </div>
            <!-- password -->
            <div class="relative">
              <Lock :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="login-password" v-model="loginForm.password"
                :type="showPwd ? 'text' : 'password'" placeholder="密碼"
                class="input-base pl-9 pr-10" autocomplete="current-password" required
              />
              <button type="button" @click="showPwd = !showPwd"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                <Eye v-if="!showPwd" :size="16" /><EyeOff v-else :size="16" />
              </button>
            </div>

            <p v-if="errorMsg" class="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle :size="13" /> {{ errorMsg }}
            </p>

            <button type="submit" :disabled="loading" class="btn btn-primary w-full">
              <Loader2 v-if="loading" :size="16" class="animate-spin" />
              <span v-else>登入</span>
            </button>

            <!-- Demo 模式提示 -->
            <div v-if="isDemoMode" class="bg-neon-amber/10 border border-neon-amber/30 rounded-xl p-3 text-center">
              <p class="text-neon-amber text-xs font-semibold">⚠️ Demo 模式</p>
              <p class="text-text-muted text-xs mt-1">請設定 Supabase 憑證以啟用登入</p>
            </div>
          </form>

          <!-- ── 註冊表單 ── -->
          <form v-else @submit.prevent="doRegister" class="space-y-3">
            <!-- 姓名 -->
            <div class="relative">
              <UserCircle :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="reg-name" v-model="regForm.displayName"
                type="text" placeholder="顯示名稱（姓名）"
                class="input-base pl-9" required maxlength="20"
              />
            </div>
            <!-- username -->
            <div class="relative">
              <AtSign :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="reg-username" v-model="regForm.username"
                type="text" placeholder="帳號（不含特殊符號）"
                class="input-base pl-9" required maxlength="20"
                pattern="[a-zA-Z0-9_]+" title="只允許英數字與底線"
              />
            </div>
            <!-- 生日：點擊整個欄位都可喚起日暦 -->
            <div class="relative cursor-pointer" @click="openBirthdayPicker">
              <Cake :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10 pointer-events-none" />
              <input
                ref="birthdayInputRef"
                id="reg-birthday"
                v-model="regForm.birthday"
                type="date"
                class="birthday-input input-base pl-9 w-full cursor-pointer"
                :max="maxBirthdayStr"
                placeholder="生日（選填）"
              />
            </div>
            <!-- 密碼 -->
            <div class="relative">
              <Lock :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="reg-password" v-model="regForm.password"
                :type="showPwd ? 'text' : 'password'" placeholder="密碼（至少 6 位）"
                class="input-base pl-9 pr-10" required minlength="6"
              />
              <button type="button" @click="showPwd = !showPwd"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                <Eye v-if="!showPwd" :size="16" /><EyeOff v-else :size="16" />
              </button>
            </div>
            <!-- 確認密碼 -->
            <div class="relative">
              <ShieldCheck :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="reg-confirm" v-model="regForm.confirm"
                :type="showPwd ? 'text' : 'password'" placeholder="確認密碼"
                class="input-base pl-9" required
                :class="{ 'border-red-500': regForm.confirm && regForm.password !== regForm.confirm }"
              />
            </div>

            <!-- 頭像上傳 -->
            <label
              class="flex items-center gap-3 p-3 rounded-xl bg-dark-800 border border-dark-600
                     cursor-pointer hover:border-neon-purple transition-colors"
            >
              <div class="w-12 h-12 rounded-full overflow-hidden bg-dark-700 border border-dark-600 shrink-0 flex items-center justify-center">
                <img v-if="avatarPreview" :src="avatarPreview" class="w-full h-full object-cover" />
                <ImagePlus v-else :size="22" class="text-text-muted" />
              </div>
              <div>
                <p class="text-sm font-medium">上傳大頭照</p>
                <p class="text-xs text-text-muted">{{ avatarPreview ? '點擊更換' : 'JPG / PNG（選填）' }}</p>
              </div>
              <input type="file" accept="image/*" class="sr-only" @change="handleAvatar" />
            </label>

            <p v-if="errorMsg" class="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle :size="13" /> {{ errorMsg }}
            </p>
            <p v-if="successMsg" class="text-xs text-green-400 flex items-center gap-1">
              ✅ {{ successMsg }}
            </p>

            <button type="submit" :disabled="loading || !canRegister" class="btn btn-primary w-full disabled:opacity-40">
              <Loader2 v-if="loading" :size="16" class="animate-spin" />
              <span v-else>建立帳號</span>
            </button>
          </form>

          <!-- Google 登入（分隔線） -->
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="flex-1 h-px bg-dark-600" />
              <span class="text-text-muted text-xs">或</span>
              <div class="flex-1 h-px bg-dark-600" />
            </div>
            <button
              id="login-google-btn"
              @click="loginGoogle"
              :disabled="isDemoMode"
              class="btn w-full !justify-center gap-3 bg-white text-gray-800 hover:bg-gray-100
                     border border-gray-300 !rounded-2xl disabled:opacity-40"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span class="font-semibold text-sm">使用 Google 帳號登入</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  X, User, UserCircle, Lock, LogOut, Eye, EyeOff,
  AlertCircle, Loader2, AtSign, Cake, ImagePlus, ShieldCheck,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'

const emit = defineEmits(['close'])
const authStore = useAuthStore()
const { success, error: toastError } = useToast()

const activeTab  = ref('登入')
const loading    = ref(false)
const errorMsg   = ref('')
const successMsg = ref('')
const showPwd    = ref(false)
const avatarFile = ref(null)
const avatarPreview = ref(null)

const loginForm = ref({ username: '', password: '' })
const regForm   = ref({ displayName: '', username: '', birthday: null, password: '', confirm: '' })

// Rate limit 即時失效判斷
const isRateLimit = computed(() =>
  errorMsg.value.includes('rate') ||
  errorMsg.value.includes('Rate') ||
  errorMsg.value.includes('too many') ||
  errorMsg.value.includes('security') ||
  errorMsg.value.includes('exceeded') ||
  errorMsg.value.includes('provider_disabled')
)

// 生日欄位： showPicker() API + CSS 雙保険
const birthdayInputRef = ref(null)
function openBirthdayPicker() {
  birthdayInputRef.value?.showPicker?.() ||
  birthdayInputRef.value?.click()
}

// 最大可選生日（需年滿 18 歲）
const maxBirthdayStr = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
})

const canRegister = computed(() =>
  regForm.value.displayName.trim() &&
  regForm.value.username.trim() &&
  regForm.value.password.length >= 6 &&
  regForm.value.password === regForm.value.confirm
)

function handleAvatar(e) {
  const file = e.target.files[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function doLogin() {
  if (!loginForm.value.username || !loginForm.value.password) return
  loading.value = true
  errorMsg.value = ''
  const { error } = await authStore.signIn({
    username: loginForm.value.username,
    password: loginForm.value.password,
  })
  loading.value = false
  if (error) {
    const msg = error.message || ''
    if (msg.includes('rate') || msg.includes('security') || msg.includes('exceeded')) {
      errorMsg.value = 'Supabase 請求過於頻繁（Rate Limit）。請稍等 60 秒後重試，或參考說明關閉 Email 確認。'
    } else if (msg.includes('Invalid')) {
      errorMsg.value = '帳號或密碼錯誤，請重試'
    } else {
      errorMsg.value = msg
    }
  } else {
    success(`歡迎回來 🍺`)
    emit('close')
  }
}

async function doRegister() {
  if (!canRegister.value) return
  if (regForm.value.password !== regForm.value.confirm) {
    errorMsg.value = '兩次密碼不一致'
    return
  }
  loading.value = true
  errorMsg.value = ''
  const { data, error } = await authStore.signUp({
    username:    regForm.value.username,
    password:    regForm.value.password,
    displayName: regForm.value.displayName,
    birthday:    regForm.value.birthday || null,
    avatarFile:  avatarFile.value,
  })
  loading.value = false
  if (error) {
    const msg = error.message || ''
    if (msg.includes('provider_disabled')) {
      errorMsg.value = 'Email 登入功能被關閉。請至 Supabase 後台 -> Authentication -> Providers -> Email，將 Enable Email provider 打開，並將 Confirm email 關閉。'
    } else if (msg.includes('rate') || msg.includes('security') || msg.includes('exceeded')) {
      errorMsg.value = 'Supabase 發送 Email 超過頻率限制。請至 Dashboard -> Auth -> Email，關閉「Confirm email」後即可無限制使用帳號模式。'
    } else if (msg.includes('already')) {
      errorMsg.value = '此帳號已被使用，請嘗試其他帳號'
    } else {
      errorMsg.value = msg
    }
  } else if (data?.session) {
    // Email 確認已停用 → 直接自動登入並關閉
    success('帳號建立成功！歡迎加入 🎉')
    emit('close')
  } else {
    // Email 確認啟用中 → 要求用戶確認信箱
    successMsg.value = '帳號建立成功！請查收確認信後再登入。'
    setTimeout(() => { activeTab.value = '登入' }, 2500)
  }
}

async function loginGoogle() {
  if (isDemoMode) return
  await authStore.signInWithGoogle()
  emit('close')
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

/*
  生日欄位修正：透明化 calendar-picker-indicator 覆蓋整個欄位
  效果：點擊欄位任意角落都能喚起日暦
*/
.birthday-input::-webkit-calendar-picker-indicator {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.birthday-input {
  position: relative;
  color-scheme: dark;
}
</style>
