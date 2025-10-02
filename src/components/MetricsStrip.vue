<template>
  <v-card class="pa-3">
    <v-row no-gutters>
      <v-col cols="12" sm="4">
        <v-list-item density="compact">
          <template #prepend>
            <v-avatar size="28"><v-icon>mdi-rocket-launch</v-icon></v-avatar>
          </template>
          <v-list-item-title class="text-body-2">Publishes today</v-list-item-title>
          <v-list-item-subtitle class="text-h6">{{ metrics.publishesToday }}</v-list-item-subtitle>
        </v-list-item>
      </v-col>
      <v-col cols="12" sm="4">
        <v-list-item density="compact">
          <template #prepend>
            <v-avatar size="28"><v-icon>mdi-check-decagram</v-icon></v-avatar>
          </template>
          <v-list-item-title class="text-body-2">Success rate</v-list-item-title>
          <v-list-item-subtitle class="text-h6">{{ (metrics.successRate * 100).toFixed(0) }}%</v-list-item-subtitle>
        </v-list-item>
      </v-col>
      <v-col cols="12" sm="4">
        <v-list-item density="compact">
          <template #prepend>
            <v-avatar size="28"><v-icon>mdi-timer-sand</v-icon></v-avatar>
          </template>
          <v-list-item-title class="text-body-2">Avg. processing</v-list-item-title>
          <v-list-item-subtitle class="text-h6">{{ metrics.avgProcessingMs }} ms</v-list-item-subtitle>
        </v-list-item>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
type Metrics = {
  publishesToday: number
  successRate: number   // 0..1
  avgProcessingMs: number
}
defineProps<{ metrics: Metrics }>()
</script>
