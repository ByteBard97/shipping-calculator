<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-package-variant-closed</v-icon>
      Bundle Product Creator
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-subtitle>Available Products</v-card-subtitle>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="product in availableProducts"
                  :key="product.sku"
                  @click="addToBundle(product)"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="product.color" size="40">
                      <v-icon color="white">{{ product.icon }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ product.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ product.size }} - ${{ product.price.toFixed(2) }}</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn icon size="small" variant="text">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" color="primary">
            <v-card-subtitle>Bundle Contents</v-card-subtitle>
            <v-card-text>
              <v-list v-if="bundleItems.length > 0">
                <v-list-item
                  v-for="(item, index) in bundleItems"
                  :key="index"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="item.color" size="40">
                      <v-icon color="white">{{ item.icon }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.size }} × {{ item.quantity }}</v-list-item-subtitle>
                  <template v-slot:append>
                    <div class="d-flex align-center">
                      <v-btn icon size="x-small" variant="text" @click="decreaseQuantity(index)">
                        <v-icon>mdi-minus</v-icon>
                      </v-btn>
                      <span class="mx-2">{{ item.quantity }}</span>
                      <v-btn icon size="x-small" variant="text" @click="increaseQuantity(index)">
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                      <v-btn icon size="small" variant="text" color="error" @click="removeFromBundle(index)" class="ml-2">
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert v-else type="info" variant="tonal">
                Click on products to add them to your bundle
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4" v-if="bundleItems.length > 0">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-subtitle>Bundle Details</v-card-subtitle>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="bundleName"
                    label="Bundle Name"
                    variant="outlined"
                    density="compact"
                    hint="e.g., Ultimate Guinea Pig Starter Kit"
                  ></v-text-field>

                  <v-textarea
                    v-model="bundleDescription"
                    label="Bundle Description"
                    variant="outlined"
                    density="compact"
                    rows="3"
                    class="mt-3"
                  ></v-textarea>

                  <v-text-field
                    v-model.number="bundleDiscount"
                    label="Bundle Discount %"
                    type="number"
                    variant="outlined"
                    density="compact"
                    suffix="%"
                    hint="Discount off individual prices"
                    class="mt-3"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card color="success" variant="tonal">
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Individual Prices Total</v-list-item-title>
                          <template v-slot:append>
                            <span class="font-weight-bold">${{ totalIndividualPrice.toFixed(2) }}</span>
                          </template>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Discount ({{ bundleDiscount }}%)</v-list-item-title>
                          <template v-slot:append>
                            <span class="text-error">-${{ discountAmount.toFixed(2) }}</span>
                          </template>
                        </v-list-item>
                        <v-divider class="my-2"></v-divider>
                        <v-list-item>
                          <v-list-item-title class="text-h6">Bundle Price</v-list-item-title>
                          <template v-slot:append>
                            <span class="text-h6 text-success font-weight-bold">${{ bundlePrice.toFixed(2) }}</span>
                          </template>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Customer Saves</v-list-item-title>
                          <template v-slot:append>
                            <v-chip color="success" size="small">
                              ${{ customerSavings.toFixed(2) }}
                            </v-chip>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>

                  <v-alert type="info" variant="tonal" class="mt-3">
                    <div class="text-caption">
                      <strong>Suggested retail price:</strong> ${{ suggestedRetailPrice.toFixed(2) }}
                    </div>
                    <div class="text-caption mt-1">
                      This maintains a {{ targetMargin }}% profit margin after fees
                    </div>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="bundleItems.length > 0">
        <v-col cols="12">
          <v-card variant="outlined" color="warning">
            <v-card-subtitle>Bundle Marketing Tips</v-card-subtitle>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-2 mb-2">Title Suggestions:</div>
                  <v-chip
                    v-for="(title, index) in titleSuggestions"
                    :key="index"
                    class="ma-1"
                    size="small"
                    variant="outlined"
                    @click="bundleName = title"
                  >
                    {{ title }}
                  </v-chip>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-2 mb-2">Marketing Highlights:</div>
                  <v-list density="compact">
                    <v-list-item v-for="highlight in marketingHighlights" :key="highlight">
                      <template v-slot:prepend>
                        <v-icon size="small" color="warning">mdi-star</v-icon>
                      </template>
                      <v-list-item-title class="text-body-2">{{ highlight }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="bundleItems.length > 0">
        <v-col cols="12" class="text-center">
          <v-btn color="primary" size="large" prepend-icon="mdi-check">
            Create Bundle Listing
          </v-btn>
          <v-btn variant="outlined" size="large" class="ml-2" @click="clearBundle">
            Clear Bundle
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Product {
  sku: string
  name: string
  size: string
  price: number
  icon: string
  color: string
}

interface BundleItem extends Product {
  quantity: number
}

const availableProducts: Product[] = [
  { sku: 'HAY-5LB', name: 'Happy Haystack Timothy Hay', size: '5 lb', price: 24.99, icon: 'mdi-barley', color: 'green' },
  { sku: 'HAY-10LB', name: 'Happy Haystack Timothy Hay', size: '10 lb', price: 44.99, icon: 'mdi-barley', color: 'green-darken-2' },
  { sku: 'HAY-25LB', name: 'Happy Haystack Timothy Hay', size: '25 lb', price: 99.99, icon: 'mdi-barley', color: 'green-darken-4' },
  { sku: 'PELLETS', name: 'Premium Guinea Pig Pellets', size: '5 lb', price: 19.99, icon: 'mdi-bowl', color: 'brown' },
  { sku: 'TREATS', name: 'Veggie Treats Mix', size: '1 lb', price: 12.99, icon: 'mdi-carrot', color: 'orange' },
  { sku: 'BEDDING', name: 'Paper Bedding', size: '60L', price: 29.99, icon: 'mdi-texture-box', color: 'blue' }
]

const bundleItems = ref<BundleItem[]>([])
const bundleName = ref('')
const bundleDescription = ref('')
const bundleDiscount = ref(10)
const targetMargin = ref(30)

function addToBundle(product: Product) {
  const existingItem = bundleItems.value.find(item => item.sku === product.sku)
  if (existingItem) {
    existingItem.quantity++
  } else {
    bundleItems.value.push({ ...product, quantity: 1 })
  }
}

function removeFromBundle(index: number) {
  bundleItems.value.splice(index, 1)
}

function increaseQuantity(index: number) {
  bundleItems.value[index].quantity++
}

function decreaseQuantity(index: number) {
  if (bundleItems.value[index].quantity > 1) {
    bundleItems.value[index].quantity--
  } else {
    removeFromBundle(index)
  }
}

function clearBundle() {
  bundleItems.value = []
  bundleName.value = ''
  bundleDescription.value = ''
}

const totalIndividualPrice = computed(() => {
  return bundleItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const discountAmount = computed(() => {
  return totalIndividualPrice.value * (bundleDiscount.value / 100)
})

const bundlePrice = computed(() => {
  return totalIndividualPrice.value - discountAmount.value
})

const customerSavings = computed(() => {
  return discountAmount.value
})

const suggestedRetailPrice = computed(() => {
  // Calculate suggested price based on target margin after Amazon fees (15% referral)
  const costs = bundlePrice.value
  const amazonFee = 0.15
  return costs / (1 - amazonFee - (targetMargin.value / 100))
})

const titleSuggestions = computed(() => {
  const suggestions = []

  if (bundleItems.value.length >= 3) {
    suggestions.push('Complete Guinea Pig Care Bundle')
    suggestions.push('Ultimate Pet Parent Starter Kit')
  }

  const hasHay = bundleItems.value.some(item => item.name.includes('Hay'))
  const hasPellets = bundleItems.value.some(item => item.name.includes('Pellets'))
  const hasTreats = bundleItems.value.some(item => item.name.includes('Treats'))

  if (hasHay && hasPellets) {
    suggestions.push('Premium Nutrition Bundle')
    suggestions.push('Monthly Supply Pack')
  }

  if (hasHay && hasTreats) {
    suggestions.push('Happy Guinea Pig Bundle')
    suggestions.push('Hay & Treats Combo Pack')
  }

  if (bundleItems.value.length === 2) {
    suggestions.push('Essential Duo Pack')
  }

  return suggestions
})

const marketingHighlights = computed(() => {
  const highlights = []

  const totalSavings = customerSavings.value
  if (totalSavings > 10) {
    highlights.push(`Save $${totalSavings.toFixed(2)} vs buying separately`)
  }

  const totalWeight = bundleItems.value.reduce((sum, item) => {
    const weight = parseInt(item.size) || 0
    return sum + (weight * item.quantity)
  }, 0)

  if (totalWeight >= 30) {
    highlights.push('Bulk savings - stock up and save')
  }

  if (bundleItems.value.length >= 3) {
    highlights.push('Complete care solution in one package')
  }

  highlights.push('Premium quality guaranteed')
  highlights.push('Perfect gift for guinea pig owners')

  return highlights
})
</script>
