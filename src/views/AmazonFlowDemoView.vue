<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-timeline-variant</v-icon>
            How the Amazon Seller Assistant Works
            <v-spacer></v-spacer>
            <v-btn color="primary" prepend-icon="mdi-home" @click="$router.push('/')">
              Back to Home
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal">
              This interactive diagram shows how our custom Amazon listing tool simplifies the complex Seller Central workflow.
              Click on any step to learn more, or hit "Simulate Publish" to see the full flow in action.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <AmazonFlowMermaid />

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card color="primary" variant="tonal">
          <v-card-title class="text-h5">
            <v-icon class="mr-2">mdi-rocket-launch</v-icon>
            Get Started Today - Action Steps for Joseph
          </v-card-title>
          <v-card-text>
            <v-stepper alt-labels :items="['Register', 'Get Credentials', 'Prepare Data', 'Test & Launch']" hide-actions>
              <template v-slot:item.1>
                <v-card flat>
                  <v-card-title class="text-h6">1. Register as Amazon Developer</v-card-title>
                  <v-card-text>
                    <p class="mb-2"><strong>What to do:</strong></p>
                    <ul class="mb-3">
                      <li>Go to <a href="https://developer.amazonservices.com" target="_blank" class="text-primary">developer.amazonservices.com</a></li>
                      <li>Sign in with your Seller Central account</li>
                      <li>Click "Register as a Developer" (it's free!)</li>
                    </ul>
                    <v-chip color="info" size="small">⏱️ Takes 5 minutes</v-chip>
                  </v-card-text>
                </v-card>
              </template>

              <template v-slot:item.2>
                <v-card flat>
                  <v-card-title class="text-h6">2. Create Sandbox Application</v-card-title>
                  <v-card-text>
                    <p class="mb-2"><strong>What to do:</strong></p>
                    <ul class="mb-3">
                      <li>In Developer Portal, create a new "SP-API Application"</li>
                      <li>Choose "Sandbox" mode (safe testing environment)</li>
                      <li>Copy your Client ID and Client Secret</li>
                    </ul>
                    <v-chip color="info" size="small">⏱️ Takes 10 minutes</v-chip>
                  </v-card-text>
                </v-card>
              </template>

              <template v-slot:item.3>
                <v-card flat>
                  <v-card-title class="text-h6">3. Prepare Your Product CSV</v-card-title>
                  <v-card-text>
                    <p class="mb-2"><strong>Create a CSV with these columns:</strong></p>
                    <v-chip class="ma-1" size="small">sku</v-chip>
                    <v-chip class="ma-1" size="small">parent_sku</v-chip>
                    <v-chip class="ma-1" size="small">title</v-chip>
                    <v-chip class="ma-1" size="small">brand</v-chip>
                    <v-chip class="ma-1" size="small">price</v-chip>
                    <v-chip class="ma-1" size="small">quantity</v-chip>
                    <v-chip class="ma-1" size="small">size_name</v-chip>
                    <v-chip class="ma-1" size="small">image_url</v-chip>
                    <p class="mt-3"><strong>Example row:</strong></p>
                    <code class="text-caption">HAY-5LB-001, HAY-PARENT, Happy Haystack Timothy Hay 5lb, Happy Haystack, 24.99, 100, 5 lb, https://...</code>
                    <v-divider class="my-3" />
                    <v-chip color="info" size="small">⏱️ Takes 30 minutes for all products</v-chip>
                  </v-card-text>
                </v-card>
              </template>

              <template v-slot:item.4>
                <v-card flat>
                  <v-card-title class="text-h6">4. Test in Sandbox & Go Live</v-card-title>
                  <v-card-text>
                    <p class="mb-2"><strong>Safe testing process:</strong></p>
                    <ul class="mb-3">
                      <li>Upload your CSV to our tool</li>
                      <li>Fix any validation errors (we'll show you exactly what's wrong)</li>
                      <li>Click "Publish to Sandbox" - test without affecting real listings</li>
                      <li>Once it works, switch to Production and publish for real!</li>
                    </ul>
                    <v-chip color="success" size="small">✅ You're live on Amazon!</v-chip>
                  </v-card-text>
                </v-card>
              </template>
            </v-stepper>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Time Savings Breakdown</v-card-title>
          <v-card-text>
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Seller Central</th>
                    <th>Our Tool</th>
                    <th>Savings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Add 1 product (5 variations)</td>
                    <td>2 hours</td>
                    <td>5 minutes</td>
                    <td class="text-success font-weight-bold">24x faster</td>
                  </tr>
                  <tr>
                    <td>Update 20 products</td>
                    <td>3+ hours</td>
                    <td>10 minutes</td>
                    <td class="text-success font-weight-bold">18x faster</td>
                  </tr>
                  <tr>
                    <td>Fix validation errors</td>
                    <td>1 hour (trial & error)</td>
                    <td>5 minutes (clear hints)</td>
                    <td class="text-success font-weight-bold">12x faster</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Questions?</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-help-circle</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">Is this safe?</v-list-item-title>
                <v-list-item-subtitle>Yes! We use Amazon's official Sandbox first, so you can test without any risk to your live listings.</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-help-circle</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">Do I need coding skills?</v-list-item-title>
                <v-list-item-subtitle>No! Just create a CSV file (like Excel) with your product info. The tool handles all the Amazon complexity.</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-help-circle</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">How much does it cost?</v-list-item-title>
                <v-list-item-subtitle>Amazon SP-API is free to use. You just need a Seller Central account (which you already have!).</v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-divider class="my-4" />

            <v-btn color="primary" block prepend-icon="mdi-amazon" @click="$router.push('/amazon-seller')">
              Try the Prototype Now
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import AmazonFlowMermaid from '@/components/AmazonFlowMermaid.vue'
</script>
