<template>
  <div class="dashboard">
    <div v-if="usuario">
      <h1>Dashboard Jefe de Taller</h1>
      <p>Bienvenido {{ usuario.nombre }}</p>
    </div>
    <div v-else>
      <p>Cargando información del usuario...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const usuario = ref<any>(null);

onMounted(() => {
  setTimeout(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      usuario.value = JSON.parse(usuarioGuardado);
    }
  }, 100);
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

</style>