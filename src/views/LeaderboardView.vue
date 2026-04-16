<template>
  <div class="min-h-dvh">
    <header class="px-4 pt-14 pb-4">
      <h1 class="font-display font-bold text-2xl text-neon-gradient">🏆 排行榜</h1>
      <p class="text-text-muted text-sm mt-1">本週最強酒精路跑勇士</p>
    </header>

    <!-- Tab 切換 -->
    <div class="px-4 mb-4">
      <div class="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-600">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :id="`leaderboard-tab-${tab.id}`"
          @click="activeTab = tab.id"
          class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === tab.id
            ? 'bg-gradient-brand text-white shadow-neon-purple'
            : 'text-text-muted hover:text-text-secondary'"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 前三名頒獎台 -->
    <section v-if="topThree.length" class="px-4 mb-6">
      <div class="flex items-end justify-center gap-3">
        <!-- 第二名 -->
        <div v-if="topThree[1]" class="flex flex-col items-center gap-2 flex-1">
          <div class="w-14 h-14 rounded-full border-2 border-text-secondary overflow-hidden bg-dark-700">
            <img v-if="topThree[1].avatar_url" :src="topThree[1].avatar_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-2xl">🌙</div>
          </div>
          <span class="text-xs text-text-muted font-medium truncate max-w-[64px]">{{ topThree[1].username }}</span>
          <div class="w-full h-16 bg-dark-800 border border-dark-600 rounded-t-xl flex items-center justify-center">
            <span class="text-2xl">🥈</span>
          </div>
        </div>
        <!-- 第一名 -->
        <div v-if="topThree[0]" class="flex flex-col items-center gap-2 flex-1 -mb-0">
          <div class="animate-float">
            <span class="text-2xl">👑</span>
          </div>
          <div class="w-16 h-16 rounded-full border-2 border-neon-amber overflow-hidden bg-dark-700 shadow-neon-amber">
            <img v-if="topThree[0].avatar_url" :src="topThree[0].avatar_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-2xl">⭐</div>
          </div>
          <span class="text-sm font-bold text-neon-amber truncate max-w-[72px]">{{ topThree[0].username }}</span>
          <div class="w-full h-24 bg-gradient-to-t from-neon-amber/10 to-transparent border border-neon-amber/30 rounded-t-xl flex items-center justify-center">
            <span class="text-3xl">🥇</span>
          </div>
        </div>
        <!-- 第三名 -->
        <div v-if="topThree[2]" class="flex flex-col items-center gap-2 flex-1">
          <div class="w-14 h-14 rounded-full border-2 border-neon-amber/50 overflow-hidden bg-dark-700">
            <img v-if="topThree[2].avatar_url" :src="topThree[2].avatar_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-2xl">🍺</div>
          </div>
          <span class="text-xs text-text-muted font-medium truncate max-w-[64px]">{{ topThree[2].username }}</span>
          <div class="w-full h-10 bg-dark-800 border border-dark-600 rounded-t-xl flex items-center justify-center">
            <span class="text-lg">🥉</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 完整排行列表 -->
    <section class="px-4 space-y-2 pb-4">
      <div
        v-for="(user, idx) in leaderboard"
        :key="user.id"
        class="card p-3 flex items-center gap-3 animate-in"
        :class="[`stagger-${Math.min(idx+1,5)}`, {'border-neon-purple/30': idx < 3}]"
      >
        <span class="w-7 text-center font-display font-bold"
              :class="idx === 0 ? 'text-neon-amber' : idx === 1 ? 'text-text-secondary' : 'text-text-muted'">
          {{ idx + 1 }}
        </span>
        <div class="w-9 h-9 rounded-full overflow-hidden bg-dark-700 border border-dark-600 shrink-0">
          <img v-if="user.avatar_url" :src="user.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">🍺</div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm truncate">{{ user.username }}</p>
          <p class="text-xs text-text-muted">Lv.{{ user.level }} · {{ user.total_bars_visited }} 間</p>
        </div>
        <div class="text-right shrink-0">
          <p class="font-display font-bold text-neon-purple">{{ statValue(user) }}</p>
          <p class="text-2xs text-text-muted">{{ statUnit }}</p>
        </div>
      </div>

      <div v-if="!leaderboard.length && !loading" class="text-center py-12 text-text-muted">
        排行榜暫無資料
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const activeTab = ref('bars')
const leaderboard = ref([])
const loading = ref(false)

const tabs = [
  { id: 'bars',   icon: '🍺', label: '打卡王' },
  { id: 'routes', icon: '🏃', label: '路跑王' },
]

const topThree = computed(() => leaderboard.value.slice(0, 3))
const statValue = (u) => activeTab.value === 'bars' ? u.total_bars_visited : u.total_routes_completed
const statUnit  = computed(() => activeTab.value === 'bars' ? '間打卡' : '場路跑')

async function load() {
  loading.value = true
  const col = activeTab.value === 'bars' ? 'total_bars_visited' : 'total_routes_completed'
  const { data } = await supabase
    .from('users')
    .select('id, username, avatar_url, level, total_bars_visited, total_routes_completed')
    .order(col, { ascending: false })
    .limit(20)
  leaderboard.value = data || []
  loading.value = false
}

watch(activeTab, load)
onMounted(load)
</script>
