<template>
  <div class="pa-4">
    <v-card-title class="px-0">Pricing Presets</v-card-title>

    <v-list>
      <v-list-item
        v-for="preset in pricingStore.presets"
        :key="preset.id"
        :active="pricingStore.currentPreset?.id === preset.id"
        @click="pricingStore.applyPreset(preset)"
      >
        <v-list-item-title>{{ preset.label }}</v-list-item-title>
        <v-list-item-subtitle>
          Base: ${{ preset.base_rate }} | Fuel: {{ preset.fuel_pct }}%
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-divider class="my-4"></v-divider>

    <v-text-field
      v-model="newPresetName"
      label="New Preset Name"
      density="compact"
      hide-details
    ></v-text-field>

    <v-btn
      color="primary"
      block
      class="mt-2"
      @click="savePreset"
      :disabled="!newPresetName"
    >
      <v-icon start>mdi-content-save</v-icon>
      Save Current as Preset
    </v-btn>

    <v-btn
      color="secondary"
      variant="outlined"
      block
      class="mt-2"
      @click="exportPreset"
    >
      <v-icon start>mdi-download</v-icon>
      Export Preset JSON
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePricingStore } from '@/stores/usePricingStore'

const pricingStore = usePricingStore()
const newPresetName = ref('')

function savePreset() {
  if (!newPresetName.value) return
  pricingStore.saveAsPreset(newPresetName.value)
  newPresetName.value = ''
}

function exportPreset() {
  if (!pricingStore.currentPreset) return
  const json = JSON.stringify(pricingStore.currentPreset, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `preset-${pricingStore.currentPreset.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
