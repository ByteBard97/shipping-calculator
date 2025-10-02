<template>
  <v-container fluid class="pa-0">
    <v-row justify="center">
      <v-col cols="12">
        <!-- Hero Section -->
        <v-card class="mb-6" elevation="0" tile>
          <v-img
            :src="bannerImage"
            height="300"
            cover
            class="align-end"
          >
            <v-card-title class="text-h3 text-white pa-6" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7)">
              <img :src="logoImage" alt="Happy Haystack Logo" style="height: 80px; margin-right: 16px;">
            </v-card-title>
          </v-img>

          <v-card-text class="pa-8">
            <v-row justify="center">
              <v-col cols="12" md="5">
                <img :src="taglineImage" alt="Happy Haystack" style="width: 100%; max-width: 100%;">
              </v-col>
              <v-col cols="12" md="5">
                <img :src="featuresImage" alt="Hay Features" style="width: 100%; max-width: 100%;">
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Business Tools Section -->
        <v-container>
        <v-card class="mx-auto" elevation="8" max-width="1200">
          <v-card-title class="text-h4 text-center py-6 bg-primary">
            Business Management Tools
          </v-card-title>

          <v-card-text class="pa-8">
            <p class="text-h6 text-center mb-8">Select a tool to get started</p>

            <v-row>
              <v-col cols="12" md="4">
                <v-card
                  class="app-card"
                  elevation="2"
                  hover
                  @click="$router.push('/shipping')"
                >
                  <v-card-text class="text-center pa-6">
                    <v-icon size="64" color="primary" class="mb-4">mdi-package-variant</v-icon>
                    <div class="text-h5 mb-2">Shipping Calculator</div>
                    <p class="text-body-2">Calculate shipping costs and manage zones for product delivery</p>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card
                  class="app-card"
                  elevation="2"
                  hover
                  @click="$router.push('/scanner')"
                >
                  <v-card-text class="text-center pa-6">
                    <v-icon size="64" color="primary" class="mb-4">mdi-barcode-scan</v-icon>
                    <div class="text-h5 mb-2">Warehouse Scanner</div>
                    <p class="text-body-2">Scan barcodes and update inventory database</p>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card
                  class="app-card"
                  elevation="2"
                  hover
                  @click="$router.push('/amazon-seller')"
                >
                  <v-card-text class="text-center pa-6">
                    <v-icon size="64" color="primary" class="mb-4">mdi-store</v-icon>
                    <div class="text-h5 mb-2">Amazon Seller</div>
                    <p class="text-body-2">Manage products, listings, and store content on Amazon</p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Product Showcase -->
            <v-row class="mt-8">
              <v-col cols="12">
                <p class="text-h6 text-center mb-4">Our Products</p>
              </v-col>
              <v-col cols="12" md="6">
                <v-card elevation="2">
                  <v-img :src="hayProductImage" height="400" contain></v-img>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card elevation="2">
                  <v-img :src="hayHavenProductImage" height="400" contain></v-img>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import bannerImage from '/happy-haystack-banner.webp'
import logoImage from '/happy-haystack-logo.webp'
import taglineImage from '/happy-haystack-tagline.webp'
import featuresImage from '/hay-features.webp'
import hayProductImage from '/hay-product.webp'
import hayHavenProductImage from '/hay-haven-product.webp'
</script>

<style scoped>
.app-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.app-card:hover {
  transform: translateY(-4px);
}
</style>
