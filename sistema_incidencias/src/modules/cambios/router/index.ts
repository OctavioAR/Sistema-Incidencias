import DashboardCambios from '../vistas/DashboardCambios.vue';
import GestionCambiosView from '../vistas/GestionCambiosView.vue';
import GestionAlmacenView from '../vistas/GestionAlmacenView.vue';

const cambiosRoutes = [
  {
    path: '/cambios',
    name: 'DashboardCambios',
    component: DashboardCambios, 
    meta: { requiresAuth: true },
    children: [
      {
        path: 'solicitudes', 
        name: 'GestionSolicitudesCambio',
        component: GestionCambiosView, 
        meta: { requiresAuth: true }
      },
      {
        path: 'almacen', 
        name: 'GestionAlmacen',
        component: GestionAlmacenView, 
        meta: { requiresAuth: true }
      },
    ]
  },
];

export default cambiosRoutes;