<template>
  <v-card v-if="result" class="mt-4">
    <v-card-title class="d-flex align-center">
      <span>Price Quote</span>
      <v-spacer></v-spacer>
      <v-chip color="success" size="large">
        ${{ result.total.toFixed(2) }}
        <v-tooltip activator="parent" location="top">
          ±${{ result.band.toFixed(2) }} confidence band
        </v-tooltip>
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon start>mdi-information</v-icon>
            Breakdown Details
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-weight</v-icon>
                </template>
                <v-list-item-title>DIM Weight</v-list-item-title>
                <v-list-item-subtitle>{{ result.breakdown.dim_weight.toFixed(2) }} lb</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-scale-balance</v-icon>
                </template>
                <v-list-item-title>Billable Weight</v-list-item-title>
                <v-list-item-subtitle>{{ result.breakdown.billable_weight.toFixed(2) }} lb</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-map-marker-distance</v-icon>
                </template>
                <v-list-item-title>Distance</v-list-item-title>
                <v-list-item-subtitle>{{ result.breakdown.miles }} miles</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-map</v-icon>
                </template>
                <v-list-item-title>Zone Factor</v-list-item-title>
                <v-list-item-subtitle>{{ result.breakdown.zone_factor.toFixed(3) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-truck-fast</v-icon>
                </template>
                <v-list-item-title>Service Factor</v-list-item-title>
                <v-list-item-subtitle>{{ result.breakdown.service_factor.toFixed(3) }}</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <v-list-item-title>Variable Cost</v-list-item-title>
                <v-list-item-subtitle>${{ result.breakdown.variable_cost.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Subtotal</v-list-item-title>
                <v-list-item-subtitle>${{ result.breakdown.subtotal.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Fuel Surcharge</v-list-item-title>
                <v-list-item-subtitle>${{ result.breakdown.fuel_surcharge.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="result.breakdown.peak_surcharge > 0">
                <v-list-item-title>Peak Surcharge</v-list-item-title>
                <v-list-item-subtitle>${{ result.breakdown.peak_surcharge.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="result.breakdown.fixed_fees > 0">
                <v-list-item-title>Fixed Fees</v-list-item-title>
                <v-list-item-subtitle>${{ result.breakdown.fixed_fees.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="result.breakdown.insurance > 0">
                <v-list-item-title>Insurance</v-list-item-title>
                <v-list-item-subtitle>${{ result.breakdown.insurance.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <v-list-item-title class="text-h6">Total</v-list-item-title>
                <v-list-item-subtitle class="text-h6 text-success">${{ result.breakdown.total.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Confidence Band (±)</v-list-item-title>
                <v-list-item-subtitle>${{ result.breakdown.confidence_band.toFixed(2) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-alert type="info" variant="tonal" class="mt-4">
        <strong>Price Range:</strong>
        ${{ (result.total - result.band).toFixed(2) }} - ${{ (result.total + result.band).toFixed(2) }}
      </v-alert>
    </v-card-text>
  </v-card>

  <v-card v-else class="mt-4">
    <v-card-text class="text-center text-medium-emphasis">
      <v-icon size="64" class="mb-4">mdi-calculator</v-icon>
      <div>Select origin and destination zones to get a quote</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { QuoteResult } from '@/types'

defineProps<{
  result: QuoteResult | null
}>()
</script>
