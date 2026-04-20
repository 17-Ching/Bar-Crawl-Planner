<template>
  <div class="min-h-dvh max-w-[1280px] mx-auto">
    <header class="px-4 pt-14 pb-4 flex items-start justify-between">
      <div>
        <h1 class="font-display font-bold text-2xl text-neon-gradient">
          📸 微醺時刻
        </h1>
        <p class="text-text-muted text-sm mt-1">
          本週最佳微醺快照，猜猜他在哪裡喝的？
        </p>
      </div>
      <ProfileButton />
    </header>

    <!-- 週榜冠軍 Banner -->
    <section v-if="weeklyChamp" class="mx-4 mb-4">
      <div
        class="card p-4 border-neon-amber/30 bg-gradient-to-r from-neon-amber/5 to-transparent"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="badge-amber">🏆 本週醉人攝影師</span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full overflow-hidden bg-dark-700 border border-neon-amber/40 shrink-0"
          >
            <img
              v-if="weeklyChamp.user?.avatar_url"
              :src="weeklyChamp.user.avatar_url"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              📸
            </div>
          </div>
          <div>
            <p class="font-semibold text-neon-amber text-sm">
              {{ weeklyChamp.user?.username }}
            </p>
            <p class="text-xs text-text-muted">
              {{ weeklyChamp.cheers ?? 0 }} 個舉杯 🍺（本週上傳）
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 照片牆 (已限制最大寬度與高度) -->
    <section class="px-4 pb-4 mx-auto">
      <div v-if="loading" class="grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="skeleton h-48 rounded-xl w-full" />
      </div>

      <div v-else class="grid grid-cols-3 gap-4">
        <div
          v-for="(photo, idx) in photos"
          :key="photo.id"
          class="card overflow-hidden cursor-pointer hover:border-neon-purple/40 transition-all duration-300 hover:-translate-y-0.5"
          @click="openPhoto(photo)"
        >
          <img
            :src="photo.url"
            :alt="`微醺時刻 ${idx + 1}`"
            class="w-full max-h-[250px] object-cover rounded-t-md"
            loading="lazy"
          />
          <div class="p-2.5">
            <!-- 猜地點 -->
            <div v-if="!photo.guessed" class="flex items-center gap-2 mb-2">
              <input
                v-model="photo.guess"
                :placeholder="`猜猜在哪喝的？`"
                class="input-base text-xs h-8 flex-1"
                @click.stop
                @keydown.enter.stop="submitGuess(photo)"
              />
              <button
                @click.stop="submitGuess(photo)"
                class="btn btn-primary btn-sm !px-2"
              >
                猜
              </button>
            </div>
            <div v-else class="text-xs text-neon-cyan mb-2">
              ✅
              {{
                photo.guessResult ? "猜對了！+5 XP" : `答案：${photo.bar?.name}`
              }}
            </div>

            <!-- 舉杯按鈕 -->
            <div class="flex items-center justify-between">
              <button
                @click.stop="toggleCheers(photo)"
                class="flex items-center gap-1.5 text-xs transition-all"
                :class="
                  photo.cheered
                    ? 'text-neon-amber'
                    : 'text-text-muted hover:text-neon-amber'
                "
              >
                <span class="text-base">{{ photo.cheered ? "🍺" : "🥂" }}</span>
                {{ photo.cheers }}
              </button>
              <span class="text-2xs text-text-muted">{{ photo.username }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!loading && !photos.length"
        class="text-center py-16 text-text-muted"
      >
        <p class="text-4xl mb-3">📷</p>
        <p>還沒有照片，去打卡上傳你的微醺時刻！</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import ProfileButton from "@/components/layout/ProfileButton.vue";

const authStore = useAuthStore();
const { success, info } = useToast();

const photos = ref([]);
const weeklyChamp = ref(null);
const loading = ref(false);

async function load() {
  loading.value = true;
  // 查詢最近一週有照片的公開打卡
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data, error } = await supabase
    .from("visit_history")
    .select(
      "id, photo_urls, note, bar:bars(name), user:users(username, avatar_url)",
    )
    .gte("checked_in_at", since)
    .not("photo_urls", "eq", "{}")
    .not("photo_urls", "is", null)
    .order("checked_in_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[PhotoWall] 載入失敗:", error.message);
    loading.value = false;
    return;
  }

  photos.value = (data || []).flatMap((v) =>
    (v.photo_urls || []).map((url) => ({
      id: `${v.id}_${url}`,
      url,
      bar: v.bar,
      username: v.user?.username || "匿名",
      avatar_url: v.user?.avatar_url || null,
      cheers: Math.floor(Math.random() * 30), // Demo 用隨機數
      cheered: false,
      guess: "",
      guessed: false,
      guessResult: false,
    })),
  );

  // 週榜冠軍：照片最多的用戶
  if (photos.value.length) {
    const countMap = {};
    photos.value.forEach((p) => {
      countMap[p.username] = (countMap[p.username] || 0) + 1;
    });
    const topUsername = Object.entries(countMap).sort(
      (a, b) => b[1] - a[1],
    )[0][0];
    const topPhoto = photos.value.find((p) => p.username === topUsername);
    weeklyChamp.value = {
      user: { username: topUsername, avatar_url: topPhoto?.avatar_url },
      cheers: countMap[topUsername] * 5,
    };
  }
  loading.value = false;
}

function toggleCheers(photo) {
  if (!authStore.isLoggedIn) {
    authStore.showLoginModal = true;
    return;
  }
  photo.cheered = !photo.cheered;
  photo.cheers += photo.cheered ? 1 : -1;
  if (photo.cheered) success("已舉杯 🍺！");
}

function submitGuess(photo) {
  if (!photo.guess.trim()) return;
  const isCorrect = photo.bar?.name
    ?.toLowerCase()
    .includes(photo.guess.toLowerCase());
  photo.guessed = true;
  photo.guessResult = isCorrect;
  if (isCorrect) success("猜對了！獲得 +5 XP 🎉");
}

function openPhoto(photo) {
  /* 可擴充全螢幕預覽 */
}

onMounted(load);
</script>
