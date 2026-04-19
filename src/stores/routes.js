import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { MAP_CONFIG } from '@/config'

export const useRouteStore = defineStore('routes', () => {
  const waypoints = ref([])   // 已選取的中繼點 [{bar, order}]
  const routeGeometry = ref(null)  // OSRM 回傳的 GeoJSON LineString
  const routeStats = ref(null)     // { distanceKm, durationMin, barCount, convenienceCount }
  const savedRoutes = ref([])
  const myRoutes = ref([])
  const loading = ref(false)

  const waypointCount = computed(() => waypoints.value.length)
  const canPlan = computed(() => waypoints.value.length >= 2)

  // ── 新增中繼點 ─────────────────────────────────────────────
  function addWaypoint(bar) {
    if (waypoints.value.some(w => w.bar.id === bar.id)) return
    waypoints.value.push({ bar, order: waypoints.value.length + 1 })
  }

  function removeWaypoint(barId) {
    waypoints.value = waypoints.value.filter(w => w.bar.id !== barId)
    waypoints.value.forEach((w, i) => { w.order = i + 1 })
  }

  function clearWaypoints() {
    waypoints.value = []
    routeGeometry.value = null
    routeStats.value = null
  }

  // ── 呼叫 OSRM 規劃路線 ────────────────────────────────────
  async function planRoute() {
    if (!canPlan.value) return
    loading.value = true

    const coords = waypoints.value
      .map(w => `${w.bar.lng ?? w.bar.location?.lng},${w.bar.lat ?? w.bar.location?.lat}`)
      .join(';')

    try {
      const url = `${MAP_CONFIG.osrmBase}/${coords}?overview=full&geometries=geojson&steps=false`
      const res = await fetch(url)
      const data = await res.json()

      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('OSRM 路線規劃失敗')

      const route = data.routes[0]
      routeGeometry.value = route.geometry  // GeoJSON LineString

      const barCount = waypoints.value.filter(w => w.bar.category !== 'convenience').length
      const convCount = waypoints.value.filter(w => w.bar.category === 'convenience').length

      routeStats.value = {
        distanceKm: (route.distance / 1000).toFixed(2),
        durationMin: Math.ceil(route.duration / 60),
        barCount,
        convenienceCount: convCount,
        difficulty: barCount <= 3 ? 'easy' : barCount <= 6 ? 'medium' : 'hard',
      }
    } catch (e) {
      console.error('路線規劃錯誤：', e)
      routeStats.value = null
    } finally {
      loading.value = false
    }
  }

  // ── 儲存路線至 Supabase ───────────────────────────────────
  async function saveRoute({ name, description, isPublic, creatorId }) {
    if (!routeStats.value || !creatorId) return null

    const { data, error } = await supabase.from('routes').insert({
      creator_id: creatorId,
      name,
      description,
      waypoints: waypoints.value.map(w => ({ bar_id: w.bar.id, order: w.order, bar_name: w.bar.name, lat: w.bar.lat, lng: w.bar.lng, category: w.bar.category })),
      total_distance_km: parseFloat(routeStats.value.distanceKm),
      estimated_duration_min: routeStats.value.durationMin,
      bar_count: routeStats.value.barCount,
      convenience_store_count: routeStats.value.convenienceCount,
      difficulty: routeStats.value.difficulty,
      is_public: isPublic,
    }).select().single()

    if (!error && data) savedRoutes.value.unshift(data)
    return { data, error }
  }

  // ── 載入自己建立的路線 ────────────────────────────────────
  async function fetchMyRoutes(creatorId) {
    if (!creatorId) return
    const { data } = await supabase
      .from('routes')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
    myRoutes.value = data || []
  }

  // ── 載入公開路線 ──────────────────────────────────────────
  async function fetchPublicRoutes() {
    const { data } = await supabase
      .from('routes')
      .select('*, users(username, avatar_url, level)')
      .eq('is_public', true)
      .order('like_count', { ascending: false })
      .limit(20)
    savedRoutes.value = data || []
  }

  return {
    waypoints, routeGeometry, routeStats, savedRoutes, myRoutes, loading,
    waypointCount, canPlan,
    addWaypoint, removeWaypoint, clearWaypoints, planRoute, saveRoute, fetchPublicRoutes, fetchMyRoutes,
  }
})
