<template>
  <div id="app">
    <nav v-if="mostrarNavegacion" style="padding: 1rem; background: #363636; border-bottom: 1px solid #ddd;">

      <router-link 
        v-if="usuario?.tipo_usuario_nombre === 'Jefe de Taller'" 
        to="/jefe/dashboard" 
        style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Dashboard Jefe
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
         
      <router-link to="/configuracion" style="margin-right: 1rem; text-decoration: none; color: #FFFFFF;">
        Configuración
      </router-link>
      
      <div v-if="usuario" style="float: right;">
        <span style="margin-right: 1rem;">
           {{ usuario.nombre }} ({{ usuario.tipo_usuario_nombre }})
        </span>
        
        <button @click="logout" style="padding: 0.25rem 0.5rem; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">
          Cerrar Sesión
        </button>
      </div>
      
      <div v-else style="float: right; color: #666;">
        Cargando...
      </div>
    </nav>
    
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const usuario = ref<any>(null);
const usuarioCargado = ref(false); 

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
</style>