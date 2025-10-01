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

    <!-- Floating form panel (bottom right) -->
    <v-card class="form-panel" elevation="8">
      <v-card-title class="text-h6 bg-primary">Shipment Details</v-card-title>
      <v-card-text class="pa-3">
        <EstimatorForm :origin="origin" :dest="dest" />
        <PriceBreakdown :result="quotesStore.currentQuote" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

onMounted(async () => {
  await pricingStore.loadPresets()
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
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 10;
  width: 420px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

/* Make form panel scrollable */
.form-panel :deep(.v-card-text) {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>
