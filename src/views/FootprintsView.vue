<template>
  <div class="min-h-dvh">
    <!-- 頁首 -->
    <header class="px-4 pt-14 pb-4 flex items-center justify-between">
      <div>
        <h1 class="font-display font-bold text-2xl text-neon-gradient">🚩 我的足跡</h1>
        <p class="text-text-muted text-sm mt-1">{{ visits.length }} 個打卡記錄</p>
      </div>
      <button
        id="checkin-new-btn"
        @click="showCheckinModal = true"
        class="btn btn-primary btn-sm"
      >
        + 打卡
      </button>
    </header>

    <!-- 成就徽章列 -->
    <section class="px-4 mb-4">
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div
          v-for="badge in badges"
          :key="badge.key"
          class="shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl border border-dark-600 bg-dark-900 min-w-[72px]"
          :class="{ 'border-neon-purple/40 bg-neon-purple/5': badge.unlocked }"
        >
          <span class="text-2xl" :class="{ 'grayscale opacity-30': !badge.unlocked }">
            {{ badge.icon }}
          </span>
          <span class="text-2xs text-center" :class="badge.unlocked ? 'text-neon-purple' : 'text-text-muted'">
            {{ badge.label }}
          </span>
        </div>
      </div>
    </section>

    <!-- 足跡時間軸 -->
    <section class="px-4 space-y-3 pb-4">
      <!-- 載入骨架 -->
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="skeleton h-28 rounded-2xl" />
      </template>

      <!-- 空狀態 -->
      <div v-else-if="!visits.length" class="text-center py-16">
        <p class="text-5xl mb-4">🍺</p>
        <p class="text-text-secondary font-semibold">還沒有足跡</p>
        <p class="text-text-muted text-sm mt-1">去酒吧打卡，記錄你的微醺夜晚吧！</p>
        <button @click="showCheckinModal = true" class="btn btn-primary mt-4">立刻打卡</button>
      </div>

      <!-- 打卡卡片 -->
      <template v-else>
        <div
          v-for="(visit, idx) in visits"
          :key="visit.id"
          class="card-hover p-4 animate-in"
          :class="`stagger-${Math.min(idx+1,5)}`"
        >
          <!-- 頂部行 -->
          <div class="flex items-start gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                 :style="{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)' }">
              🍾
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-text-primary truncate">{{ visit.bar?.name || '未知酒吧' }}</p>
              <p class="text-xs text-text-muted">{{ formatDate(visit.checked_in_at) }}</p>
            </div>
            <div class="text-xl shrink-0">{{ visit.mood_emoji || '🍺' }}</div>
          </div>

          <!-- 照片格 -->
          <div v-if="visit.photo_urls?.length" class="flex gap-1.5 mb-3">
            <img
              v-for="(url, pi) in visit.photo_urls.slice(0, 3)"
              :key="pi"
              :src="url"
              class="h-20 flex-1 min-w-0 object-cover rounded-xl border border-dark-600"
              :alt="`打卡照片 ${pi+1}`"
              loading="lazy"
            />
          </div>

          <!-- 備註 -->
          <p v-if="visit.note" class="text-sm text-text-secondary italic">
            "{{ visit.note }}"
          </p>

          <!-- 底部 stats -->
          <div class="flex items-center gap-3 mt-3 pt-3 border-t border-dark-600">
            <span class="text-xs text-text-muted">🍹 {{ visit.drink_count ?? '?' }} 杯</span>
            <span v-if="visit.location_verified" class="badge-cyan text-2xs">GPS 驗證</span>
          </div>
        </div>
      </template>
    </section>

    <!-- 打卡 Modal -->
    <Transition name="modal">
      <CheckinModal v-if="showCheckinModal" @close="showCheckinModal = false" @saved="loadVisits" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import CheckinModal from '@/components/footprints/CheckinModal.vue'

const authStore = useAuthStore()
const visits = ref([])
const loading = ref(false)
const showCheckinModal = ref(false)

// 成就徽章定義
const badges = ref([
  { key: 'first_checkin', icon: '🌙', label: '初夜',     unlocked: false },
  { key: 'bar_hopper_5',  icon: '🏃', label: '5連打',    unlocked: false },
  { key: 'bar_hopper_10', icon: '⚡', label: '10連打',   unlocked: false },
  { key: 'night_owl',     icon: '🦉', label: '夜貓子',   unlocked: false },
  { key: 'photo_king',    icon: '📸', label: '攝影師',   unlocked: false },
  { key: 'legend',        icon: '👑', label: '傳說',      unlocked: false },
])

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadVisits() {
  if (!authStore.isLoggedIn) return
  loading.value = true
  const { data } = await supabase
    .from('visit_history')
    .select('*, bar:bars(name, category)')
    .eq('user_id', authStore.user.id)
    .order('checked_in_at', { ascending: false })
    .limit(50)
  visits.value = data || []

  // 解鎖徽章
  if (visits.value.length >= 1)  badges.value[0].unlocked = true
  if (visits.value.length >= 5)  badges.value[1].unlocked = true
  if (visits.value.length >= 10) badges.value[2].unlocked = true
  const hasLateNight = visits.value.some(v => new Date(v.checked_in_at).getHours() >= 2)
  if (hasLateNight) badges.value[3].unlocked = true
  const hasPhoto = visits.value.some(v => v.photo_urls?.length > 0)
  if (hasPhoto) badges.value[4].unlocked = true

  loading.value = false
}

onMounted(loadVisits)
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { scrollbar-width: none; }
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.95); }
</style>
