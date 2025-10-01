<template>
  <div class="estimator-layout">
    <!-- Map fills entire space -->
    <div class="map-section">
      <div class="map-header">
        <v-switch
          v-model="showHeatmap"
          label="Heatmap"
          color="primary"
          hide-details
          density="compact"
          class="ml-4"
        ></v-switch>
      </div>
      <ZoneMap :show-heatmap="showHeatmap" @zone-picked="handleZonePicked" />

      <!-- Floating zone selection alert -->
      <v-alert v-if="origin || dest" type="info" class="zone-alert" closable>
        <div v-if="origin && !dest">
          Origin: <v-chip size="small" color="primary">{{ getZoneName(origin) }}</v-chip>
          <span class="ml-2">Click another zone for destination</span>
        </div>
        <div v-else-if="origin && dest">
          Origin: <v-chip size="small" color="primary">{{ getZoneName(origin) }}</v-chip>
          →
          Dest: <v-chip size="small" color="success">{{ getZoneName(dest) }}</v-chip>
          <v-btn size="small" variant="text" @click="resetZones" class="ml-2">Reset</v-btn>
        </div>
      </v-alert>
    </div>

    <!-- Floating form panel (draggable) -->
    <v-card
      ref="formPanel"
      class="form-panel"
      elevation="8"
      :style="{ left: panelPosition.x + 'px', top: panelPosition.y + 'px' }"
    >
      <v-card-title
        class="text-h6 bg-primary drag-handle"
        @mousedown="startDrag"
        style="cursor: move; user-select: none;"
      >
        <v-icon start size="small">mdi-drag</v-icon>
        Shipment Details
      </v-card-title>
      <v-card-text class="pa-3">
        <EstimatorForm :origin="origin" :dest="dest" />
        <PriceBreakdown :result="quotesStore.currentQuote" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ZoneMap from '@/components/ZoneMap.vue'
import EstimatorForm from '@/components/EstimatorForm.vue'
import PriceBreakdown from '@/components/PriceBreakdown.vue'
import { useZonesStore } from '@/stores/useZonesStore'
import { usePricingStore } from '@/stores/usePricingStore'
import { useQuotesStore } from '@/stores/useQuotesStore'

const zonesStore = useZonesStore()
const pricingStore = usePricingStore()
const quotesStore = useQuotesStore()

const origin = ref<string>()
const dest = ref<string>()
const showHeatmap = ref(true)
const formPanel = ref<HTMLElement>()

// Draggable panel state
const panelPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// Initialize panel position (bottom right, accounting for drawers)
onMounted(() => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const rightDrawerWidth = 280 // Right presets drawer
  const panelWidth = 420
  const margin = 24

  panelPosition.value = {
    x: viewportWidth - rightDrawerWidth - panelWidth - margin,
    y: Math.max(100, viewportHeight - 550) // Start higher up, min 100px from top
  }
})

onMounted(async () => {
  await pricingStore.loadPresets()
})

function startDrag(e: MouseEvent) {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - panelPosition.value.x,
    y: e.clientY - panelPosition.value.y
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  panelPosition.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

function handleZonePicked(zoneId: string) {
  if (!origin.value) {
    origin.value = zoneId
  } else if (!dest.value) {
    dest.value = zoneId
  } else {
    // Reset and start over
    origin.value = zoneId
    dest.value = undefined
  }
}

function resetZones() {
  origin.value = undefined
  dest.value = undefined
}

function getZoneName(zoneId: string): string {
  return zonesStore.getZone(zoneId)?.name ?? zoneId
}
</script>

<style scoped>
.estimator-layout {
  position: relative;
  width: 100%;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.map-section {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-header {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.zone-alert {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  max-width: 600px;
}

.form-panel {
  position: fixed;
  z-index: 10;
  width: 420px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  transition: box-shadow 0.3s ease;
}

.form-panel:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important;
}

/* Make form panel scrollable */
.form-panel :deep(.v-card-text) {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>
