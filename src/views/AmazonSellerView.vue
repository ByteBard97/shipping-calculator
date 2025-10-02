<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-amazon</v-icon>
            Amazon Seller Portal Manager
            <v-spacer></v-spacer>
            <v-btn variant="text" prepend-icon="mdi-chart-timeline-variant" @click="$router.push('/amazon-flow-demo')" class="mr-2">
              How It Works
            </v-btn>
            <v-btn color="primary" prepend-icon="mdi-home" @click="$router.push('/')">
              Back to Home
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-alert type="warning" variant="tonal" closable>
              <strong>Prototype:</strong> This is a proof-of-concept interface. Real Amazon SP-API integration requires developer credentials and can be tested in sandbox mode first.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-tabs v-model="tab" color="primary">
          <v-tab value="products">Products</v-tab>
          <v-tab value="variations">Variation Builder</v-tab>
          <v-tab value="import">CSV Import</v-tab>
          <v-tab value="analytics">Analytics & Tools</v-tab>
          <v-tab value="aplus">A+ Content</v-tab>
          <v-tab value="store">Store Manager</v-tab>
        </v-tabs>

        <v-card class="mt-4">
          <v-window v-model="tab">
            <!-- Products Tab -->
            <v-window-item value="products">
              <v-card-text>
                <div class="d-flex align-center mb-4">
                  <v-text-field
                    v-model="search"
                    prepend-inner-icon="mdi-magnify"
                    label="Search products"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mr-4"
                  ></v-text-field>
                  <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddProductDialog">
                    Add Product
                  </v-btn>
                </div>

                <v-data-table
                  :headers="productHeaders"
                  :items="products"
                  :search="search"
                  item-value="sku"
                >
                  <template v-slot:item.image="{ item }">
                    <v-avatar size="60" rounded="0">
                      <v-img :src="item.image" :alt="item.title" cover></v-img>
                    </v-avatar>
                  </template>
                  <template v-slot:item.status="{ item }">
                    <v-chip :color="item.status === 'active' ? 'success' : 'warning'" size="small">
                      {{ item.status }}
                    </v-chip>
                  </template>
                  <template v-slot:item.actions>
                    <v-btn icon size="small" variant="text">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon size="small" variant="text">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-window-item>

            <!-- Variation Builder Tab -->
            <v-window-item value="variations">
              <v-card-text>
                <v-card variant="outlined" class="mb-4">
                  <v-card-title>Create Product Family</v-card-title>
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="variationFamily.parentSku"
                          label="Parent SKU"
                          variant="outlined"
                          hint="Non-buyable parent product"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="variationFamily.theme"
                          label="Variation Theme"
                          :items="variationThemes"
                          variant="outlined"
                        ></v-select>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="variationFamily.title"
                          label="Product Title"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-textarea
                          v-model="variationFamily.description"
                          label="Description"
                          variant="outlined"
                          rows="3"
                        ></v-textarea>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>

                <v-card variant="outlined">
                  <v-card-title class="d-flex align-center">
                    Child Products (Variations)
                    <v-spacer></v-spacer>
                    <v-btn color="primary" size="small" prepend-icon="mdi-plus">
                      Add Variation
                    </v-btn>
                  </v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="variationHeaders"
                      :items="variationFamily.children"
                      item-value="sku"
                    >
                      <template v-slot:item.actions>
                        <v-btn icon size="small" variant="text">
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn icon size="small" variant="text">
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </template>
                    </v-data-table>

                    <v-btn color="success" class="mt-4" prepend-icon="mdi-cloud-upload">
                      Publish to Amazon
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-window-item>

            <!-- CSV Import Tab -->
            <v-window-item value="import">
              <v-card-text>
                <v-alert type="info" variant="tonal" class="mb-4">
                  <div class="font-weight-bold">Required CSV Columns:</div>
                  sku, parent_sku, title, brand, bullet1, bullet2, description, size_name, item_package_quantity, price, quantity, image_url_1
                </v-alert>

                <v-file-input
                  v-model="csvFile"
                  label="Upload Product CSV"
                  variant="outlined"
                  accept=".csv"
                  prepend-icon="mdi-file-delimited"
                  @change="handleFileUpload"
                ></v-file-input>

                <v-card v-if="importPreview.length > 0" variant="outlined" class="mt-4">
                  <v-card-title>Preview (First 5 rows)</v-card-title>
                  <v-card-text>
                    <v-data-table
                      :headers="importHeaders"
                      :items="importPreview"
                      :items-per-page="5"
                      density="compact"
                    ></v-data-table>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="success" prepend-icon="mdi-check">
                      Validate & Import
                    </v-btn>
                  </v-card-actions>
                </v-card>

                <v-card v-if="importResults.length > 0" variant="outlined" class="mt-4">
                  <v-card-title>Import Results</v-card-title>
                  <v-card-text>
                    <v-list>
                      <v-list-item v-for="result in importResults" :key="result.id">
                        <template v-slot:prepend>
                          <v-icon :color="result.success ? 'success' : 'error'">
                            {{ result.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                          </v-icon>
                        </template>
                        <v-list-item-title>{{ result.message }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-window-item>

            <!-- Analytics & Tools Tab -->
            <v-window-item value="analytics">
              <v-card-text>
                <v-expansion-panels variant="accordion" multiple>
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">mdi-calculator-variant</v-icon>
                      Profit Margin Calculator
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <ProfitMarginCalculator />
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">mdi-chart-line</v-icon>
                      Competitor Price Tracker
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <CompetitorPriceTracker />
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">mdi-calendar-star</v-icon>
                      Seasonal Pricing Suggestions
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <SeasonalPricingSuggestions />
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">mdi-package-variant-closed</v-icon>
                      Bundle Product Creator
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <BundleProductCreator />
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">mdi-chart-timeline-variant</v-icon>
                      Inventory Forecast
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <InventoryForecastCalculator />
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-window-item>

            <!-- A+ Content Tab -->
            <v-window-item value="aplus">
              <v-card-text>
                <v-alert type="warning" variant="tonal" class="mb-4">
                  A+ Content requires Brand Registry. This is a preview/builder - actual publishing requires API credentials.
                </v-alert>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined">
                      <v-card-title>Brand Story</v-card-title>
                      <v-card-text>
                        <v-textarea
                          v-model="aplusContent.brandStory"
                          label="Brand Story Text"
                          variant="outlined"
                          rows="4"
                        ></v-textarea>
                        <v-file-input
                          label="Brand Logo"
                          variant="outlined"
                          accept="image/*"
                          density="compact"
                        ></v-file-input>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined">
                      <v-card-title>Product Highlights</v-card-title>
                      <v-card-text>
                        <v-textarea
                          v-model="aplusContent.highlight1"
                          label="Highlight 1"
                          variant="outlined"
                          rows="2"
                        ></v-textarea>
                        <v-textarea
                          v-model="aplusContent.highlight2"
                          label="Highlight 2"
                          variant="outlined"
                          rows="2"
                        ></v-textarea>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12">
                    <v-btn color="primary" prepend-icon="mdi-eye">
                      Preview A+ Content
                    </v-btn>
                    <v-btn color="success" class="ml-2" prepend-icon="mdi-publish">
                      Publish (requires API)
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>

            <!-- Store Manager Tab -->
            <v-window-item value="store">
              <v-card-text>
                <v-alert type="info" variant="tonal" class="mb-4">
                  Store management requires Amazon Ads API access. This builder helps you organize what to feature.
                </v-alert>

                <v-card variant="outlined" class="mb-4">
                  <v-card-title>Featured Products</v-card-title>
                  <v-card-text>
                    <v-select
                      v-model="storeManager.featured"
                      :items="products"
                      item-title="title"
                      item-value="sku"
                      label="Select Featured Products"
                      variant="outlined"
                      multiple
                      chips
                    ></v-select>
                  </v-card-text>
                </v-card>

                <v-card variant="outlined" class="mb-4">
                  <v-card-title>Store Sections</v-card-title>
                  <v-card-text>
                    <v-list>
                      <v-list-item v-for="(section, idx) in storeManager.sections" :key="idx">
                        <template v-slot:prepend>
                          <v-icon>mdi-view-grid</v-icon>
                        </template>
                        <v-list-item-title>{{ section.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ section.products.length }} products</v-list-item-subtitle>
                        <template v-slot:append>
                          <v-btn icon size="small" variant="text">
                            <v-icon>mdi-pencil</v-icon>
                          </v-btn>
                        </template>
                      </v-list-item>
                    </v-list>
                    <v-btn color="primary" size="small" prepend-icon="mdi-plus" class="mt-2">
                      Add Section
                    </v-btn>
                  </v-card-text>
                </v-card>

                <v-btn color="success" prepend-icon="mdi-export">
                  Export Store Plan (JSON)
                </v-btn>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Product Dialog -->
    <v-dialog v-model="addProductDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-package-variant-plus</v-icon>
          Add New Product
        </v-card-title>
        <v-card-text>
          <v-form ref="productForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newProduct.sku"
                  label="SKU *"
                  variant="outlined"
                  hint="Unique product identifier"
                  persistent-hint
                  :rules="[(v: any) => !!v || 'SKU is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newProduct.brand"
                  label="Brand *"
                  variant="outlined"
                  :rules="[(v: any) => !!v || 'Brand is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="newProduct.title"
                  label="Product Title *"
                  variant="outlined"
                  hint="e.g., Happy Haystack - Premium Timothy Hay 5lb"
                  persistent-hint
                  :rules="[(v: any) => !!v || 'Title is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="newProduct.price"
                  label="Price *"
                  variant="outlined"
                  type="number"
                  step="0.01"
                  prefix="$"
                  :rules="[(v: any) => v > 0 || 'Price must be greater than 0']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="newProduct.quantity"
                  label="Quantity *"
                  variant="outlined"
                  type="number"
                  hint="Available inventory"
                  persistent-hint
                  :rules="[(v: any) => v >= 0 || 'Quantity must be 0 or greater']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newProduct.asin"
                  label="ASIN"
                  variant="outlined"
                  hint="Leave blank for new product"
                  persistent-hint
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="newProduct.status"
                  label="Status *"
                  :items="['active', 'pending', 'inactive']"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="newProduct.image"
                  label="Image URL"
                  variant="outlined"
                  hint="URL to product image"
                  persistent-hint
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeAddProductDialog">Cancel</v-btn>
          <v-btn color="primary" @click="addProduct">Add Product</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import hayProductImage from '/hay-product.webp'
import hayHavenProductImage from '/hay-haven-product.webp'
import ProfitMarginCalculator from '@/components/ProfitMarginCalculator.vue'
import CompetitorPriceTracker from '@/components/CompetitorPriceTracker.vue'
import SeasonalPricingSuggestions from '@/components/SeasonalPricingSuggestions.vue'
import BundleProductCreator from '@/components/BundleProductCreator.vue'
import InventoryForecastCalculator from '@/components/InventoryForecastCalculator.vue'

const tab = ref('products')
const search = ref('')
const csvFile = ref<File[]>([])
const addProductDialog = ref(false)
const productForm = ref(null)

const newProduct = ref({
  sku: '',
  title: '',
  brand: '',
  price: 0,
  quantity: 0,
  status: 'pending',
  asin: '',
  image: hayProductImage
})

// Sample data for demo
const products = ref([
  { sku: 'HAY-5LB-001', title: 'Happy Haystack - Premium Timothy Hay 5lb', brand: 'Happy Haystack', price: 24.99, quantity: 100, status: 'active', asin: 'B01234567', image: hayProductImage },
  { sku: 'HAY-10LB-001', title: 'Happy Haystack - Premium Timothy Hay 10lb', brand: 'Happy Haystack', price: 44.99, quantity: 75, status: 'active', asin: 'B01234568', image: hayProductImage },
  { sku: 'HAY-5LB-3PK', title: 'Happy Haystack - 5lb (3-Pack)', brand: 'Happy Haystack', price: 69.99, quantity: 50, status: 'pending', asin: '', image: hayProductImage },
  { sku: 'HAY-HAVEN-5LB', title: 'Hay Haven - Premium Quality Hay 5lb', brand: 'Hay Haven', price: 22.99, quantity: 80, status: 'active', asin: 'B01234569', image: hayHavenProductImage },
])

const productHeaders = [
  { title: 'Image', key: 'image', sortable: false },
  { title: 'SKU', key: 'sku' },
  { title: 'Title', key: 'title' },
  { title: 'Brand', key: 'brand' },
  { title: 'Price', key: 'price' },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Status', key: 'status' },
  { title: 'ASIN', key: 'asin' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const variationFamily = ref({
  parentSku: '',
  theme: 'Size',
  title: '',
  description: '',
  children: [
    { sku: 'HAY-5LB-001', sizeName: '5 lb', itemPackageQuantity: 1, price: 24.99, quantity: 100 },
    { sku: 'HAY-10LB-001', sizeName: '10 lb', itemPackageQuantity: 1, price: 44.99, quantity: 75 },
  ]
})

const variationThemes = [
  'Size',
  'Size-ItemPackageQuantity',
  'Color',
  'Flavor'
]

const variationHeaders = [
  { title: 'SKU', key: 'sku' },
  { title: 'Size', key: 'sizeName' },
  { title: 'Package Qty', key: 'itemPackageQuantity' },
  { title: 'Price', key: 'price' },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const importPreview = ref<any[]>([])
const importHeaders = ref<any[]>([])
const importResults = ref<any[]>([])

const aplusContent = ref({
  brandStory: 'Premium quality guinea pig hay, hand-selected for optimal nutrition.',
  highlight1: 'Rich in fiber for healthy digestion',
  highlight2: 'Dust-free and fresh',
})

const storeManager = ref({
  featured: ['HAY-5LB-001', 'HAY-10LB-001'],
  sections: [
    { name: 'Best Sellers', products: ['HAY-5LB-001'] },
    { name: 'Bulk Options', products: ['HAY-10LB-001', 'HAY-5LB-3PK'] },
  ]
})

function handleFileUpload() {
  // TODO: Parse CSV and populate importPreview
  console.log('File uploaded:', csvFile.value)
}

function openAddProductDialog() {
  addProductDialog.value = true
}

function closeAddProductDialog() {
  addProductDialog.value = false
  resetNewProduct()
}

function resetNewProduct() {
  newProduct.value = {
    sku: '',
    title: '',
    brand: '',
    price: 0,
    quantity: 0,
    status: 'pending',
    asin: '',
    image: hayProductImage
  }
}

function addProduct() {
  if (!newProduct.value.sku || !newProduct.value.title || !newProduct.value.brand || newProduct.value.price <= 0) {
    return
  }

  products.value.push({
    sku: newProduct.value.sku,
    title: newProduct.value.title,
    brand: newProduct.value.brand,
    price: newProduct.value.price,
    quantity: newProduct.value.quantity,
    status: newProduct.value.status,
    asin: newProduct.value.asin,
    image: newProduct.value.image || hayProductImage
  })

  closeAddProductDialog()
}
</script>
