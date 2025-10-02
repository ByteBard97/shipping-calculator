<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-chart-timeline-variant</v-icon>
      Inventory Forecast & Reorder Calculator
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="currentStock"
            label="Current Stock"
            type="number"
            variant="outlined"
            density="compact"
            suffix="units"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="dailySalesAvg"
            label="Avg Daily Sales"
            type="number"
            variant="outlined"
            density="compact"
            suffix="units/day"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="leadTimeDays"
            label="Supplier Lead Time"
            type="number"
            variant="outlined"
            density="compact"
            suffix="days"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="safetyStockDays"
            label="Safety Stock"
            type="number"
            variant="outlined"
            density="compact"
            suffix="days"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12" md="4">
          <v-card :color="stockStatusColor" variant="tonal">
            <v-card-text>
              <div class="text-center">
                <v-icon size="48">{{ stockStatusIcon }}</v-icon>
                <div class="text-h6 mt-2">{{ stockStatus }}</div>
                <div class="text-caption">{{ daysOfStockRemaining }} days of stock</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card color="warning" variant="tonal">
            <v-card-text>
              <div class="text-center">
                <v-icon size="48">mdi-clock-alert</v-icon>
                <div class="text-h6 mt-2">Reorder Point</div>
                <div class="text-h4 text-warning">{{ reorderPoint }}</div>
                <div class="text-caption">units</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card color="primary" variant="tonal">
            <v-card-text>
              <div class="text-center">
                <v-icon size="48">mdi-package-variant</v-icon>
                <div class="text-h6 mt-2">Reorder Quantity</div>
                <div class="text-h4 text-primary">{{ reorderQuantity }}</div>
                <div class="text-caption">units</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-subtitle>Stock Level Forecast (Next 60 Days)</v-card-subtitle>
            <v-card-text>
              <div class="stock-chart">
                <v-progress-linear
                  :model-value="currentStockPercent"
                  :color="stockStatusColor"
                  height="40"
                  class="mb-2"
                >
                  <template v-slot:default>
                    <strong>Current: {{ currentStock }} units ({{ Math.round(currentStockPercent) }}%)</strong>
                  </template>
                </v-progress-linear>

                <div class="forecast-bars">
                  <div
                    v-for="week in forecastWeeks"
                    :key="week.week"
                    class="forecast-week"
                  >
                    <div class="text-caption mb-1">Week {{ week.week }}</div>
                    <v-progress-linear
                      :model-value="week.stockPercent"
                      :color="week.color"
                      height="30"
                    >
                      <template v-slot:default>
                        <small>{{ week.stock }} units</small>
                      </template>
                    </v-progress-linear>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <v-card variant="outlined" color="info">
            <v-card-subtitle>Velocity Metrics</v-card-subtitle>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Stock Turnover Rate</v-list-item-title>
                  <template v-slot:append>
                    <v-chip size="small" color="info">
                      {{ turnoverRate.toFixed(1) }}x per month
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Weekly Sales Velocity</v-list-item-title>
                  <template v-slot:append>
                    <span class="font-weight-bold">{{ (dailySalesAvg * 7).toFixed(0) }} units/week</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Monthly Sales Projection</v-list-item-title>
                  <template v-slot:append>
                    <span class="font-weight-bold">{{ (dailySalesAvg * 30).toFixed(0) }} units/month</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Stockout Risk</v-list-item-title>
                  <template v-slot:append>
                    <v-chip :color="stockoutRiskColor" size="small">
                      {{ stockoutRisk }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" :color="urgencyColor">
            <v-card-subtitle>Reorder Recommendations</v-card-subtitle>
            <v-card-text>
              <v-alert :type="urgencyType" variant="tonal" class="mb-3">
                <strong>{{ urgencyTitle }}</strong>
                <div>{{ urgencyMessage }}</div>
              </v-alert>

              <v-list density="compact">
                <v-list-item v-for="rec in recommendations" :key="rec">
                  <template v-slot:prepend>
                    <v-icon size="small" color="primary">mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ rec }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-subtitle>Seasonal Demand Forecast</v-card-subtitle>
            <v-card-text>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Expected Demand</th>
                    <th>Recommended Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="forecast in seasonalForecasts" :key="forecast.period">
                    <td>{{ forecast.period }}</td>
                    <td>
                      <v-chip :color="forecast.demandColor" size="small" variant="flat">
                        {{ forecast.demand }}
                      </v-chip>
                    </td>
                    <td class="font-weight-bold">{{ forecast.recommendedStock }} units</td>
                    <td>{{ forecast.action }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4" v-if="shouldReorder">
        <v-col cols="12" class="text-center">
          <v-btn color="error" size="large" prepend-icon="mdi-shopping">
            Place Reorder Now ({{ reorderQuantity }} units)
          </v-btn>
          <v-btn variant="outlined" size="large" class="ml-2" prepend-icon="mdi-email">
            Send Reorder Alert
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const currentStock = ref(450)
const dailySalesAvg = ref(18)
const leadTimeDays = ref(14)
const safetyStockDays = ref(7)

const daysOfStockRemaining = computed(() => {
  return Math.floor(currentStock.value / dailySalesAvg.value)
})

const reorderPoint = computed(() => {
  return Math.ceil(dailySalesAvg.value * (leadTimeDays.value + safetyStockDays.value))
})

const reorderQuantity = computed(() => {
  const monthlyDemand = dailySalesAvg.value * 30
  return Math.ceil(monthlyDemand)
})

const shouldReorder = computed(() => {
  return currentStock.value <= reorderPoint.value
})

const stockStatus = computed(() => {
  const days = daysOfStockRemaining.value
  if (days <= 7) return 'Critical'
  if (days <= 14) return 'Low Stock'
  if (days <= 30) return 'Adequate'
  return 'Healthy'
})

const stockStatusColor = computed(() => {
  const days = daysOfStockRemaining.value
  if (days <= 7) return 'error'
  if (days <= 14) return 'warning'
  if (days <= 30) return 'info'
  return 'success'
})

const stockStatusIcon = computed(() => {
  const days = daysOfStockRemaining.value
  if (days <= 7) return 'mdi-alert-octagon'
  if (days <= 14) return 'mdi-alert'
  if (days <= 30) return 'mdi-information'
  return 'mdi-check-circle'
})

const currentStockPercent = computed(() => {
  const optimal = reorderQuantity.value
  return (currentStock.value / optimal) * 100
})

const forecastWeeks = computed(() => {
  const weeks = []
  let stock = currentStock.value

  for (let i = 1; i <= 8; i++) {
    stock -= dailySalesAvg.value * 7
    const stockPercent = (stock / reorderQuantity.value) * 100

    let color = 'success'
    if (stock <= 0) color = 'error'
    else if (stock <= reorderPoint.value) color = 'warning'
    else if (stock <= reorderQuantity.value * 0.5) color = 'info'

    weeks.push({
      week: i,
      stock: Math.max(0, Math.round(stock)),
      stockPercent: Math.max(0, stockPercent),
      color
    })
  }

  return weeks
})

const turnoverRate = computed(() => {
  const monthlyDemand = dailySalesAvg.value * 30
  return monthlyDemand / currentStock.value
})

const stockoutRisk = computed(() => {
  const days = daysOfStockRemaining.value
  if (days <= 7) return 'Very High'
  if (days <= 14) return 'High'
  if (days <= 21) return 'Medium'
  return 'Low'
})

const stockoutRiskColor = computed(() => {
  const risk = stockoutRisk.value
  if (risk === 'Very High') return 'error'
  if (risk === 'High') return 'warning'
  if (risk === 'Medium') return 'info'
  return 'success'
})

const urgencyType = computed(() => {
  if (shouldReorder.value) return 'error'
  if (daysOfStockRemaining.value <= 14) return 'warning'
  return 'success'
})

const urgencyColor = computed(() => {
  if (shouldReorder.value) return 'error'
  if (daysOfStockRemaining.value <= 14) return 'warning'
  return 'success'
})

const urgencyTitle = computed(() => {
  if (shouldReorder.value) return 'REORDER NOW'
  if (daysOfStockRemaining.value <= 14) return 'Prepare to Reorder'
  return 'Stock Level Healthy'
})

const urgencyMessage = computed(() => {
  if (shouldReorder.value) {
    return `Your stock has reached the reorder point. Place an order for ${reorderQuantity.value} units immediately to avoid stockouts.`
  }
  if (daysOfStockRemaining.value <= 14) {
    return `You have ${daysOfStockRemaining.value} days of stock remaining. Start preparing your reorder to ensure continuity.`
  }
  return 'Your current stock levels are adequate. Monitor regularly for changes in demand.'
})

const recommendations = computed(() => {
  const recs = []

  if (shouldReorder.value) {
    recs.push(`Order ${reorderQuantity.value} units today`)
    recs.push('Consider expedited shipping if available')
    recs.push('Alert warehouse team of incoming stock')
  } else if (daysOfStockRemaining.value <= 14) {
    recs.push('Prepare purchase order documentation')
    recs.push('Contact supplier to confirm availability')
    recs.push('Schedule reorder within 3-5 days')
  } else {
    recs.push('Monitor daily sales trends')
    recs.push('Review supplier lead times quarterly')
    recs.push('Maintain safety stock buffer')
  }

  if (turnoverRate.value > 3) {
    recs.push('High turnover - consider increasing base stock')
  }

  return recs
})

const seasonalForecasts = [
  {
    period: 'Next Month',
    demand: 'Normal',
    demandColor: 'info',
    recommendedStock: Math.round(dailySalesAvg.value * 35),
    action: 'Standard reorder cycle'
  },
  {
    period: 'Holiday Season (Nov-Dec)',
    demand: 'High +25%',
    demandColor: 'warning',
    recommendedStock: Math.round(dailySalesAvg.value * 1.25 * 35),
    action: 'Increase stock by 25%'
  },
  {
    period: 'Spring (Mar-May)',
    demand: 'High +15%',
    demandColor: 'warning',
    recommendedStock: Math.round(dailySalesAvg.value * 1.15 * 35),
    action: 'Increase stock by 15%'
  },
  {
    period: 'Summer (Jun-Aug)',
    demand: 'Normal',
    demandColor: 'info',
    recommendedStock: Math.round(dailySalesAvg.value * 35),
    action: 'Maintain standard levels'
  }
]
</script>

<style scoped>
.stock-chart {
  padding: 16px 0;
}

.forecast-bars {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.forecast-week {
  text-align: center;
}
</style>
