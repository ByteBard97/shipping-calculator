<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-chart-line</v-icon>
      Competitor Price Tracker
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="yourPrice"
            label="Your Price"
            prefix="$"
            type="number"
            variant="outlined"
            density="compact"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="8">
          <v-card variant="outlined">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Market Position</div>
                  <div class="text-h6">{{ marketPosition }}</div>
                </div>
                <v-chip :color="positionColor" variant="flat">
                  {{ positionText }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-table>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Price</th>
                <th>Rating</th>
                <th>Reviews</th>
                <th>Prime</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="competitor in sortedCompetitors"
                :key="competitor.seller"
                :class="competitor.isYou ? 'bg-primary-lighten-5' : ''"
              >
                <td>
                  <div class="d-flex align-center">
                    <v-icon v-if="competitor.isYou" size="small" class="mr-1">mdi-account</v-icon>
                    {{ competitor.seller }}
                  </div>
                </td>
                <td class="font-weight-bold">${{ competitor.price.toFixed(2) }}</td>
                <td>
                  <div class="d-flex align-center">
                    <v-icon size="small" color="warning" class="mr-1">mdi-star</v-icon>
                    {{ competitor.rating }}
                  </div>
                </td>
                <td>{{ competitor.reviews.toLocaleString() }}</td>
                <td>
                  <v-icon v-if="competitor.prime" size="small" color="info">mdi-truck-fast</v-icon>
                  <v-icon v-else size="small" color="grey">mdi-truck</v-icon>
                </td>
                <td>
                  <v-chip
                    v-if="!competitor.isYou"
                    :color="getDifferenceColor(competitor.price)"
                    size="small"
                    variant="flat"
                  >
                    {{ getPriceDifference(competitor.price) }}
                  </v-chip>
                  <span v-else class="text-caption text-medium-emphasis">Your price</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-alert :type="recommendationType" variant="tonal">
            <template v-slot:prepend>
              <v-icon>{{ recommendationIcon }}</v-icon>
            </template>
            <strong>Pricing Recommendation</strong>
            <div>{{ recommendation }}</div>
          </v-alert>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-subtitle>Price Statistics</v-card-subtitle>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Lowest Price</v-list-item-title>
                  <template v-slot:append>
                    <span class="font-weight-bold">${{ lowestPrice.toFixed(2) }}</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Average Price</v-list-item-title>
                  <template v-slot:append>
                    <span class="font-weight-bold">${{ averagePrice.toFixed(2) }}</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Highest Price</v-list-item-title>
                  <template v-slot:append>
                    <span class="font-weight-bold">${{ highestPrice.toFixed(2) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-subtitle>Suggested Actions</v-card-subtitle>
            <v-card-text>
              <v-list density="compact">
                <v-list-item v-for="action in suggestedActions" :key="action">
                  <template v-slot:prepend>
                    <v-icon size="small" color="primary">mdi-lightbulb-on</v-icon>
                  </template>
                  <v-list-item-title>{{ action }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Competitor {
  seller: string
  price: number
  rating: number
  reviews: number
  prime: boolean
  isYou?: boolean
}

const yourPrice = ref(24.99)

const competitors = ref<Competitor[]>([
  { seller: 'PetSuppliesPro', price: 22.99, rating: 4.5, reviews: 1243, prime: true },
  { seller: 'HayMaster', price: 26.50, rating: 4.8, reviews: 892, prime: true },
  { seller: 'GuineaPigWorld', price: 19.99, rating: 4.2, reviews: 456, prime: false },
  { seller: 'NaturesPet', price: 28.99, rating: 4.9, reviews: 2100, prime: true },
  { seller: 'BudgetPetCare', price: 21.50, rating: 3.9, reviews: 234, prime: false }
])

const sortedCompetitors = computed(() => {
  const withYou = [
    { seller: 'You (Happy Haystack)', price: yourPrice.value, rating: 4.7, reviews: 567, prime: true, isYou: true },
    ...competitors.value
  ]
  return withYou.sort((a, b) => a.price - b.price)
})

const lowestPrice = computed(() => Math.min(...competitors.value.map(c => c.price)))
const highestPrice = computed(() => Math.max(...competitors.value.map(c => c.price)))
const averagePrice = computed(() => {
  const sum = competitors.value.reduce((acc, c) => acc + c.price, 0)
  return sum / competitors.value.length
})

const marketPosition = computed(() => {
  const rank = sortedCompetitors.value.findIndex(c => c.isYou) + 1
  return `${rank} of ${sortedCompetitors.value.length}`
})

const positionColor = computed(() => {
  const rank = sortedCompetitors.value.findIndex(c => c.isYou) + 1
  const total = sortedCompetitors.value.length
  const percentile = rank / total

  if (percentile <= 0.33) return 'success'
  if (percentile <= 0.66) return 'warning'
  return 'error'
})

const positionText = computed(() => {
  const rank = sortedCompetitors.value.findIndex(c => c.isYou) + 1
  const total = sortedCompetitors.value.length
  const percentile = rank / total

  if (percentile <= 0.33) return 'Competitive'
  if (percentile <= 0.66) return 'Average'
  return 'Above Market'
})

const recommendationType = computed(() => {
  if (yourPrice.value < averagePrice.value * 0.9) return 'warning'
  if (yourPrice.value > averagePrice.value * 1.1) return 'error'
  return 'success'
})

const recommendationIcon = computed(() => {
  if (yourPrice.value < averagePrice.value * 0.9) return 'mdi-alert'
  if (yourPrice.value > averagePrice.value * 1.1) return 'mdi-arrow-down'
  return 'mdi-check-circle'
})

const recommendation = computed(() => {
  if (yourPrice.value < lowestPrice.value) {
    return 'You\'re priced below all competitors! Consider raising your price to increase profit margins.'
  }
  if (yourPrice.value < averagePrice.value * 0.9) {
    return 'You\'re significantly below the average market price. You could potentially increase your price without losing competitiveness.'
  }
  if (yourPrice.value > highestPrice.value) {
    return 'You\'re priced above all competitors. Unless you have superior quality or brand recognition, consider lowering your price.'
  }
  if (yourPrice.value > averagePrice.value * 1.1) {
    return 'You\'re above the average market price. Consider reducing your price to be more competitive.'
  }
  return 'Your price is competitive within the market range. Monitor competitors regularly for changes.'
})

const suggestedActions = computed(() => {
  const actions = []

  if (yourPrice.value < lowestPrice.value) {
    actions.push('Test a $2-3 price increase')
    actions.push('Emphasize premium quality in listing')
  } else if (yourPrice.value > highestPrice.value) {
    actions.push('Reduce price to match top competitor')
    actions.push('Add value through bundles or quantity')
  } else {
    actions.push('Monitor daily for price changes')
    actions.push('Set up automated repricing rules')
  }

  const primeCompetitors = competitors.value.filter(c => c.prime).length
  if (primeCompetitors > competitors.value.length * 0.7) {
    actions.push('Ensure Prime eligibility to compete')
  }

  return actions
})

function getPriceDifference(competitorPrice: number): string {
  const diff = yourPrice.value - competitorPrice
  const sign = diff > 0 ? '+' : ''
  return `${sign}$${diff.toFixed(2)}`
}

function getDifferenceColor(competitorPrice: number): string {
  const diff = yourPrice.value - competitorPrice
  if (diff < -2) return 'success'
  if (diff < 2) return 'warning'
  return 'error'
}
</script>
