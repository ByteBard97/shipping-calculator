<template>
  <v-form @submit.prevent="calculate">
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.origin_zone"
              :items="zoneOptions"
              label="Origin Zone"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.dest_zone"
              :items="zoneOptions"
              label="Destination Zone"
              density="compact"
            ></v-select>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-text-field
              v-model.number="form.length_in"
              label="Length (in)"
              type="number"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model.number="form.width_in"
              label="Width (in)"
              type="number"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model.number="form.height_in"
              label="Height (in)"
              type="number"
              density="compact"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.weight_lb"
              label="Weight (lb)"
              type="number"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.declared_value"
              label="Declared Value ($)"
              type="number"
              density="compact"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.service"
              :items="serviceOptions"
              label="Service Level"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="form.residential"
              label="Residential Delivery"
              color="primary"
              density="compact"
            ></v-switch>
          </v-col>
        </v-row>

  </v-form>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useZonesStore } from '@/stores/useZonesStore'
import { useQuotesStore } from '@/stores/useQuotesStore'
import type { Shipment } from '@/types'

const props = defineProps<{
  origin?: string
  dest?: string
}>()

const zonesStore = useZonesStore()
const quotesStore = useQuotesStore()

const form = reactive<Shipment>({
  origin_zone: '',
  dest_zone: '',
  length_in: 12,
  width_in: 10,
  height_in: 8,
  weight_lb: 5,
  service: 'standard',
  declared_value: 100,
  residential: false
})

const zoneOptions = computed(() => {
  // Get unique zones by zone_id
  const uniqueZones = new Map()
  zonesStore.zones?.features.forEach(f => {
    if (!uniqueZones.has(f.properties.zone_id)) {
      uniqueZones.set(f.properties.zone_id, {
        title: f.properties.name,
        value: f.properties.zone_id
      })
    }
  })
  return Array.from(uniqueZones.values())
})

const serviceOptions = [
  { title: 'Standard', value: 'standard' },
  { title: 'Expedited', value: 'expedited' }
]

watch(() => props.origin, (newOrigin) => {
  if (newOrigin) form.origin_zone = newOrigin
})

watch(() => props.dest, (newDest) => {
  if (newDest) form.dest_zone = newDest
})

// Auto-calculate on any form change
watch(form, () => {
  if (form.origin_zone && form.dest_zone) {
    calculate()
  }
}, { deep: true })

function calculate() {
  if (!form.origin_zone || !form.dest_zone) return
  quotesStore.setCurrentQuote({ ...form })
}
</script>
