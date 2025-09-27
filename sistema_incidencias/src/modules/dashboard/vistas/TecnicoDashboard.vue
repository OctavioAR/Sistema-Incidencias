<template>
  <div class="dashboard">
    <div v-if="usuario">
      <h1>Dashboard Técnico</h1>
      <p>Bienvenido {{ usuario.nombre }}</p>
      <div class="stats">
        <div class="stat-card">
          <h3>Total Incidencias</h3>
          <p>25</p>
        </div>
        <div class="stat-card">
          <h3>Pendientes</h3>
          <p>10</p>
        </div>
        <div class="stat-card">
          <h3>Resueltas</h3>
          <p>15</p>
        </div>
      </div>
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

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #666;
}

.stat-card p {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
  color: #333;
}
</style>