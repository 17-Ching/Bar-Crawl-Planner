import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { GAME_CONFIG } from '@/config'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)

  const currentLevel = computed(() => {
    if (!profile.value) return GAME_CONFIG.levels[0]
    const xp = profile.value.total_bars_visited * GAME_CONFIG.xpPerCheckin
      + profile.value.total_routes_completed * GAME_CONFIG.xpPerRoute
    return [...GAME_CONFIG.levels].reverse().find(l => xp >= l.xpRequired) || GAME_CONFIG.levels[0]
  })

  async function init() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    if (user.value) await fetchProfile()
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) await fetchProfile()
      else profile.value = null
    })
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.value.id)
      .single()
    profile.value = data
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return { user, profile, loading, isLoggedIn, currentLevel, init, signInWithGoogle, signOut, fetchProfile }
})
