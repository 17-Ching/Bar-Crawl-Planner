<template>
  <!-- 半透明遮罩 -->
  <div class="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
       @click.self="$emit('cancel')">
    <div class="card w-full max-w-md p-6 space-y-4 animate-in">
      <h3 class="font-display font-bold text-xl text-neon-gradient">💾 儲存路線</h3>

      <div class="space-y-3">
        <div>
          <label class="text-xs text-text-muted mb-1 block" for="route-name">路線名稱</label>
          <input id="route-name" v-model="form.name" class="input-base" placeholder="例：信義區微醺之旅 🍺" maxlength="40" />
        </div>
        <div>
          <label class="text-xs text-text-muted mb-1 block" for="route-desc">簡介（選填）</label>
          <textarea id="route-desc" v-model="form.description" class="input-base resize-none h-20" placeholder="介紹這條路線的亮點..." maxlength="200" />
        </div>
        <label class="flex items-center gap-3 cursor-pointer select-none">
          <div class="relative">
            <input id="route-public" type="checkbox" v-model="form.isPublic" class="sr-only peer" />
            <div class="w-11 h-6 bg-dark-700 rounded-full peer peer-checked:bg-gradient-brand transition-colors" />
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
          </div>
          <span class="text-sm text-text-secondary">公開路線（讓其他用戶複製）</span>
        </label>
      </div>

      <div class="flex gap-2 pt-2">
        <button @click="$emit('cancel')" class="btn btn-secondary flex-1">取消</button>
        <button @click="submit" :disabled="!form.name.trim()" class="btn btn-primary flex-1">
          儲存路線
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
const emit = defineEmits(['save', 'cancel'])
const form = reactive({ name: '', description: '', isPublic: true })
const submit = () => { if (form.name.trim()) emit('save', { ...form }) }
</script>
