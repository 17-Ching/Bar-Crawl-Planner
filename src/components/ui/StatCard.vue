<template>
  <div class="p-3 rounded-xl border flex items-center gap-3"
       :class="borderClass">
    <span class="text-2xl leading-none">{{ icon }}</span>
    <div class="flex-1 min-w-0">
      <p class="text-xs text-text-muted">{{ label }}</p>
      <p class="font-display font-bold text-base" :class="textClass">{{ value }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  icon:  String,
  label: String,
  value: String,
  color: { type: String, default: 'purple' }
})
const colorMap = {
  purple: { border: 'border-neon-purple/20 bg-neon-purple/5',  text: 'text-neon-purple' },
  cyan:   { border: 'border-neon-cyan/20 bg-neon-cyan/5',      text: 'text-neon-cyan'   },
  pink:   { border: 'border-neon-pink/20 bg-neon-pink/5',      text: 'text-neon-pink'   },
  amber:  { border: 'border-neon-amber/20 bg-neon-amber/5',    text: 'text-neon-amber'  },
}
const borderClass = computed(() => colorMap[props.color]?.border || colorMap.purple.border)
const textClass   = computed(() => colorMap[props.color]?.text   || colorMap.purple.text)
</script>
