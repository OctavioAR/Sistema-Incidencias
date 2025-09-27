import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../vistas/LoginView.vue'),
    meta: { requiresAuth: false }
  }
];

export default routes;