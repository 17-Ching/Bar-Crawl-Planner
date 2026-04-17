<template>
  <div class="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
       @click.self="$emit('close')">
    <div class="card w-full max-w-md max-h-[80dvh] overflow-y-auto animate-in">
      <div class="p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display font-bold text-xl text-neon-gradient">🚩 打卡！</h3>
          <button @click="$emit('close')" class="text-text-muted hover:text-text-primary text-2xl leading-none">×</button>
        </div>

        <!-- 選擇酒吧 -->
        <div>
          <label class="text-xs text-text-muted mb-1 block">酒吧名稱 *</label>
          <input id="checkin-bar-name" v-model="form.barName" class="input-base" placeholder="輸入酒吧名稱" />
        </div>

        <!-- 心情 Emoji -->
        <div>
          <label class="text-xs text-text-muted mb-2 block">當下心情</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="e in moodEmojis"
              :key="e"
              @click="form.moodEmoji = e"
              class="w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all"
              :class="form.moodEmoji === e
                ? 'border-neon-purple bg-neon-purple/15 scale-110'
                : 'border-dark-600 bg-dark-800 hover:border-dark-500'"
            >{{ e }}</button>
          </div>
        </div>

        <!-- 喝了幾杯 -->
        <div>
          <label class="text-xs text-text-muted mb-1 block">喝了幾杯？（自願填寫 😅）</label>
          <div class="flex items-center gap-3">
            <button @click="form.drinkCount = Math.max(0, form.drinkCount - 1)"
                    class="w-9 h-9 rounded-xl bg-dark-700 border border-dark-600 text-xl hover:border-neon-purple transition-colors">−</button>
            <span class="font-display font-bold text-2xl text-neon-purple w-8 text-center">{{ form.drinkCount }}</span>
            <button @click="form.drinkCount++"
                    class="w-9 h-9 rounded-xl bg-dark-700 border border-dark-600 text-xl hover:border-neon-purple transition-colors">+</button>
            <span class="text-text-muted text-sm ml-2">杯</span>
          </div>
        </div>

        <!-- 備註 -->
        <div>
          <label class="text-xs text-text-muted mb-1 block">備註</label>
          <textarea id="checkin-note" v-model="form.note" class="input-base resize-none h-20"
                    placeholder="今晚的氣氛超讚..." maxlength="200" />
        </div>

        <!-- 照片上傳 -->
        <div>
          <label class="text-xs text-text-muted mb-2 block">上傳照片（最多 3 張）</label>
          <div class="flex gap-2">
            <label
              v-for="i in 3"
              :key="i"
              class="flex-1 aspect-square rounded-xl border-2 border-dashed border-dark-500
                     flex flex-col items-center justify-center cursor-pointer
                     hover:border-neon-purple transition-colors overflow-hidden"
            >
              <img v-if="previews[i-1]" :src="previews[i-1]" class="w-full h-full object-cover" />
              <template v-else>
                <span class="text-2xl text-text-muted">📷</span>
                <span class="text-2xs text-text-muted mt-1">新增</span>
              </template>
              <input type="file" accept="image/*" class="sr-only" @change="(e) => handlePhoto(e, i-1)" />
            </label>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <button
          id="checkin-submit-btn"
          @click="submit"
          :disabled="!form.barName.trim() || submitting"
          class="btn btn-primary w-full btn-lg"
          :class="{ 'opacity-50': !form.barName.trim() }"
        >
          <span v-if="submitting" class="animate-spin">⏳</span>
          <span v-else>🚩</span>
          {{ submitting ? '上傳中...' : '完成打卡！' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { GAME_CONFIG } from '@/config'

const props = defineProps({
  initialBar: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved'])
const authStore = useAuthStore()
const { success, error: toastError } = useToast()

const moodEmojis = ['🍺', '🥴', '🔥', '💀', '😎', '🥂', '🎉', '😂']
const submitting = ref(false)
const previews   = ref([null, null, null])
const photoFiles = ref([null, null, null])

const form = reactive({
  barName: '',
  moodEmoji: '🍺',
  drinkCount: 0,
  note: '',
})

onMounted(() => {
  if (props.initialBar?.name) {
    form.barName = props.initialBar.name
  }
})


async function handlePhoto(e, idx) {
  const file = e.target.files[0]
  if (!file) return
  const compressed = await imageCompression(file, {
    maxSizeMB: GAME_CONFIG.maxPhotoSizeKB / 1024,
    maxWidthOrHeight: 1080,
    useWebWorker: true,
  })
  photoFiles.value[idx] = compressed
  previews.value[idx] = URL.createObjectURL(compressed)
}

async function submit() {
  if (!authStore.isLoggedIn) { toastError('請先登入'); return }
  if (!form.barName.trim()) return
  submitting.value = true

  try {
    // 1. 上傳照片至 Supabase Storage
    const photoUrls = []
    for (const file of photoFiles.value.filter(Boolean)) {
      const path = `checkin/${authStore.user.id}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, file)
      if (upErr) throw new Error(`圖片上傳失敗: ${upErr.message}`)
      
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      photoUrls.push(publicUrl)
    }

    // 2. 先確認或建立酒吧記錄
    let barId = null
    const { data: existingBar, error: searchErr } = await supabase
      .from('bars').select('id').ilike('name', form.barName).limit(1).maybeSingle()
      
    if (existingBar) {
      barId = existingBar.id
    } else {
      const { data: newBar, error: insertBarErr } = await supabase
        .from('bars').insert({ name: form.barName, category: 'bar' }).select('id').single()
      if (insertBarErr) throw new Error(`建立酒吧失敗: ${insertBarErr.message}`)
      barId = newBar?.id
    }

    // 3. 新增打卡記錄
    const { error: visitErr } = await supabase.from('visit_history').insert({
      user_id: authStore.user.id,
      bar_id:  barId,
      note:    form.note,
      photo_urls:  photoUrls,
      drink_count: form.drinkCount,
      mood_emoji:  form.moodEmoji,
      location_verified: false,
    })
    if (visitErr) throw new Error(`打卡紀錄寫入失敗: ${visitErr.message}`)

    // 4. 更新用戶統計
    const { error: rpcErr } = await supabase.rpc('increment_user_checkin', { uid: authStore.user.id })
    if (rpcErr) throw new Error(`統計更新失敗: ${rpcErr.message}`)

    success('打卡成功！🎉 +10 XP')
    emit('saved')
    emit('close')
  } catch (e) {
    // 【裸字串顯示錯誤】讓使用者與 QA 直接看到 Supabase 回傳的 Policy 英文錯誤
    alert(`【Supabase 除錯】\n${e.message}`)
    toastError(e.message)
    console.error(e)
  } finally {
    submitting.value = false
  }
}
</script>
