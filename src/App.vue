<template>
  <v-app>
    <template v-if="isShippingApp">
      <v-app-bar color="primary" prominent>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title>Shipping Calculator</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="$router.push('/')">
          <v-icon>mdi-home</v-icon>
        </v-btn>
        <v-btn icon @click="toggleTheme">
          <v-icon>{{ theme.global.current.value.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer" temporary>
        <v-list>
          <v-list-item to="/shipping" prepend-icon="mdi-calculator" title="Estimator"></v-list-item>
          <v-list-item to="/shipping/zones" prepend-icon="mdi-map" title="Zones"></v-list-item>
          <v-list-item to="/shipping/batch" prepend-icon="mdi-file-delimited" title="Batch Pricing"></v-list-item>
          <v-list-item to="/shipping/settings" prepend-icon="mdi-cog" title="Settings"></v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-navigation-drawer v-model="pricingDrawer" width="320" location="left" permanent>
        <PricingControls />
      </v-navigation-drawer>

      <v-navigation-drawer v-model="presetsDrawer" width="280" location="right">
        <PresetsPanel />
      </v-navigation-drawer>
    </template>

    <template v-else-if="!isScanner">
      <v-app-bar color="primary">
        <v-toolbar-title>Joseph's Guinea Pig Hay Co.</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="toggleTheme">
          <v-icon>{{ theme.global.current.value.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
      </v-app-bar>
    </template>

    <v-main :style="isScanner ? 'padding: 0 !important' : ''">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useRoute } from 'vue-router'
import PricingControls from '@/components/PricingControls.vue'
import PresetsPanel from '@/components/PresetsPanel.vue'

const theme = useTheme()
const route = useRoute()
const drawer = ref(false)
const pricingDrawer = ref(true)
const presetsDrawer = ref(true)

const isScanner = computed(() => route.path === '/scanner')
const isShippingApp = computed(() => route.path.startsWith('/shipping'))

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>
