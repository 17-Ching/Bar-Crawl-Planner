import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { GAME_CONFIG } from '@/config'

// 將 username 轉換為假 Email（對用戶完全隱藏）
const toFakeEmail = (username) => `${username.toLowerCase().trim()}@app.local`

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const showLoginModal = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  const currentLevel = computed(() => {
    if (!profile.value) return GAME_CONFIG.levels[0]
    const xp = (profile.value.total_bars_visited  || 0) * GAME_CONFIG.xpPerCheckin
             + (profile.value.total_routes_completed || 0) * GAME_CONFIG.xpPerRoute
    return [...GAME_CONFIG.levels].reverse().find(l => xp >= l.xpRequired) || GAME_CONFIG.levels[0]
  })

  // ── 初始化：讀取 Session ─────────────────────────────────
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

  // ── 登入：Username + Password ────────────────────────────
  async function signIn({ username, password }) {
    const email = toFakeEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      user.value = data.user
      await fetchProfile()
    }
    return { data, error }
  }

  // ── 註冊：Username + Password + 姓名 + 生日 + 頭像 ───────
  async function signUp({ username, password, displayName, birthday, avatarFile }) {
    const email = toFakeEmail(username)

    // 1. 建立 Supabase Auth 帳號
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:    displayName || username,
          username:     username,
          display_name: displayName || username,
        },
      },
    })
    if (error) return { data: null, error }

    const uid = data.user?.id
    if (!uid) return { data: null, error: new Error('註冊失敗，請重試') }

    // 2. 上傳頭像（可選）
    let avatarUrl = null
    if (avatarFile) {
      const ext  = avatarFile.name.split('.').pop()
      const path = `avatars/${uid}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = urlData.publicUrl
      }
    }

    // 3. 寫入用戶 Profile（handle_new_user trigger 已建立基本記錄，此處更新額外欄位）
    await supabase.from('users').upsert({
      id:           uid,
      username:     username,
      display_name: displayName || username,
      birthday:     birthday || null,
      avatar_url:   avatarUrl,
    }, { onConflict: 'id' })

    // 4. 若 Supabase 已停用 Email 確認 → session 直接可用，自動登入
    if (data.session) {
      user.value = data.user
      await fetchProfile()
    }

    return { data, error: null }
  }

  // ── 更新 Profile ──────────────────────────────────────────
  async function updateProfile({ displayName, birthday, avatarFile }) {
    if (!user.value) return { error: new Error('尚未登入') }

    let avatarUrl = profile.value?.avatar_url
    if (avatarFile) {
      const ext  = avatarFile.name.split('.').pop()
      const path = `avatars/${user.value.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('users').update({
      display_name: displayName,
      birthday:     birthday || null,
      avatar_url:   avatarUrl,
    }).eq('id', user.value.id)

    if (!error) {
      await fetchProfile()
    }
    return { error }
  }

  // ── Google OAuth ──────────────────────────────────────────
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value    = null
    profile.value = null
  }

  return {
    user, profile, loading, showLoginModal, isLoggedIn, currentLevel,
    init, signIn, signUp, signInWithGoogle, signOut, fetchProfile, updateProfile,
  }
})
