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

          <!-- Diagram canvas -->
          <div ref="canvasRef" class="diagram-canvas" style="min-height: 600px;">
            <!-- SVG connectors -->
            <svg class="edges">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z"></path>
                </marker>
              </defs>
              <g v-for="edge in edges" :key="edge.from + edge.to">
                <line
                  :x1="nodeById(edge.from).x + nodeW/2"
                  :y1="nodeById(edge.from).y + nodeH/2"
                  :x2="nodeById(edge.to).x + nodeW/2"
                  :y2="nodeById(edge.to).y + nodeH/2"
                  class="edge"
                  :class="{'edge-active': activeEdge(edge)}"
                  marker-end="url(#arrow)"
                />
              </g>
            </svg>

            <!-- Node cards -->
            <template v-for="n in nodes" :key="n.id">
              <div
                class="node-card"
                :style="nodeStyle(n)"
                @click="selectNode(n.id)"
              >
                <v-card
                  :elevation="selectedId === n.id ? 8 : 3"
                  class="pa-3 d-flex flex-column align-center text-center h-100"
                  :class="[
                    'transition-fast',
                    nodeStateClass(n.state)
                  ]"
                >
                  <div class="text-subtitle-2">{{ n.kicker }}</div>
                  <div class="text-body-1 font-weight-medium">{{ n.title }}</div>
                  <div class="text-caption mt-1 opacity-70">{{ n.subtitle }}</div>

                  <div class="mt-3">
                    <v-chip size="x-small" :color="isProd ? 'red-darken-1' : 'green-darken-1'" variant="elevated">
                      {{ isProd ? 'Prod endpoint' : 'Sandbox endpoint' }}
                    </v-chip>
                  </div>
                </v-card>
              </div>
            </template>
          </div>
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
          <div class="d-flex ga-2">
            <v-btn size="small" variant="tonal" @click="markDone">Mark Done</v-btn>
            <v-btn size="small" variant="text" @click="resetStates">Reset</v-btn>
          </div>

          <v-divider class="my-3" />
          <QueueMini
            v-if="selectedId === 'queue'"
            @refresh="onRefreshQueue"
            @openRow="onOpenErrorRow"
            @resubmit="onResubmitJob"
          />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MetricsStrip from '@/components/MetricsStrip.vue'
import QueueMini from '@/components/QueueMini.vue'

type Edge = { from: string; to: string }

const nodeW = 180
const nodeH = 140
const gap = 100
const startX = 60
const startY = 40

// Create a flowing S-curve layout
const positions = [
  { x: startX, y: startY },                           // CSV/JSON
  { x: startX + nodeW + gap, y: startY },            // Schema
  { x: startX + (nodeW + gap) * 2, y: startY },      // Validate
  { x: startX + (nodeW + gap) * 2, y: startY + nodeH + gap }, // Variation (drop down)
  { x: startX + nodeW + gap, y: startY + nodeH + gap },       // Publish (back left)
  { x: startX, y: startY + nodeH + gap },                      // Queue (further left)
  { x: startX, y: startY + (nodeH + gap) * 2 }                // Amazon (drop down)
]

const isProd = ref(false)
const isSimulating = ref(false)
const selectedId = ref('ingest')

const nodes = ref([
  {
    id: 'ingest',
    title: 'CSV / JSON',
    kicker: '1. Import',
    subtitle: 'Your product data',
    description: 'Upload a CSV/JSON (one row per child SKU). Map columns to Amazon attributes.',
    points: [
      'SKU generator & uniqueness checks',
      'Column mapping presets per product type',
      'Inline validation with AJV'
    ],
    apis: [{ name: '—', path: 'Local only' }],
    x: positions[0].x, y: positions[0].y, state: 'idle'
  },
  {
    id: 'schema',
    title: 'Product Type Schema',
    kicker: '2. Fetch',
    subtitle: 'PTD (live) per marketplace',
    description: "Fetch Amazon's Product Type Definitions (PTD) for the chosen category and marketplace.",
    points: [
      'Show required/optional attributes',
      'Surface allowed variation themes',
      'Auto-build forms from JSON schema'
    ],
    apis: [{ name: 'Definitions', path: 'GET /definitions/2020-09-01/productTypes/{productType}' }],
    x: positions[1].x, y: positions[1].y, state: 'idle'
  },
  {
    id: 'validate',
    title: 'Validate',
    kicker: '3. Pre-flight',
    subtitle: 'Catch errors early',
    description: 'Validate rows locally against the PTD: required fields, enums, image specs.',
    points: [
      'Highlight errors by row/field',
      'Suggest quick fixes',
      'Block invalid publishes'
    ],
    apis: [{ name: '—', path: 'Local AJV validation' }],
    x: positions[2].x, y: positions[2].y, state: 'idle'
  },
  {
    id: 'variation',
    title: 'Variation Builder',
    kicker: '4. Build',
    subtitle: 'Size + Pack themes',
    description: 'Pick a valid variation theme (e.g., Size + ItemPackageQuantity). Auto-create parent + N children.',
    points: [
      'Non-buyable parent',
      'Diff view across children',
      'Auto-propagate shared fields'
    ],
    apis: [{ name: '—', path: 'Local composition' }],
    x: positions[3].x, y: positions[3].y, state: 'idle'
  },
  {
    id: 'publish',
    title: 'Publish',
    kicker: '5. SP-API',
    subtitle: 'Feeds or per-item',
    description: 'Submit a JSON listings feed (bulk) or call Listings Items per SKU.',
    points: [
      'Queue with retries/backoff',
      'Store feedId/operation logs',
      'Flip Sandbox ↔ Prod endpoints'
    ],
    apis: [
      { name: 'Feeds', path: 'POST /feeds/2021-06-30/feeds' },
      { name: 'Listings Items', path: 'PUT /listings/2021-08-01/items/{sellerId}/{sku}' }
    ],
    x: positions[4].x, y: positions[4].y, state: 'idle'
  },
  {
    id: 'queue',
    title: 'Queue & Status',
    kicker: '6. Monitor',
    subtitle: 'Processing reports',
    description: 'Poll feed and render detailed processing reports; link errors back to fields.',
    points: [
      'Parse Amazon messages',
      'Clickable row → field jump',
      'One-click resubmit after fix'
    ],
    apis: [
      { name: 'Feeds Status', path: 'GET /feeds/2021-06-30/feeds/{feedId}' },
      { name: 'Documents', path: 'GET /feeds/2021-06-30/documents/{docId}' }
    ],
    x: positions[5].x, y: positions[5].y, state: 'idle'
  },
  {
    id: 'amazon',
    title: 'Amazon',
    kicker: '7. Result',
    subtitle: 'Sandbox or Production',
    description: 'Where listings land. For Store/A+ you may need Brand Registry / Ads API.',
    points: [
      'Catalog Items for visibility checks',
      'Stores via Ads API (optional)',
      'A+ Content (brand required)'
    ],
    apis: [
      { name: 'Catalog Items', path: 'GET /catalog/2022-04-01/items' },
      { name: 'A+ Content', path: 'POST /aplus/2020-11-01/contentDocuments' }
    ],
    x: positions[6].x, y: positions[6].y, state: 'idle'
  }
])

const edges = ref([
  { from: 'ingest', to: 'schema' },
  { from: 'schema', to: 'validate' },
  { from: 'validate', to: 'variation' },
  { from: 'variation', to: 'publish' },
  { from: 'publish', to: 'queue' },
  { from: 'queue', to: 'amazon' }
])

const canvasRef = ref(null)

const selectedNode = computed(() => nodeById(selectedId.value))

function nodeById(id: string) {
  return nodes.value.find(n => n.id === id)!;
}
function selectNode(id: string) {
  selectedId.value = id
}

function nodeStyle(n: any) {
  return {
    left: n.x + 'px',
    top: n.y + 'px',
    width: nodeW + 'px',
    height: nodeH + 'px'
  }
}

function nodeStateClass(s: string) {
  return {
    'state-idle': s === 'idle',
    'state-progress': s === 'in-progress',
    'state-done': s === 'done',
    'state-error': s === 'error'
  }
}

function stateColor(s: string) {
  switch (s) {
    case 'done': return 'green'
    case 'in-progress': return 'blue'
    case 'error': return 'red'
    default: return 'grey'
  }
}

function resetStates() {
  nodes.value.forEach(n => n.state = 'idle')
}

function markDone() {
  nodeById(selectedId.value).state = 'done'
}

function activeEdge(e: Edge) {
  const from = nodeById(e.from).state
  const to = nodeById(e.to).state
  return (from === 'done' || from === 'in-progress') && (to === 'in-progress' || to === 'done')
}

async function simulateRun() {
  if (isSimulating.value) return
  isSimulating.value = true
  resetStates()
  const order = ['ingest','schema','validate','variation','publish','queue','amazon']
  for (const id of order) {
    nodeById(id).state = 'in-progress'
    await wait(600)
    // tiny chance of error on publish to show red path
    if (id === 'publish' && Math.random() < 0.15) {
      nodeById(id).state = 'error'
      isSimulating.value = false
      return
    }
    nodeById(id).state = 'done'
    await wait(150)
  }
  isSimulating.value = false
}

function wait(ms:number){ return new Promise(r => setTimeout(r, ms)) }

function onRefreshQueue() {
  // later: fetch latest feed statuses
  console.log('Refreshing queue...')
}

function onOpenErrorRow(item: any) {
  // later: navigate to importer with row filter
  console.log('Opening error row:', item)
}

function onResubmitJob(item: any) {
  // later: call your backend to requeue the feed or item update
  console.log('Resubmitting job:', item)
}
</script>

<style scoped>
.diagram-canvas {
  position: relative;
  width: 100%;
  min-height: 380px;
  overflow: auto;
}
.node-card {
  position: absolute;
  cursor: pointer;
}
.transition-fast { transition: box-shadow 120ms ease, transform 120ms ease; }
.state-idle   { opacity: 0.9; }
.state-progress { outline: 2px dashed rgb(var(--v-theme-primary)); }
.state-done   { box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.55) inset; }
.state-error  { box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.55) inset; }

.edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.edge {
  stroke: rgba(0,0,0,0.25);
  stroke-width: 2;
}
.edge-active {
  stroke: rgb(var(--v-theme-primary));
  stroke-dasharray: 6 6;
  animation: dash 1.2s linear infinite;
}
@keyframes dash {
  to { stroke-dashoffset: -24; }
}
</style>
