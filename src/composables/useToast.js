import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  function show({ message, type = 'info', duration = 3000 }) {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => dismiss(id), duration)
  }

  function dismiss(id) {
    const i = toasts.value.findIndex(t => t.id === id)
    if (i !== -1) toasts.value.splice(i, 1)
  }

  const success = (msg) => show({ message: msg, type: 'success' })
  const error   = (msg) => show({ message: msg, type: 'error', duration: 4500 })
  const info    = (msg) => show({ message: msg, type: 'info' })
  const warning = (msg) => show({ message: msg, type: 'warning' })

  return { toasts, show, dismiss, success, error, info, warning }
}
