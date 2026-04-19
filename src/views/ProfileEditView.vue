<template>
  <div class="px-4 py-6 max-w-sm mx-auto pb-safe-offset-24 text-text-primary animate-fade-in">
    <!-- Header -->
    <header class="flex items-center gap-3 mb-8">
      <button @click="router.back()" class="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-text-muted transition-colors">
        <ArrowLeft :size="20" />
      </button>
      <h1 class="font-display font-bold text-2xl text-white">編輯個人資料</h1>
    </header>

    <div v-if="!auth.isLoggedIn" class="text-center py-10">
      <p class="text-text-muted mb-4">請先登入才能編輯資料</p>
      <button @click="router.push('/map')" class="btn btn-primary">返回探索</button>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSave" class="flex flex-col gap-5">
      
      <!-- Avatar Upload -->
      <div class="flex flex-col items-center gap-3 mb-4">
        <div class="relative w-24 h-24 rounded-full border-2 border-neon-purple/50 bg-dark-800 flex items-center justify-center overflow-hidden shadow-neon-purple isolate group cursor-pointer" @click="$refs.avatarInput.click()">
          <img v-if="avatarPreview" :src="avatarPreview" class="absolute inset-0 w-full h-full object-cover z-0" />
          <UserCircle v-else class="w-12 h-12 text-text-muted z-0" />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Camera :size="24" class="text-white" />
          </div>
        </div>
        <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <span class="text-xs text-text-muted">點擊更換大頭照</span>
      </div>

      <!-- Display Name -->
      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-text-secondary ml-1">顯示名稱</label>
        <div class="relative">
          <User :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10 pointer-events-none" />
          <input
            v-model="form.displayName"
            type="text"
            class="input-base pl-9 w-full"
            placeholder="請輸入你的暱稱"
            required
          />
        </div>
      </div>

      <!-- Username (唯讀) -->
      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-text-secondary ml-1">登入帳號 (不可修改)</label>
        <div class="relative">
          <AtSign :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 z-10 pointer-events-none" />
          <input
            :value="auth.profile?.username"
            type="text"
            class="input-base pl-9 w-full opacity-50 cursor-not-allowed bg-dark-900"
            disabled
          />
        </div>
      </div>

      <!-- Birthday -->
      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-text-secondary ml-1">生日</label>
        <div class="relative cursor-pointer" @click="openDatePicker">
          <Cake :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10 pointer-events-none" />
          <input
            ref="birthdayRef"
            v-model="form.birthday"
            type="date"
            class="birthday-input input-base pl-9 w-full cursor-pointer"
            :max="maxBirthday"
          />
        </div>
        <p class="text-2xs text-text-muted ml-1">注意：需年滿 18 歲方可使用本服務</p>
      </div>

      <!-- Messages -->
      <p v-if="errorMsg" class="text-sm text-neon-pink flex items-center gap-1.5 mt-2">
        <AlertCircle :size="15" /> {{ errorMsg }}
      </p>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="loading"
        class="btn btn-primary w-full mt-6 flex items-center justify-center gap-2"
      >
        <Loader2 v-if="loading" class="animate-spin" :size="20" />
        <span v-else>儲存設定</span>
      </button>

      <!-- 登出按鈕 -->
      <button
        type="button"
        @click="handleLogout"
        class="btn btn-ghost text-text-muted w-full mt-2"
      >
        登出帳號
      </button>

    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, UserCircle, Camera, User, AtSign, Cake, Loader2, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const auth   = useAuthStore()
const { success, error: toastError } = useToast()

const form = ref({
  displayName: '',
  birthday: ''
})
const avatarFile    = ref(null)
const avatarPreview = ref(null)
const errorMsg      = ref('')
const loading       = ref(false)
const birthdayRef   = ref(null)

onMounted(() => {
  if (auth.profile) {
    form.value.displayName = auth.profile.display_name || ''
    form.value.birthday    = auth.profile.birthday || ''
    avatarPreview.value    = auth.profile.avatar_url || null
  }
})

const maxBirthday = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
})

function openDatePicker() {
  birthdayRef.value?.showPicker?.() || birthdayRef.value?.click()
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function handleSave() {
  if (!form.value.displayName.trim()) {
    errorMsg.value = '請填寫顯示名稱'
    return
  }
  loading.value = true
  errorMsg.value = ''

  const { error } = await auth.updateProfile({
    displayName: form.value.displayName,
    birthday:    form.value.birthday || null,
    avatarFile:  avatarFile.value
  })

  loading.value = false
  if (error) {
    alert(`【Supabase 除錯 - 設定更新】\n${error.message}`)
    errorMsg.value = error.message
  } else {
    success('個人資料已更新！')
    router.back()
  }
}

async function handleLogout() {
  await auth.signOut()
  success('已登出')
  router.push('/')
}
</script>

<style scoped>
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
