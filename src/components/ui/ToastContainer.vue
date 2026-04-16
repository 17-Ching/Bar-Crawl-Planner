<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item pointer-events-auto"
          :class="typeClass(toast.type)"
          role="alert"
        >
          <span class="text-lg leading-none">{{ typeIcon(toast.type) }}</span>
          <span class="text-sm font-medium flex-1">{{ toast.message }}</span>
          <button @click="dismiss(toast.id)" class="opacity-50 hover:opacity-100 transition-opacity text-lg leading-none">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
const { toasts, dismiss } = useToast()

const typeClass = (type) => ({
  success: 'border-green-500/40 bg-green-950/80',
  error:   'border-neon-red/40 bg-red-950/80',
  warning: 'border-neon-amber/40 bg-amber-950/80',
  info:    'border-neon-purple/40 bg-dark-900/90',
}[type] || 'border-dark-600 bg-dark-900/90')

const typeIcon = (type) => ({ success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[type] || 'ℹ️')
</script>

<style scoped>
.toast-item {
  @apply flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-card
         min-w-[240px] max-w-[340px] text-text-primary;
}
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(60px) scale(0.95); }
.toast-leave-to     { opacity: 0; transform: translateX(60px) scale(0.9); }
</style>
