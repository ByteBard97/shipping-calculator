<template>
  <v-container class="py-6" fluid>
    <MetricsStrip :metrics="{ publishesToday: 12, successRate: 0.86, avgProcessingMs: 7400 }" class="mb-4" />

    <v-row>
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center mb-3">
            <div class="text-h6">Amazon Listing Assistant — Flow</div>
            <div class="d-flex align-center ga-3">
              <v-switch
                v-model="isProd"
                inset
                hide-details
                :label="isProd ? 'Production' : 'Sandbox'"
              />
              <v-btn size="small" @click="simulateRun" :loading="isSimulating" :disabled="isSimulating">
                {{ isSimulating ? 'Running...' : 'Simulate Publish' }}
              </v-btn>
            </div>
          </div>

          <div ref="mermaidDiv" class="mermaid-diagram"></div>
        </v-card>
      </v-col>

      <!-- Right panel -->
      <v-col cols="12" md="4">
        <v-card class="pa-4 h-100">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-h6">{{ selectedNode.title }}</div>
            <v-chip size="small" :color="stateColor(selectedNode.state)" variant="flat">{{ selectedNode.state }}</v-chip>
          </div>
          <div class="text-body-2 mb-4">{{ selectedNode.description }}</div>

          <v-divider class="my-3" />

          <div class="text-caption text-uppercase mb-1">What this step does</div>
          <ul class="text-body-2 mb-4 pl-4">
            <li v-for="(p, i) in selectedNode.points" :key="i">{{ p }}</li>
          </ul>

          <v-divider class="my-3" />

          <div class="text-caption text-uppercase mb-1">API touchpoints</div>
          <v-list density="compact">
            <v-list-item v-for="(api, i) in selectedNode.apis" :key="i">
              <v-list-item-title>{{ api.name }}</v-list-item-title>
              <v-list-item-subtitle class="opacity-70">{{ api.path }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-3" />
          <QueueMini
            v-if="selectedId === 'queue'"
            @refresh="() => {}"
            @openRow="() => {}"
            @resubmit="() => {}"
          />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import mermaid from 'mermaid'
import MetricsStrip from '@/components/MetricsStrip.vue'
import QueueMini from '@/components/QueueMini.vue'

const isProd = ref(false)
const isSimulating = ref(false)
const selectedId = ref('ingest')
const mermaidDiv = ref<HTMLElement | null>(null)

const nodes = {
  ingest: {
    title: 'CSV / JSON Import',
    description: 'Upload a CSV/JSON (one row per child SKU). Map columns to Amazon attributes.',
    points: ['SKU generator & uniqueness checks', 'Column mapping presets per product type', 'Inline validation with AJV'],
    apis: [{ name: '—', path: 'Local only' }],
    state: 'idle'
  },
  schema: {
    title: 'Product Type Schema',
    description: "Fetch Amazon's Product Type Definitions (PTD) for the chosen category and marketplace.",
    points: ['Show required/optional attributes', 'Surface allowed variation themes', 'Auto-build forms from JSON schema'],
    apis: [{ name: 'Definitions', path: 'GET /definitions/2020-09-01/productTypes/{productType}' }],
    state: 'idle'
  },
  validate: {
    title: 'Validate',
    description: 'Validate rows locally against the PTD: required fields, enums, image specs.',
    points: ['Highlight errors by row/field', 'Suggest quick fixes', 'Block invalid publishes'],
    apis: [{ name: '—', path: 'Local AJV validation' }],
    state: 'idle'
  },
  variation: {
    title: 'Variation Builder',
    description: 'Pick a valid variation theme (e.g., Size + ItemPackageQuantity). Auto-create parent + N children.',
    points: ['Non-buyable parent', 'Diff view across children', 'Auto-propagate shared fields'],
    apis: [{ name: '—', path: 'Local composition' }],
    state: 'idle'
  },
  publish: {
    title: 'Publish to Amazon',
    description: 'Submit a JSON listings feed (bulk) or call Listings Items per SKU.',
    points: ['Queue with retries/backoff', 'Store feedId/operation logs', 'Flip Sandbox ↔ Prod endpoints'],
    apis: [
      { name: 'Feeds', path: 'POST /feeds/2021-06-30/feeds' },
      { name: 'Listings Items', path: 'PUT /listings/2021-08-01/items/{sellerId}/{sku}' }
    ],
    state: 'idle'
  },
  queue: {
    title: 'Queue & Status',
    description: 'Poll feed and render detailed processing reports; link errors back to fields.',
    points: ['Parse Amazon messages', 'Clickable row → field jump', 'One-click resubmit after fix'],
    apis: [
      { name: 'Feeds Status', path: 'GET /feeds/2021-06-30/feeds/{feedId}' },
      { name: 'Documents', path: 'GET /feeds/2021-06-30/documents/{docId}' }
    ],
    state: 'idle'
  },
  amazon: {
    title: 'Amazon Result',
    description: 'Where listings land. For Store/A+ you may need Brand Registry / Ads API.',
    points: ['Catalog Items for visibility checks', 'Stores via Ads API (optional)', 'A+ Content (brand required)'],
    apis: [
      { name: 'Catalog Items', path: 'GET /catalog/2022-04-01/items' },
      { name: 'A+ Content', path: 'POST /aplus/2020-11-01/contentDocuments' }
    ],
    state: 'idle'
  }
}

const selectedNode = ref(nodes.ingest)

function stateColor(s: string) {
  if (s === 'done') return 'green'
  if (s === 'in-progress') return 'blue'
  if (s === 'error') return 'red'
  return 'grey'
}

async function simulateRun() {
  if (isSimulating.value) return
  isSimulating.value = true
  const order: (keyof typeof nodes)[] = ['ingest', 'schema', 'validate', 'variation', 'publish', 'queue', 'amazon']
  for (const id of order) {
    nodes[id].state = 'in-progress'
    selectedId.value = id
    selectedNode.value = nodes[id]
    await wait(600)
    if (id === 'publish' && Math.random() < 0.15) {
      nodes[id].state = 'error'
      isSimulating.value = false
      return
    }
    nodes[id].state = 'done'
    await wait(150)
  }
  isSimulating.value = false
}

function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

onMounted(() => {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    flowchart: {
      curve: 'basis',
      padding: 20
    }
  })
  renderDiagram()
})

watch(isProd, () => {
  renderDiagram()
})

async function renderDiagram() {
  const diagram = `
graph TB
    subgraph old[" "]
        direction TB
        oldTitle["😫 SELLER CENTRAL WAY (Manual Hell)"]
        O1[Login to Seller Central] --> O2[Find Add Product page]
        O2 --> O3[Fill 50+ fields manually]
        O3 --> O4[Repeat for EACH variation]
        O4 --> O5[Submit & pray]
        O5 --> O6[Get cryptic error 8027]
        O6 --> O7[Google the error code]
        O7 --> O8[Fix ONE field]
        O8 --> O3
        O9["😭 2 hours per product"]
    end

    subgraph new[" "]
        direction TB
        newTitle["😊 OUR TOOL WAY (Easy Mode)"]
        N1[📁 Drop CSV with all products] --> N2[✅ Auto-validate against Amazon]
        N2 --> N3[🔧 Fix any errors with hints]
        N3 --> N4[🚀 One-click publish ALL]
        N4 --> N5[✨ Live on Amazon]
        N6["⚡ 5 minutes for 20 products"]
    end

    old -.Old way: SLOW.-> new

    style old fill:#ffebee,stroke:#c62828,stroke-width:3px
    style new fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px
    style oldTitle fill:#ffcdd2,stroke:none,color:#000
    style newTitle fill:#c8e6c9,stroke:none,color:#000
    style O9 fill:#ff5252,color:#fff
    style N6 fill:#4caf50,color:#fff
  `

  const { svg } = await mermaid.render('mermaid-diagram', diagram)
  if (mermaidDiv.value) {
    mermaidDiv.value.innerHTML = svg
  }
}
</script>

<style scoped>
.mermaid-diagram {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
