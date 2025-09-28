import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/configuracion',
    name: 'Configuracion',
    component: () => import('../vistas/DashboardConfiguracion.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion/ubicaciones',
    name: 'GestionUbicaciones',
    component: () => import('../vistas/GestionUbicacionesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion/equipos',
    name: 'GestionEquipos',
    component: () => import('../vistas/GestionEquiposView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion/usuarios',
    name: 'GestionUsuarios',
    component: () => import('../vistas/GestionUsuariosView.vue'),
    meta: { requiresAuth: true }
  },
 {
    path: '/configuracion/software',
    name: 'GestionSoftware',
    component: () => import('../vistas/GestionSoftwareView.vue'),
    meta: { requiresAuth: true }
  },
  /*{
    path: '/configuracion/contratos',
    name: 'GestionContratos',
    component: () => import('../vistas/GestionContratosView.vue'),
    meta: { requiresAuth: true }
  }*/
];

export default routes;