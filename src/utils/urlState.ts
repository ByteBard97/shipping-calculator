import { usePricingStore } from '@/stores/usePricingStore'

export function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const pricingStore = usePricingStore()

  if (params.has('base_rate')) {
    pricingStore.base_rate = parseFloat(params.get('base_rate')!)
  }
  if (params.has('per_mile')) {
    pricingStore.per_mile = parseFloat(params.get('per_mile')!)
  }
  if (params.has('per_lb')) {
    pricingStore.per_lb = parseFloat(params.get('per_lb')!)
  }
  if (params.has('dim_divisor')) {
    pricingStore.dim_divisor = parseFloat(params.get('dim_divisor')!)
  }
  if (params.has('fuel_pct')) {
    pricingStore.fuel_pct = parseFloat(params.get('fuel_pct')!)
  }
  if (params.has('peak_pct')) {
    pricingStore.peak_pct = parseFloat(params.get('peak_pct')!)
  }
  if (params.has('residential_fee')) {
    pricingStore.residential_fee = parseFloat(params.get('residential_fee')!)
  }
}
