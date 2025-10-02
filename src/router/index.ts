import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import EstimatorView from '@/views/EstimatorView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/shipping',
      name: 'estimator',
      component: EstimatorView
    },
    {
      path: '/shipping/zones',
      name: 'zones',
      component: () => import('@/views/ZonesView.vue')
    },
    {
      path: '/shipping/batch',
      name: 'batch',
      component: () => import('@/views/BatchView.vue')
    },
    {
      path: '/shipping/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    },
    {
      path: '/scanner',
      name: 'scanner',
      component: () => import('@/views/BarcodeScannerView.vue')
    },
    {
      path: '/amazon-seller',
      name: 'amazon-seller',
      component: () => import('@/views/AmazonSellerView.vue')
    },
    {
      path: '/amazon-flow-demo',
      name: 'amazon-flow-demo',
      component: () => import('@/views/AmazonFlowDemoView.vue')
    }
  ]
})

export default router
