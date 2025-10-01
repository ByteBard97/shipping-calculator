import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ZoneCollection, Zone, DistanceMatrix } from '@/types'

export const useZonesStore = defineStore('zones', () => {
  const zones = ref<ZoneCollection | null>(null)
  const matrix = ref<DistanceMatrix>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadZones() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch('/data/zones.geojson')
      zones.value = await response.json()
    } catch (e) {
      error.value = 'Failed to load zones'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function loadMatrix() {
    try {
      const response = await fetch('/data/matrix.json')
      matrix.value = await response.json()
    } catch (e) {
      console.error('Failed to load distance matrix', e)
    }
  }

  function getZone(zoneId: string): Zone | undefined {
    return zones.value?.features.find(f => f.properties.zone_id === zoneId)?.properties
  }

  function getDistance(origin: string, dest: string): number {
    return matrix.value[origin]?.[dest] ?? 500 // fallback
  }

  return {
    zones,
    matrix,
    loading,
    error,
    loadZones,
    loadMatrix,
    getZone,
    getDistance
  }
})
