<template>
  <div class="pa-4">
    <v-card-title class="px-0">Pricing Controls</v-card-title>

    <v-expansion-panels multiple class="slider-panels">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon start>mdi-currency-usd</v-icon>
          Base Rates
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-text-field
            v-model.number="pricingStore.base_rate"
            label="Base Rate ($)"
            type="number"
            step="0.1"
            density="compact"
          ></v-text-field>

          <v-slider
            v-model="pricingStore.per_mile"
            label="Per Mile ($)"
            min="0"
            max="1"
            step="0.01"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.per_mile"
                type="number"
                step="0.01"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>

          <v-slider
            v-model="pricingStore.per_lb"
            label="Per Lb ($)"
            min="0"
            max="1"
            step="0.01"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.per_lb"
                type="number"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon start>mdi-cube-outline</v-icon>
          Dimensional
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-slider
            v-model="pricingStore.dim_divisor"
            label="DIM Divisor"
            min="100"
            max="200"
            step="1"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.dim_divisor"
                type="number"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon start>mdi-gas-station</v-icon>
          Surcharges
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-slider
            v-model="pricingStore.fuel_pct"
            label="Fuel Surcharge (%)"
            min="0"
            max="30"
            step="0.5"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.fuel_pct"
                type="number"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>

          <v-slider
            v-model="pricingStore.peak_pct"
            label="Peak Season (%)"
            min="0"
            max="20"
            step="0.5"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.peak_pct"
                type="number"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon start>mdi-home</v-icon>
          Fees
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-slider
            v-model="pricingStore.residential_fee"
            label="Residential Fee ($)"
            min="0"
            max="10"
            step="0.5"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.residential_fee"
                type="number"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon start>mdi-truck</v-icon>
          Service Levels
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-slider
            v-model="pricingStore.service_multiplier_standard"
            label="Standard Multiplier"
            min="0.5"
            max="2"
            step="0.05"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.service_multiplier_standard"
                type="number"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>

          <v-slider
            v-model="pricingStore.service_multiplier_expedited"
            label="Expedited Multiplier"
            min="0.5"
            max="2"
            step="0.05"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.service_multiplier_expedited"
                type="number"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon start>mdi-chart-bell-curve</v-icon>
          Confidence
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-slider
            v-model="pricingStore.confidencePct"
            label="Confidence Band (%)"
            min="0"
            max="20"
            step="1"
            thumb-label
          >
            <template v-slot:append>
              <v-text-field
                v-model.number="pricingStore.confidencePct"
                type="number"
                density="compact"
                hide-details
              ></v-text-field>
            </template>
          </v-slider>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { usePricingStore } from '@/stores/usePricingStore'

const pricingStore = usePricingStore()
</script>

<style scoped>
.slider-panels :deep(.v-slider) {
  margin-bottom: 16px;
}

.slider-panels :deep(.v-input__append) {
  margin-inline-start: 8px !important;
  min-width: 70px;
  max-width: 70px;
}

.slider-panels :deep(.v-input__append .v-text-field) {
  width: 70px !important;
  min-width: 70px !important;
  max-width: 70px !important;
}

.slider-panels :deep(.v-input__append .v-field__input) {
  padding: 0 8px !important;
  min-height: 32px !important;
}
</style>
