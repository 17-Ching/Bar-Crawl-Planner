import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config'

// ── Demo 模式 Mock Client ──────────────────────────────
// 當 Supabase 憑證未設定時，回傳無害的 mock 物件，讓 UI 正常渲染
const noop = () => Promise.resolve({ data: null, error: null })
const mockQueryBuilder = {
  select: () => mockQueryBuilder,
  insert: () => mockQueryBuilder,
  update: () => mockQueryBuilder,
  delete: () => mockQueryBuilder,
  eq: () => mockQueryBuilder,
  ilike: () => mockQueryBuilder,
  not: () => mockQueryBuilder,
  gte: () => mockQueryBuilder,
  order: () => mockQueryBuilder,
  limit: () => mockQueryBuilder,
  single: () => Promise.resolve({ data: null, error: null }),
  then: (resolve) => resolve({ data: [], error: null }),
}
const mockClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: noop,
    signOut: noop,
  },
  from: () => mockQueryBuilder,
  rpc: () => Promise.resolve({ data: [], error: null }),
  storage: {
    from: () => ({
      upload: noop,
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
}

export const isDemoMode = !SUPABASE_URL || !SUPABASE_ANON_KEY

if (isDemoMode) {
  console.warn(
    '%c[不醉不歸] Demo 模式啟動 🍺\n' +
    '請複製 .env.example 為 .env.local 並填入 Supabase 憑證以啟用完整功能。',
    'color:#C084FC;font-weight:bold'
  )
}

// 建立 Supabase 客戶端（全域單例），未設定時使用 mock
export const supabase = isDemoMode
  ? mockClient
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })

export default supabase
