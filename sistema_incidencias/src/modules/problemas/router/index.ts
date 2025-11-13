import type { RouteRecordRaw } from 'vue-router';
import GestionProblemasView from '../vistas/GestionProblemasView.vue';

const routes: RouteRecordRaw[] = [
{
  path: '/problemas',
  name: 'GestionProblemas',
  component: GestionProblemasView,
  meta: { requiresAuth: true }
}
];

export default routes;