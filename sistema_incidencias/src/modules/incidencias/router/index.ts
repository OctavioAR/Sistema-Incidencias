import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/incidencias',
    name: 'GestionIncidencias',
    component: () => import('../vistas/GestionIncidenciasView.vue'),
    meta: { requiresAuth: true }
  },
];

export default routes;