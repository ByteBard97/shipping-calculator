import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Shipment, QuoteResult, PriceBreakdown } from '@/types'
import { useZonesStore } from './useZonesStore'
import { usePricingStore } from './usePricingStore'

export const useQuotesStore = defineStore('quotes', () => {
  const currentQuote = ref<QuoteResult | null>(null)
  const batchResults = ref<QuoteResult[]>([])

  function calculateQuote(shipment: Shipment): QuoteResult {
    const zonesStore = useZonesStore()
    const pricingStore = usePricingStore()
    const params = pricingStore.currentParams

    // Calculate DIM weight
    const dim_weight = (shipment.length_in * shipment.width_in * shipment.height_in) / params.dim_divisor
    const billable_weight = Math.max(shipment.weight_lb, dim_weight)

    // Get distance
    const miles = zonesStore.getDistance(shipment.origin_zone, shipment.dest_zone)

    // Get zone factors
    const originZone = zonesStore.getZone(shipment.origin_zone)
    const destZone = zonesStore.getZone(shipment.dest_zone)
    const zone_factor = ((originZone?.multiplier ?? 1) + (destZone?.multiplier ?? 1)) / 2

    // Service factor
    const service_factor = shipment.service === 'standard'
      ? params.service_multiplier.standard
      : params.service_multiplier.expedited

    // Variable costs
    const variable_cost = params.per_mile * miles + params.per_lb * billable_weight

    // Subtotal
    const subtotal = (params.base_rate + variable_cost) * zone_factor * service_factor

    // Surcharges
    const fuel_surcharge = subtotal * (params.fuel_pct / 100)
    const peak_surcharge = subtotal * (params.peak_pct / 100)

    // Fixed fees
    let fixed_fees = 0
    if (shipment.residential) {
      fixed_fees += params.residential_fee
    }
    if (originZone?.remote_fee) {
      fixed_fees += originZone.remote_fee
    }
    if (destZone?.remote_fee) {
      fixed_fees += destZone.remote_fee
    }

    // Insurance
    const insurance = Math.max(0, (shipment.declared_value - 100)) * 0.01

    // Total
    const total = Math.round((subtotal + fuel_surcharge + peak_surcharge + fixed_fees + insurance) * 100) / 100

    // Confidence band
    const confidence_band = Math.round(total * (pricingStore.confidencePct / 100) * 100) / 100

    const breakdown: PriceBreakdown = {
      dim_weight,
      billable_weight,
      miles,
      zone_factor,
      service_factor,
      variable_cost,
      subtotal,
      fuel_surcharge,
      peak_surcharge,
      fixed_fees,
      insurance,
      total,
      confidence_band
    }

    return {
      shipment,
      breakdown,
      total,
      band: confidence_band
    }
  }

  function setCurrentQuote(shipment: Shipment) {
    currentQuote.value = calculateQuote(shipment)
  }

  function calculateBatch(shipments: Shipment[]): QuoteResult[] {
    batchResults.value = shipments.map(s => calculateQuote(s))
    return batchResults.value
  }

  return {
    currentQuote,
    batchResults,
    calculateQuote,
    setCurrentQuote,
    calculateBatch
  }
})
