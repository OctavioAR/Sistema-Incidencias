import { createRouter, createWebHistory } from 'vue-router';
import authRoutes from '../modules/auth/router';
import configuracionRoutes from '../modules/configuracion/router';
import incidenciasRoutes from '../modules/incidencias/router';
import cambiosRoutes from '../modules/cambios/router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../modules/auth/vistas/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    
    ...configuracionRoutes,
      ...incidenciasRoutes,
      ...cambiosRoutes,
    {
      path: '/jefe/dashboard',
      name: 'JefeDashboard',
      component: () => import('../modules/dashboard/vistas/JefeDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tecnico/dashboard',
      name: 'TecnicoDashboard',
      component: () => import('../modules/dashboard/vistas/TecnicoDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/maestro/dashboard',
      name: 'MaestroDashboard',
      component: () => import('../modules/dashboard/vistas/MaestroDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/jefe-departamento/dashboard',
      name: 'DashboardJefeDepartamento',
      component: () => import('../modules/dashboard/vistas/JefeDepartamento.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/jefe-departamento/maestros',
      name: 'GestionMaestrosJefe',
      component: () => import('../modules/configuracion/vistas/GestionMaestrosJefeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ],
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth !== false;
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  console.log('Navegando a:', to.path, 'Requiere auth:', requiresAuth, 'Autenticado:', isAuthenticated);
  
  if (requiresAuth && !isAuthenticated) {
    console.log('Redirigiendo a login - No autenticado');
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    console.log('Redirigiendo desde login - Ya autenticado');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    switch (usuario.tipo_usuario_nombre?.toLowerCase()) {
      case 'jefe de taller':
        next('/jefe/dashboard');
        break;
      case 'técnico':
        next('/tecnico/dashboard');
        break;
      case 'maestro':
        next('/maestro/dashboard');
        break;
      default:
        next('/configuracion');
    }
  } else {
    console.log('Navegación permitida');
    next();
  }
});

export default router;