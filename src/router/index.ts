import { createRouter, createWebHashHistory } from 'vue-router'
import EstimatorView from '@/views/EstimatorView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'estimator',
      component: EstimatorView
    },
    {
      path: '/zones',
      name: 'zones',
      component: () => import('@/views/ZonesView.vue')
    },
    {
      path: '/batch',
      name: 'batch',
      component: () => import('@/views/BatchView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    },
    {
      path: '/scanner',
      name: 'scanner',
      component: () => import('@/views/BarcodeScannerView.vue')
    }
  ]
})

export default router
