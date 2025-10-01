<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Batch Pricing</v-card-title>
          <v-card-text>
            <v-file-input
              v-model="file"
              label="Upload CSV"
              accept=".csv"
              prepend-icon="mdi-file-delimited"
              @change="handleFileUpload"
            ></v-file-input>

            <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>

            <v-card v-if="summary" variant="outlined" class="mt-4">
              <v-card-title>Summary</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6" md="3">
                    <div class="text-h4">{{ summary.count }}</div>
                    <div class="text-caption">Total Shipments</div>
                  </v-col>
                  <v-col cols="6" md="3">
                    <div class="text-h4">${{ summary.totalPrice.toFixed(2) }}</div>
                    <div class="text-caption">Total Price</div>
                  </v-col>
                  <v-col cols="6" md="3">
                    <div class="text-h4">${{{ summary.avgPrice.toFixed(2) }}</div>
                    <div class="text-caption">Average Price</div>
                  </v-col>
                  <v-col cols="6" md="3" v-if="summary.avgError !== null">
                    <div class="text-h4">{{ summary.avgError.toFixed(1) }}%</div>
                    <div class="text-caption">Avg Error</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-data-table
              v-if="results.length > 0"
              :headers="headers"
              :items="results"
              class="mt-4"
              density="compact"
            >
              <template v-slot:item.quote_price="{ item }">
                ${{ item.quote_price.toFixed(2) }}
              </template>
              <template v-slot:item.diff_abs="{ item }">
                <span v-if="item.diff_abs !== null">
                  ${{ item.diff_abs.toFixed(2) }}
                </span>
              </template>
              <template v-slot:item.diff_pct="{ item }">
                <v-chip
                  v-if="item.diff_pct !== null"
                  :color="Math.abs(item.diff_pct) < 10 ? 'success' : 'warning'"
                  size="small"
                >
                  {{ item.diff_pct > 0 ? '+' : '' }}{{ item.diff_pct.toFixed(1) }}%
                </v-chip>
              </template>
            </v-data-table>

            <v-btn
              v-if="results.length > 0"
              color="primary"
              class="mt-4"
              @click="exportResults"
            >
              <v-icon start>mdi-download</v-icon>
              Export Results CSV
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Papa from 'papaparse'
import { useQuotesStore } from '@/stores/useQuotesStore'
import type { Shipment } from '@/types'

const quotesStore = useQuotesStore()

const file = ref<File[]>([])
const error = ref<string | null>(null)
const results = ref<any[]>([])
const summary = ref<{
  count: number
  totalPrice: number
  avgPrice: number
  avgError: number | null
} | null>(null)

const headers = [
  { title: 'Origin', key: 'origin_zone', sortable: true },
  { title: 'Destination', key: 'dest_zone', sortable: true },
  { title: 'Weight (lb)', key: 'weight_lb', sortable: true },
  { title: 'Service', key: 'service', sortable: true },
  { title: 'Quote', key: 'quote_price', sortable: true },
  { title: 'True Price', key: 'true_price', sortable: true },
  { title: 'Diff ($)', key: 'diff_abs', sortable: true },
  { title: 'Diff (%)', key: 'diff_pct', sortable: true }
]

function handleFileUpload() {
  error.value = null
  results.value = []
  summary.value = null

  if (!file.value || file.value.length === 0) return

  const csvFile = file.value[0]

  Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true,
    complete: (parseResult) => {
      try {
        const shipments: Shipment[] = parseResult.data.map((row: any) => ({
          origin_zone: row.origin_zone || row.Origin || row.origin,
          dest_zone: row.dest_zone || row.Destination || row.dest,
          length_in: parseFloat(row.length_in || row.length || 12),
          width_in: parseFloat(row.width_in || row.width || 10),
          height_in: parseFloat(row.height_in || row.height || 8),
          weight_lb: parseFloat(row.weight_lb || row.weight || 5),
          service: (row.service || 'standard').toLowerCase() as 'standard' | 'expedited',
          declared_value: parseFloat(row.declared_value || row.value || 100),
          residential: row.residential === 'true' || row.residential === '1'
        }))

        const quotes = quotesStore.calculateBatch(shipments)

        results.value = quotes.map((quote, idx) => {
          const row = parseResult.data[idx] as any
          const truePrice = row.true_price ? parseFloat(row.true_price) : null

          let diff_abs = null
          let diff_pct = null

          if (truePrice !== null) {
            diff_abs = quote.total - truePrice
            diff_pct = (diff_abs / truePrice) * 100
          }

          return {
            ...quote.shipment,
            quote_price: quote.total,
            true_price: truePrice,
            diff_abs,
            diff_pct
          }
        })

        // Calculate summary
        const totalPrice = results.value.reduce((sum, r) => sum + r.quote_price, 0)
        const avgPrice = totalPrice / results.value.length

        const errors = results.value.filter(r => r.diff_pct !== null).map(r => Math.abs(r.diff_pct))
        const avgError = errors.length > 0
          ? errors.reduce((sum, e) => sum + e, 0) / errors.length
          : null

        summary.value = {
          count: results.value.length,
          totalPrice,
          avgPrice,
          avgError
        }

      } catch (e) {
        error.value = `Failed to process CSV: ${e}`
        console.error(e)
      }
    },
    error: (err) => {
      error.value = `Failed to parse CSV: ${err.message}`
    }
  })
}

function exportResults() {
  const csv = Papa.unparse(results.value)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `batch-results-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
