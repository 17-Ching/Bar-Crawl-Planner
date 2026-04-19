import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { MAP_CONFIG } from '@/config'

export const useBarsStore = defineStore('bars', () => {
  const bars = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ── 從 Supabase 抓取範圍內酒吧（PostGIS ST_DWithin）─────────
  async function fetchNearby({ lat, lng, radiusKm = 2 }) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.rpc('bars_within_radius', {
        lat, lng, radius_km: radiusKm,
      })
      if (err) throw err
      bars.value = data || []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ── 以 Overpass API 從 OSM 查詢即時 POI ─────────────────────
  async function fetchFromOverpass({ lat, lng, radiusM = 1500, type = 'bar' }) {
    let innerQuery = ''
    if (type === 'all') {
      innerQuery = `
        node["amenity"~"bar|pub"](around:${radiusM},${lat},${lng});
        way["amenity"~"bar|pub"](around:${radiusM},${lat},${lng});
        node["shop"="convenience"](around:${radiusM},${lat},${lng});
        way["shop"="convenience"](around:${radiusM},${lat},${lng});
      `
    } else {
      const tagMap = {
        bar: 'amenity=bar',
        pub: 'amenity=pub',
        convenience: 'shop=convenience',
      }
      const tag = tagMap[type] || 'amenity=bar'
      innerQuery = `
        node[${tag}](around:${radiusM},${lat},${lng});
        way[${tag}](around:${radiusM},${lat},${lng});
      `
    }
    
    const query = `
      [out:json][timeout:25];
      (
${innerQuery}
      );
      out body center;
    `
    try {
      const res = await fetch(MAP_CONFIG.overpassUrl, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      if (res.status === 429) throw new Error('rate_limited')
      const text = await res.text()
      if (text.includes('rate_limited') || text.includes('Too Many Requests')) throw new Error('rate_limited')
      const json = JSON.parse(text)
      return (json.elements || []).map(el => {
        let cat = type
        if (type === 'all') {
          if (el.tags?.shop === 'convenience') cat = 'convenience'
          else if (el.tags?.amenity === 'pub') cat = 'pub'
          else cat = 'bar'
        }
        return {
          id: `osm_${el.id}`,
          name: el.tags?.name || (cat === 'convenience' ? '超商' : '酒吧'),
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          category: cat,
          tags: el.tags || {},
          source: 'osm',
        }
      }).filter(b => b.lat && b.lng)
    } catch (e) {
      if (e.message === 'rate_limited') throw e
      return []
    }
  }

  async function addBar(barData) {
    const { data, error: err } = await supabase.from('bars').insert(barData).select().single()
    if (!err && data) bars.value.push(data)
    return { data, error: err }
  }

  return { bars, loading, error, fetchNearby, fetchFromOverpass, addBar }
})
