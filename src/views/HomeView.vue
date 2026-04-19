<template>
  <div class="px-4 py-6 max-w-5xl mx-auto pb-safe-offset-24 animate-fade-in text-text-primary">

    <!-- ── 頂部歡迎 ── -->
    <header class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display font-bold text-3xl mb-1 text-neon-gradient tracking-wide">
          不醉不歸
        </h1>
        <p class="text-sm text-text-muted">台北微醺宇宙的終極指南 🥂</p>
      </div>
      <div v-if="auth.isLoggedIn" @click="router.push('/profile/edit')" class="w-12 h-12 rounded-full border-2 border-neon-purple p-0.5 overflow-hidden cursor-pointer hover:scale-105 transition-transform">
        <img v-if="auth.profile?.avatar_url" :src="auth.profile.avatar_url" class="w-full h-full rounded-full object-cover bg-dark-800" />
        <UserCircle v-else class="w-full h-full text-neon-purple" />
      </div>
      <button v-else @click="auth.showLoginModal = true" class="btn btn-primary btn-sm">登入 / 註冊</button>
    </header>

    <!-- ── (A) 新手教學 (How to play) ── -->
    <section class="mb-10">
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span class="text-neon-cyan">✨</span>
        如何開始你的路跑？
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="glass-card p-5 border-t border-t-neon-purple/30 relative overflow-hidden group">
          <div class="absolute -right-4 -bottom-4 opacity-5 text-8xl group-hover:scale-110 transition-transform">🗺️</div>
          <div class="w-10 h-10 rounded-xl bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold mb-3">1</div>
          <h3 class="font-semibold text-lg mb-1">鎖定據點</h3>
          <p class="text-sm text-text-muted leading-relaxed">在探索地圖上發現優質酒吧與深夜超商，快速將想去的目標加入你的路跑清單。</p>
        </div>
        <div class="glass-card p-5 border-t border-t-neon-pink/30 relative overflow-hidden group">
          <div class="absolute -right-4 -bottom-4 opacity-5 text-8xl group-hover:scale-110 transition-transform">🍺</div>
          <div class="w-10 h-10 rounded-xl bg-neon-pink/20 flex items-center justify-center text-neon-pink font-bold mb-3">2</div>
          <h3 class="font-semibold text-lg mb-1">串連路線</h3>
          <p class="text-sm text-text-muted leading-relaxed">我們將為你計算最佳步行距離。揪滿好友出發，按圖索驥完成你的征途！</p>
        </div>
        <div class="glass-card p-5 border-t border-t-neon-cyan/30 relative overflow-hidden group">
          <div class="absolute -right-4 -bottom-4 opacity-5 text-8xl group-hover:scale-110 transition-transform">📸</div>
          <div class="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-bold mb-3">3</div>
          <h3 class="font-semibold text-lg mb-1">制霸打卡</h3>
          <p class="text-sm text-text-muted leading-relaxed">抵達地點後進行打卡，留下照片與評語。累積里程，朝更高階的稱號邁進！</p>
        </div>
      </div>
    </section>

    <!-- ── (B) 最新消息 (News) ── -->
    <section>
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span class="text-neon-pink">🔥</span>
        微醺快報
      </h2>
      <div class="flex flex-col gap-4">
        <div v-for="(news, index) in newsList" :key="index" class="glass-card p-4 flex gap-4 hover:border-dark-500 transition-colors cursor-pointer group">
          <div class="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-dark-700 isolate relative">
            <img :src="news.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent text-white flex items-end p-2 text-2xs font-bold">{{ news.tag }}</div>
          </div>
          <div class="flex-1 min-w-0 py-1">
            <h3 class="font-bold text-base text-white mb-1 truncate leading-tight">{{ news.title }}</h3>
            <p class="text-sm text-text-muted line-clamp-2 leading-relaxed">{{ news.desc }}</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { UserCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

// Mock Data
const newsList = [
  {
    title: '本週末信義區「深夜超商路跑」爭霸戰開跑！',
    desc: '從松壽路到忠孝東路，8 間超商連續踩點挑戰。只要在週日凌晨前集滿 8 個打卡點，即可獲得獨家「夜行神龍」數位徽章！',
    tag: '官方活動',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: '5 月壽星看過來！推薦這 3 條慶生微醺路線',
    desc: '不知道生日去哪裡慶祝嗎？我們為你精選了大安區與中山區的質感雞尾酒吧路線，保證讓朋友滿意。',
    tag: '路線推薦',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: '系統更新：已支援外部 Google Maps 無縫導航',
    desc: '針對玩家反饋，探索地圖與打卡畫面現已全面整合 Google Maps 外部導航功能，步行路線不再迷路。',
    tag: '系統公告',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80'
  }
]
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
