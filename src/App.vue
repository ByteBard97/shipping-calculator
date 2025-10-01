<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Shipping Calculator MVP</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ theme.global.current.value.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item to="/" prepend-icon="mdi-calculator" title="Estimator"></v-list-item>
        <v-list-item to="/zones" prepend-icon="mdi-map" title="Zones"></v-list-item>
        <v-list-item to="/batch" prepend-icon="mdi-file-delimited" title="Batch Pricing"></v-list-item>
        <v-list-item to="/settings" prepend-icon="mdi-cog" title="Settings"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer v-model="pricingDrawer" width="320" location="left" permanent>
      <PricingControls />
    </v-navigation-drawer>

    <v-navigation-drawer v-model="presetsDrawer" width="280" location="right">
      <PresetsPanel />
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from 'vuetify'
import PricingControls from '@/components/PricingControls.vue'
import PresetsPanel from '@/components/PresetsPanel.vue'

const theme = useTheme()
const drawer = ref(false)
const pricingDrawer = ref(true)
const presetsDrawer = ref(true)

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>
