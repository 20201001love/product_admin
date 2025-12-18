import { createRouter, createWebHistory } from 'vue-router'

export const constantRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login.vue'),
  },
  {
    path: '/screen',
    name: 'screen',
    component: () => import('@/views/screen/index.vue'),
  },
]

export const dynamicRoutes = [
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...constantRoutes,
  ],
})

export default router
