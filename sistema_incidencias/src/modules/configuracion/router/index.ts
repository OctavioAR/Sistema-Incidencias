import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/configuracion',
    name: 'Configuracion',
    component: () => import('../vistas/DashboardConfiguracion.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion/equipos',
    name: 'EquiposConfig',
    component: () => import('../vistas/EquiposView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion/software',
    name: 'SoftwareConfig',
    component: () => import('../vistas/SoftwareView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion/contratos',
    name: 'ContratosConfig',
    component: () => import('../vistas/ContratosView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion/equipo/:id',
    name: 'DetalleEquipo',
    component: () => import('../vistas/DetalleEquipoView.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/configuracion/ubicaciones',
    name: 'GestionUbicaciones',
    component: () => import('../vistas/GestionUbicacionesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracion/usuarios',
    name: 'GestionUsuarios',
    component: () => import('../vistas/GestionUsuariosView.vue'),
    meta: { requiresAuth: true }
  },
];

export default routes;