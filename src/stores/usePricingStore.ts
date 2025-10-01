import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PricingPreset } from '@/types'

export const usePricingStore = defineStore('pricing', () => {
  const presets = ref<PricingPreset[]>([])
  const currentPreset = ref<PricingPreset | null>(null)
  const confidencePct = ref(8)

  // Editable pricing parameters
  const base_rate = ref(4.0)
  const per_mile = ref(0.25)
  const per_lb = ref(0.30)
  const dim_divisor = ref(139)
  const fuel_pct = ref(12)
  const residential_fee = ref(3.5)
  const peak_pct = ref(0)
  const service_multiplier_standard = ref(1.0)
  const service_multiplier_expedited = ref(1.35)

  async function loadPresets() {
    try {
      const response = await fetch('/data/presets.json')
      presets.value = await response.json()
      if (presets.value.length > 0) {
        applyPreset(presets.value[0])
      }
    } catch (e) {
      console.error('Failed to load presets', e)
    }
  }

  function applyPreset(preset: PricingPreset) {
    currentPreset.value = preset
    base_rate.value = preset.base_rate
    per_mile.value = preset.per_mile
    per_lb.value = preset.per_lb
    dim_divisor.value = preset.dim_divisor
    fuel_pct.value = preset.fuel_pct
    residential_fee.value = preset.residential_fee
    peak_pct.value = preset.peak_pct
    service_multiplier_standard.value = preset.service_multiplier.standard
    service_multiplier_expedited.value = preset.service_multiplier.expedited
  }

  function saveAsPreset(label: string): PricingPreset {
    const newPreset: PricingPreset = {
      id: `custom-${Date.now()}`,
      label,
      base_rate: base_rate.value,
      per_mile: per_mile.value,
      per_lb: per_lb.value,
      dim_divisor: dim_divisor.value,
      fuel_pct: fuel_pct.value,
      service_multiplier: {
        standard: service_multiplier_standard.value,
        expedited: service_multiplier_expedited.value
      },
      zone_multiplier_overrides: {},
      residential_fee: residential_fee.value,
      peak_pct: peak_pct.value
    }
    presets.value.push(newPreset)
    currentPreset.value = newPreset
    return newPreset
  }

  const currentParams = computed(() => ({
    base_rate: base_rate.value,
    per_mile: per_mile.value,
    per_lb: per_lb.value,
    dim_divisor: dim_divisor.value,
    fuel_pct: fuel_pct.value,
    residential_fee: residential_fee.value,
    peak_pct: peak_pct.value,
    service_multiplier: {
      standard: service_multiplier_standard.value,
      expedited: service_multiplier_expedited.value
    }
  }))

  return {
    presets,
    currentPreset,
    confidencePct,
    base_rate,
    per_mile,
    per_lb,
    dim_divisor,
    fuel_pct,
    residential_fee,
    peak_pct,
    service_multiplier_standard,
    service_multiplier_expedited,
    currentParams,
    loadPresets,
    applyPreset,
    saveAsPreset
  }
})
