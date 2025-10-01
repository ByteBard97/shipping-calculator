<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters>
      <v-col cols="12" md="8">
        <div class="pa-2">
          <v-card>
            <v-card-title>Zones Map</v-card-title>
            <v-card-text class="pa-0">
              <ZoneMap :show-heatmap="true" />
            </v-card-text>
          </v-card>
        </div>
      </v-col>

      <v-col cols="12" md="4">
        <div class="pa-2">
          <v-card>
            <v-card-title>Zone Details</v-card-title>
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="zoneItems"
                density="compact"
                :items-per-page="15"
              >
                <template v-slot:item.multiplier="{ item }">
                  <v-chip :color="getMultiplierColor(item.multiplier)" size="small">
                    {{ item.multiplier }}
                  </v-chip>
                </template>
                <template v-slot:item.remote_fee="{ item }">
                  ${{ item.remote_fee.toFixed(2) }}
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ZoneMap from '@/components/ZoneMap.vue'
import { useZonesStore } from '@/stores/useZonesStore'

const zonesStore = useZonesStore()

const headers = [
  { title: 'Zone ID', key: 'zone_id', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Multiplier', key: 'multiplier', sortable: true },
  { title: 'Remote Fee', key: 'remote_fee', sortable: true }
]

const zoneItems = computed(() => {
  return zonesStore.zones?.features.map(f => f.properties) ?? []
})

function getMultiplierColor(multiplier: number): string {
  if (multiplier < 1.0) return 'success'
  if (multiplier < 1.05) return 'info'
  if (multiplier < 1.10) return 'warning'
  return 'error'
}
</script>

<style scoped>
.map-container {
  height: 600px;
}
</style>
