<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import { useZonesStore } from '@/stores/useZonesStore'
import type { Zone } from '@/types'

const emit = defineEmits<{
  zonePicked: [zoneId: string]
}>()

const props = defineProps<{
  showHeatmap?: boolean
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null

const zonesStore = useZonesStore()

onMounted(async () => {
  await zonesStore.loadZones()
  await zonesStore.loadMatrix()
  initMap()
})

function initMap() {
  if (!mapContainer.value || !zonesStore.zones) return

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        'carto-light': {
          type: 'raster',
          tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
      },
      layers: [
        {
          id: 'carto-light-layer',
          type: 'raster',
          source: 'carto-light',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    },
    center: [-98, 39],
    zoom: 3.5
  })

  map.on('load', () => {
    if (!map || !zonesStore.zones) return

    // Add zones source
    map.addSource('zones', {
      type: 'geojson',
      data: zonesStore.zones
    })

    // Add fill layer
    map.addLayer({
      id: 'zones-fill',
      type: 'fill',
      source: 'zones',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'multiplier'],
          0.98, '#4CAF50',
          1.00, '#8BC34A',
          1.05, '#FFC107',
          1.10, '#FF9800',
          1.15, '#FF5722'
        ],
        'fill-opacity': props.showHeatmap ? 0.6 : 0.3
      }
    })

    // Add outline layer
    map.addLayer({
      id: 'zones-outline',
      type: 'line',
      source: 'zones',
      paint: {
        'line-color': '#333',
        'line-width': 2
      }
    })

    // Add labels (removed - requires glyphs/font configuration)

    // Click handler
    map.on('click', 'zones-fill', (e) => {
      if (!e.features || !e.features[0]) return
      const zone = e.features[0].properties as Zone
      emit('zonePicked', zone.zone_id)
    })

    // Hover cursor
    map.on('mouseenter', 'zones-fill', () => {
      if (map) map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'zones-fill', () => {
      if (map) map.getCanvas().style.cursor = ''
    })

    // Popup on hover
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false
    })

    map.on('mousemove', 'zones-fill', (e) => {
      if (!e.features || !e.features[0] || !map) return
      const zone = e.features[0].properties as Zone
      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 8px;">
            <strong>${zone.name}</strong><br/>
            Zone: ${zone.zone_id}<br/>
            Multiplier: ${zone.multiplier}<br/>
            Remote Fee: $${zone.remote_fee}
          </div>
        `)
        .addTo(map)
    })

    map.on('mouseleave', 'zones-fill', () => {
      popup.remove()
    })
  })
}

watch(() => props.showHeatmap, (show) => {
  if (!map || !map.getLayer('zones-fill')) return
  map.setPaintProperty('zones-fill', 'fill-opacity', show ? 0.6 : 0.3)
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
