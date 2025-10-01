<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Settings</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-subheader>Display</v-list-subheader>
              <v-list-item>
                <v-list-item-title>Dark Mode</v-list-item-title>
                <template v-slot:append>
                  <v-switch
                    :model-value="theme.global.current.value.dark"
                    @update:model-value="toggleTheme"
                    color="primary"
                    hide-details
                  ></v-switch>
                </template>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-subheader>Share</v-list-subheader>
              <v-list-item>
                <v-list-item-title>Current State URL</v-list-item-title>
                <v-list-item-subtitle class="text-wrap">{{ shareUrl }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn icon size="small" @click="copyShareUrl">
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                </template>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-subheader>About</v-list-subheader>
              <v-list-item>
                <v-list-item-title>Version</v-list-item-title>
                <v-list-item-subtitle>1.0.0 MVP</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Built with</v-list-item-title>
                <v-list-item-subtitle>Vue 3, Vuetify 3, MapLibre GL</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :timeout="2000" color="success">
      Link copied to clipboard!
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { usePricingStore } from '@/stores/usePricingStore'

const theme = useTheme()
const pricingStore = usePricingStore()
const snackbar = ref(false)

const shareUrl = computed(() => {
  const params = new URLSearchParams()
  params.set('base_rate', pricingStore.base_rate.toString())
  params.set('per_mile', pricingStore.per_mile.toString())
  params.set('per_lb', pricingStore.per_lb.toString())
  params.set('dim_divisor', pricingStore.dim_divisor.toString())
  params.set('fuel_pct', pricingStore.fuel_pct.toString())
  params.set('peak_pct', pricingStore.peak_pct.toString())
  params.set('residential_fee', pricingStore.residential_fee.toString())
  return `${window.location.origin}/?${params.toString()}`
})

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

async function copyShareUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    snackbar.value = true
  } catch (e) {
    console.error('Failed to copy', e)
  }
}
</script>
