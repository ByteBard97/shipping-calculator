<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-calculator-variant</v-icon>
      Profit Margin Calculator
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-subtitle>Product Details</v-card-subtitle>
            <v-card-text>
              <v-text-field
                v-model.number="sellingPrice"
                label="Selling Price"
                prefix="$"
                type="number"
                step="0.01"
                variant="outlined"
                density="compact"
              ></v-text-field>

              <v-text-field
                v-model.number="productCost"
                label="Product Cost (COGS)"
                prefix="$"
                type="number"
                step="0.01"
                variant="outlined"
                density="compact"
                hint="Cost of Goods Sold"
              ></v-text-field>

              <v-text-field
                v-model.number="shippingCost"
                label="Shipping to Amazon"
                prefix="$"
                type="number"
                step="0.01"
                variant="outlined"
                density="compact"
              ></v-text-field>

              <v-select
                v-model="category"
                label="Product Category"
                :items="categories"
                variant="outlined"
                density="compact"
              ></v-select>

              <v-select
                v-model="fulfillmentMethod"
                label="Fulfillment Method"
                :items="['FBA', 'FBM']"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" color="primary">
            <v-card-subtitle>Fee Breakdown</v-card-subtitle>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-currency-usd</v-icon>
                  </template>
                  <v-list-item-title>Referral Fee ({{ referralFeePercent }}%)</v-list-item-title>
                  <template v-slot:append>
                    <span class="text-error">-${{ referralFee.toFixed(2) }}</span>
                  </template>
                </v-list-item>

                <v-list-item v-if="fulfillmentMethod === 'FBA'">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-package-variant</v-icon>
                  </template>
                  <v-list-item-title>FBA Fee</v-list-item-title>
                  <template v-slot:append>
                    <span class="text-error">-${{ fbaFee.toFixed(2) }}</span>
                  </template>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-tag</v-icon>
                  </template>
                  <v-list-item-title>Product Cost</v-list-item-title>
                  <template v-slot:append>
                    <span class="text-error">-${{ productCost.toFixed(2) }}</span>
                  </template>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-truck</v-icon>
                  </template>
                  <v-list-item-title>Shipping Cost</v-list-item-title>
                  <template v-slot:append>
                    <span class="text-error">-${{ shippingCost.toFixed(2) }}</span>
                  </template>
                </v-list-item>

                <v-divider class="my-2"></v-divider>

                <v-list-item>
                  <v-list-item-title class="font-weight-bold">Total Costs</v-list-item-title>
                  <template v-slot:append>
                    <span class="text-error font-weight-bold">-${{ totalCosts.toFixed(2) }}</span>
                  </template>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title class="text-h6">Net Profit</v-list-item-title>
                  <template v-slot:append>
                    <span :class="netProfit >= 0 ? 'text-success' : 'text-error'" class="text-h6 font-weight-bold">
                      ${{ netProfit.toFixed(2) }}
                    </span>
                  </template>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Profit Margin</v-list-item-title>
                  <template v-slot:append>
                    <v-chip :color="profitMarginColor" size="small">
                      {{ profitMarginPercent.toFixed(1) }}%
                    </v-chip>
                  </template>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>ROI</v-list-item-title>
                  <template v-slot:append>
                    <v-chip :color="roiColor" size="small">
                      {{ roi.toFixed(1) }}%
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-alert :type="recommendationType" variant="tonal">
            <template v-slot:prepend>
              <v-icon>{{ recommendationIcon }}</v-icon>
            </template>
            <strong>{{ recommendationTitle }}</strong>
            <div>{{ recommendationText }}</div>
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const sellingPrice = ref(29.99)
const productCost = ref(8.50)
const shippingCost = ref(2.00)
const category = ref('Pet Supplies')
const fulfillmentMethod = ref('FBA')

const categories = [
  'Pet Supplies',
  'Home & Kitchen',
  'Health & Household',
  'Grocery & Gourmet Food',
  'Office Products'
]

// Amazon referral fees by category (simplified)
const referralFees: Record<string, number> = {
  'Pet Supplies': 15,
  'Home & Kitchen': 15,
  'Health & Household': 15,
  'Grocery & Gourmet Food': 15,
  'Office Products': 15
}

const referralFeePercent = computed(() => referralFees[category.value] || 15)
const referralFee = computed(() => (sellingPrice.value * referralFeePercent.value) / 100)

// FBA fee estimation (simplified based on size/weight)
const fbaFee = computed(() => {
  if (fulfillmentMethod.value !== 'FBA') return 0
  // Simplified FBA fee calculation
  if (sellingPrice.value < 10) return 2.50
  if (sellingPrice.value < 20) return 3.31
  if (sellingPrice.value < 30) return 4.71
  return 5.98
})

const totalCosts = computed(() =>
  referralFee.value + fbaFee.value + productCost.value + shippingCost.value
)

const netProfit = computed(() => sellingPrice.value - totalCosts.value)

const profitMarginPercent = computed(() =>
  sellingPrice.value > 0 ? (netProfit.value / sellingPrice.value) * 100 : 0
)

const roi = computed(() =>
  (productCost.value + shippingCost.value) > 0
    ? (netProfit.value / (productCost.value + shippingCost.value)) * 100
    : 0
)

const profitMarginColor = computed(() => {
  if (profitMarginPercent.value >= 30) return 'success'
  if (profitMarginPercent.value >= 15) return 'warning'
  return 'error'
})

const roiColor = computed(() => {
  if (roi.value >= 100) return 'success'
  if (roi.value >= 50) return 'warning'
  return 'error'
})

const recommendationType = computed(() => {
  if (profitMarginPercent.value >= 30) return 'success'
  if (profitMarginPercent.value >= 15) return 'warning'
  return 'error'
})

const recommendationIcon = computed(() => {
  if (profitMarginPercent.value >= 30) return 'mdi-thumb-up'
  if (profitMarginPercent.value >= 15) return 'mdi-alert'
  return 'mdi-thumb-down'
})

const recommendationTitle = computed(() => {
  if (profitMarginPercent.value >= 30) return 'Excellent Profit Margin!'
  if (profitMarginPercent.value >= 15) return 'Acceptable Margin'
  return 'Low Profit Margin'
})

const recommendationText = computed(() => {
  if (profitMarginPercent.value >= 30) {
    return 'Your profit margin is above 30%, which is excellent for Amazon FBA. This product is highly profitable.'
  }
  if (profitMarginPercent.value >= 15) {
    return 'Your profit margin is acceptable but could be improved. Consider negotiating better supplier prices or optimizing shipping costs.'
  }
  return 'Your profit margin is below 15%, which may not be sustainable after advertising costs. Consider raising prices or reducing costs.'
})
</script>
