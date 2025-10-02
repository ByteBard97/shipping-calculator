<template>
  <v-card class="pa-3">
    <div class="d-flex justify-space-between align-center mb-2">
      <div class="text-subtitle-1">Queue & Processing Reports</div>
      <v-btn size="small" variant="tonal" @click="$emit('refresh')">
        Refresh
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="rows"
      item-key="id"
      density="compact"
      :items-per-page="5"
      class="elevated"
      expand-on-click
      show-expand
    >
      <template #item.status="{ item }">
        <v-chip size="small" :color="statusColor(item.status)" variant="flat">{{ item.status }}</v-chip>
      </template>

      <template #item.errors="{ item }">
        <span v-if="item.errors?.length">{{ item.errors.length }}</span>
        <span v-else>—</span>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="bg-grey-lighten-4">
            <div v-if="item.errors?.length" class="pa-3">
              <div class="text-caption text-uppercase mb-2">Errors</div>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Row</th><th>Field</th><th>Message</th><th>Suggested Fix</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(e, i) in item.errors" :key="i">
                    <td>{{ e.row }}</td>
                    <td><code>{{ e.field }}</code></td>
                    <td>{{ e.message }}</td>
                    <td class="opacity-80">{{ e.suggestedFix || '—' }}</td>
                  </tr>
                </tbody>
              </v-table>
              <div class="mt-2 d-flex ga-2">
                <v-btn size="x-small" @click="$emit('openRow', item)">Open in Importer</v-btn>
                <v-btn size="x-small" variant="text" @click="$emit('resubmit', item)" :disabled="item.status==='processing'">Resubmit</v-btn>
              </div>
            </div>
            <div v-else class="pa-3 opacity-70">No errors for this job.</div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type JobStatus = 'accepted' | 'processing' | 'succeeded' | 'failed'
type ErrorRow = { row: number; field: string; message: string; suggestedFix?: string }
type JobRow = {
  id: string
  createdAt: string
  type: 'JSON_LISTINGS_FEED' | 'LISTINGS_ITEM' | 'PRICE_UPDATE'
  status: JobStatus
  target: 'Sandbox' | 'Production'
  skuCount: number
  errors?: ErrorRow[]
}

defineEmits<{
  refresh: []
  openRow: [item: JobRow]
  resubmit: [item: JobRow]
}>()

const headers = [
  { title: 'Job ID', key: 'id' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Type', key: 'type' },
  { title: 'Target', key: 'target' },
  { title: 'SKUs', key: 'skuCount', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: 'Errors', key: 'errors', align: 'end' as const }
]

// Mock rows; replace with your store data later.
const rows = ref<JobRow[]>([
  {
    id: 'feed_9F2C',
    createdAt: new Date().toLocaleString(),
    type: 'JSON_LISTINGS_FEED',
    target: 'Sandbox',
    status: 'failed',
    skuCount: 4,
    errors: [
      { row: 2, field: 'attributes.size_name', message: 'Invalid enum value "5 lbs"', suggestedFix: 'Use "5 lb"' },
      { row: 3, field: 'attributes.item_package_quantity', message: 'Required value missing', suggestedFix: 'Set to 1 or 3' }
    ]
  },
  {
    id: 'feed_9F2D',
    createdAt: new Date().toLocaleString(),
    type: 'LISTINGS_ITEM',
    target: 'Sandbox',
    status: 'succeeded',
    skuCount: 1
  },
  {
    id: 'feed_9F2E',
    createdAt: new Date().toLocaleString(),
    type: 'PRICE_UPDATE',
    target: 'Sandbox',
    status: 'processing',
    skuCount: 5
  }
])

function statusColor(s: JobStatus) {
  if (s === 'succeeded') return 'green'
  if (s === 'processing') return 'blue'
  if (s === 'accepted') return 'grey'
  return 'red'
}
</script>
