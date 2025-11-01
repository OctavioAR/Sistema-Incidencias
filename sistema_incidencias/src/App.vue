<template>
  <div id="app">
    <nav v-if="mostrarNavegacion" style="padding: 1rem; background: #363636; border-bottom: 1px solid #ddd;">

      <router-link 
        v-if="usuario?.tipo_usuario_nombre === 'Jefe de Taller'" 
        to="/jefe/dashboard" 
        style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Dashboard Jefe de Taller
      </router-link>

      <router-link 
        v-if="usuario?.tipo_usuario_nombre === 'Jefe de Departamento'" 
        to="/jefe-departamento/dashboard" 
        style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Dashboard Jefe de Departamento
      </router-link>
      
      <router-link 
        v-if="usuario?.tipo_usuario_nombre === 'Técnico'" 
        to="/tecnico/dashboard" 
        style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Dashboard Técnico
      </router-link>
      
      <router-link 
        v-if="usuario?.tipo_usuario_nombre === 'Maestro'" 
        to="/maestro/dashboard" 
        style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Dashboard Maestro
      </router-link>
         
      <router-link 
        v-if="mostrarConfiguracion" 
        to="/configuracion" 
        style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Configuración
      </router-link>

      <router-link 
        to="/incidencias" 
        style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Incidencias
      </router-link>

      <router-link 
        v-if="mostrarCambios"
        to="/cambios" 
        style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Cambios
      </router-link>
      
      <div v-if="usuario" style="float: right;">
        <span style="margin-right: 1rem;">
           {{ usuario.nombre }} ({{ usuario.tipo_usuario_nombre }})
        </span>

        <!-- Botón para cambiar contraseña -->
        <button 
          @click="mostrarCambiarPassword" 
          style="margin-right: 1rem; padding: 0.25rem 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 3px; cursor: pointer;"
          title="Cambiar mi contraseña">
          Cambiar Contraseña
        </button>
        
        <button @click="logout" style="padding: 0.25rem 0.5rem; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">
          Cerrar Sesión
        </button>
      </div>
      
      <div v-else style="float: right; color: #666;">
        Cargando...
      </div>
    </nav>
    
    <router-view></router-view>

    <!-- Modal para cambiar contraseña -->
    <ModalCambiarPassword 
      :mostrar="modalCambiarPassword.mostrar"
      @cerrar="modalCambiarPassword.mostrar = false"
      @cambiado="onPasswordCambiada"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ModalCambiarPassword from './modules/auth/componentes/ModalCambiarPassword.vue'; // Ajusta la ruta según tu estructura

const route = useRoute();
const router = useRouter();
const usuario = ref<any>(null);
const usuarioCargado = ref(false);

// Estado para controlar el modal
const modalCambiarPassword = ref({
  mostrar: false
});

// Computed property para controlar quién ve configuración
const mostrarConfiguracion = computed(() => {
  const tipoUsuario = usuario.value?.tipo_usuario_nombre;
  // Solo Jefe de Taller y Técnicos pueden ver configuración
  return tipoUsuario === 'Jefe de Taller' || tipoUsuario === 'Técnico' || tipoUsuario === 'Jefe de Departamento';
});

const mostrarCambios = computed(() => {
  const tipoUsuario = usuario.value?.tipo_usuario_nombre;
  // Solo Jefe de Departamento puede ver cambios
  return tipoUsuario === 'Jefe de Taller' || tipoUsuario === 'Técnico';
})

const cargarUsuario = () => {
  const usuarioGuardado = localStorage.getItem('usuario');
  if (usuarioGuardado) {
    usuario.value = JSON.parse(usuarioGuardado);
  }
  usuarioCargado.value = true; 
};

watch(() => route.path, () => {
  cargarUsuario();
});

onMounted(() => {
  cargarUsuario();
});

const mostrarNavegacion = computed(() => {
  const estaAutenticado = !!localStorage.getItem('authToken');
  return route.path !== '/login' && estaAutenticado;
});

// Función para mostrar el modal de cambiar contraseña
const mostrarCambiarPassword = () => {
  modalCambiarPassword.value.mostrar = true;
};

// Función que se ejecuta después de cambiar la contraseña exitosamente
const onPasswordCambiada = () => {
  console.log('Contraseña cambiada exitosamente');
  // Aquí podrías agregar alguna notificación o acción adicional si lo deseas
};

const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('usuario');
  usuario.value = null;
  router.push('/login');
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
span{
  color: #FFFFFF;
}
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
}

.router-link-active {
  font-weight: bold;
  color: #2563eb;
}

.router-link-exact-active {
  border-bottom: 2px solid #2563eb;
}

button {
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>