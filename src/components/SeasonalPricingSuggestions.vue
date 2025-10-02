<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-calendar-star</v-icon>
      Seasonal Pricing Suggestions
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-select
            v-model="currentSeason"
            label="Current Season"
            :items="seasons"
            variant="outlined"
            density="compact"
          ></v-select>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model.number="basePrice"
            label="Base Price"
            prefix="$"
            type="number"
            variant="outlined"
            density="compact"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Suggested Price</div>
              <div class="text-h5 text-primary">{{ suggestedPrice }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-timeline side="end" density="compact">
            <v-timeline-item
              v-for="period in seasonalPeriods"
              :key="period.name"
              :dot-color="period.season === currentSeason ? 'primary' : 'grey'"
              size="small"
            >
              <template v-slot:opposite>
                <div class="text-caption">{{ period.dates }}</div>
              </template>
              <v-card :variant="period.season === currentSeason ? 'outlined' : 'flat'" :color="period.season === currentSeason ? 'primary' : ''">
                <v-card-title class="text-subtitle-1">
                  {{ period.name }}
                  <v-chip v-if="period.season === currentSeason" size="x-small" color="primary" class="ml-2">Current</v-chip>
                </v-card-title>
                <v-card-text>
                  <div class="mb-2">
                    <v-chip size="small" :color="getDemandColor(period.demand)" variant="flat" class="mr-2">
                      {{ period.demand }} Demand
                    </v-chip>
                    <v-chip size="small" color="info" variant="outlined">
                      {{ period.priceAdjustment }}
                    </v-chip>
                  </div>
                  <div class="text-caption">{{ period.strategy }}</div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card variant="outlined" color="info">
            <v-card-subtitle>Current Period Strategy</v-card-subtitle>
            <v-card-text>
              <div class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1">Demand Level</div>
                <v-progress-linear
                  :model-value="currentDemandLevel"
                  :color="getCurrentDemandColor()"
                  height="20"
                >
                  <template v-slot:default>
                    <strong>{{ currentDemandLevel }}%</strong>
                  </template>
                </v-progress-linear>
              </div>
              <v-list density="compact">
                <v-list-item v-for="tip in currentTips" :key="tip">
                  <template v-slot:prepend>
                    <v-icon size="small" color="info">mdi-lightbulb</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ tip }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" color="warning">
            <v-card-subtitle>Upcoming Opportunities</v-card-subtitle>
            <v-card-text>
              <v-list density="compact">
                <v-list-item v-for="opportunity in upcomingOpportunities" :key="opportunity.event">
                  <template v-slot:prepend>
                    <v-icon size="small" color="warning">mdi-calendar-alert</v-icon>
                  </template>
                  <v-list-item-title>{{ opportunity.event }}</v-list-item-title>
                  <v-list-item-subtitle>{{ opportunity.date }} - {{ opportunity.action }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-subtitle>Historical Performance (Mock Data)</v-card-subtitle>
            <v-card-text>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Avg Price</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="data in historicalData" :key="data.period">
                    <td>{{ data.period }}</td>
                    <td>${{ data.avgPrice.toFixed(2) }}</td>
                    <td>{{ data.unitsSold }}</td>
                    <td>${{ data.revenue.toLocaleString() }}</td>
                    <td>
                      <v-icon :color="data.trend === 'up' ? 'success' : 'error'" size="small">
                        {{ data.trend === 'up' ? 'mdi-trending-up' : 'mdi-trending-down' }}
                      </v-icon>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'Holiday']
const currentSeason = ref('Fall')
const basePrice = ref(24.99)

interface SeasonalPeriod {
  name: string
  season: string
  dates: string
  demand: string
  priceAdjustment: string
  strategy: string
}

const seasonalPeriods: SeasonalPeriod[] = [
  {
    name: 'Winter Rush',
    season: 'Winter',
    dates: 'Jan-Feb',
    demand: 'Low',
    priceAdjustment: 'Base Price',
    strategy: 'Focus on customer retention, build reviews'
  },
  {
    name: 'Spring Growth',
    season: 'Spring',
    dates: 'Mar-May',
    demand: 'High',
    priceAdjustment: '+10-15%',
    strategy: 'Peak guinea pig adoption season - increase prices slightly'
  },
  {
    name: 'Summer Steady',
    season: 'Summer',
    dates: 'Jun-Aug',
    demand: 'Medium',
    priceAdjustment: '+5-10%',
    strategy: 'Maintain competitive pricing, promote bundles'
  },
  {
    name: 'Fall Peak',
    season: 'Fall',
    dates: 'Sep-Oct',
    demand: 'Very High',
    priceAdjustment: '+15-20%',
    strategy: 'Back to school pets - premium pricing opportunity'
  },
  {
    name: 'Holiday Season',
    season: 'Holiday',
    dates: 'Nov-Dec',
    demand: 'Extreme',
    priceAdjustment: '+20-25%',
    strategy: 'Gift-giving season - maximize margins, ensure stock'
  }
]

const priceMultipliers: Record<string, number> = {
  'Winter': 1.0,
  'Spring': 1.125,
  'Summer': 1.075,
  'Fall': 1.175,
  'Holiday': 1.225
}

const suggestedPrice = computed(() => {
  const multiplier = priceMultipliers[currentSeason.value] || 1.0
  return `$${(basePrice.value * multiplier).toFixed(2)}`
})

const currentDemandLevel = computed(() => {
  const levels: Record<string, number> = {
    'Winter': 40,
    'Spring': 75,
    'Summer': 60,
    'Fall': 85,
    'Holiday': 95
  }
  return levels[currentSeason.value] || 50
})

function getDemandColor(demand: string): string {
  const colors: Record<string, string> = {
    'Low': 'grey',
    'Medium': 'info',
    'High': 'warning',
    'Very High': 'orange',
    'Extreme': 'error'
  }
  return colors[demand] || 'grey'
}

function getCurrentDemandColor(): string {
  const level = currentDemandLevel.value
  if (level >= 80) return 'error'
  if (level >= 60) return 'warning'
  if (level >= 40) return 'info'
  return 'grey'
}

const currentTips = computed(() => {
  const tips: Record<string, string[]> = {
    'Winter': [
      'Offer discounts to clear inventory',
      'Build customer loyalty with promotions',
      'Test new product variations',
      'Prepare stock for spring rush'
    ],
    'Spring': [
      'Increase prices by 10-15%',
      'Ensure adequate inventory levels',
      'Promote multi-pack bundles',
      'Leverage adoption season messaging'
    ],
    'Summer': [
      'Maintain competitive pricing',
      'Focus on Prime Day promotions',
      'Clear slow-moving inventory',
      'Build reviews during steady period'
    ],
    'Fall': [
      'Premium pricing opportunity',
      'Stock up for holiday season',
      'Create gift bundles',
      'Emphasize quality and freshness'
    ],
    'Holiday': [
      'Maximum price optimization',
      'Ensure Prime eligibility',
      'Create holiday gift sets',
      'Monitor inventory daily to avoid stockouts'
    ]
  }
  return tips[currentSeason.value] || []
})

const upcomingOpportunities = computed(() => {
  const opportunities: Record<string, any[]> = {
    'Winter': [
      { event: 'Valentine\'s Day', date: 'Feb 14', action: 'Create heart-themed bundles' },
      { event: 'Spring Prep', date: 'Late Feb', action: 'Build inventory for spring rush' }
    ],
    'Spring': [
      { event: 'Easter', date: 'April', action: 'Promote as Easter gifts for new pets' },
      { event: 'Mother\'s Day', date: 'May', action: 'Gift bundle promotions' }
    ],
    'Summer': [
      { event: 'Prime Day', date: 'July', action: 'Plan lightning deals 2 weeks ahead' },
      { event: 'Back to School', date: 'Late Aug', action: 'Start fall inventory buildup' }
    ],
    'Fall': [
      { event: 'Halloween', date: 'Oct 31', action: 'Themed packaging options' },
      { event: 'Black Friday Prep', date: 'Nov', action: 'Lock in inventory by Oct 15' }
    ],
    'Holiday': [
      { event: 'Black Friday', date: 'Nov 24', action: 'Aggressive promotion planning' },
      { event: 'Christmas Rush', date: 'Dec', action: 'Ensure cutoff dates for delivery' }
    ]
  }
  return opportunities[currentSeason.value] || []
})

const historicalData = [
  { period: 'Last Holiday', avgPrice: 29.99, unitsSold: 845, revenue: 25342, trend: 'up' },
  { period: 'Last Fall', avgPrice: 27.49, unitsSold: 623, revenue: 17122, trend: 'up' },
  { period: 'Last Summer', avgPrice: 25.99, unitsSold: 489, revenue: 12709, trend: 'down' },
  { period: 'Last Spring', avgPrice: 26.99, unitsSold: 712, revenue: 19217, trend: 'up' },
  { period: 'Last Winter', avgPrice: 22.99, unitsSold: 334, revenue: 7679, trend: 'down' }
]
</script>
