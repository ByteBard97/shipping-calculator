<template>
  <v-container fluid class="pa-0 fill-height">
    <v-row no-gutters class="fill-height">
      <v-col cols="12" md="7" class="map-col">
        <div class="pa-2">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Zone Map</span>
              <v-spacer></v-spacer>
              <v-switch
                v-model="showHeatmap"
                label="Heatmap"
                color="primary"
                hide-details
                density="compact"
              ></v-switch>
            </v-card-title>
            <v-card-text class="pa-0">
              <ZoneMap :show-heatmap="showHeatmap" @zone-picked="handleZonePicked" />
            </v-card-text>
          </v-card>

          <v-alert v-if="origin || dest" type="info" class="mt-2" closable>
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
      </v-col>

      <v-col cols="12" md="5">
        <div class="pa-2">
          <EstimatorForm :origin="origin" :dest="dest" />
          <PriceBreakdown :result="quotesStore.currentQuote" />
        </div>
      </v-col>
    </v-row>
  </v-container>
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
.fill-height {
  height: calc(100vh - 64px);
}

.map-col {
  overflow-y: auto;
}
</style>
