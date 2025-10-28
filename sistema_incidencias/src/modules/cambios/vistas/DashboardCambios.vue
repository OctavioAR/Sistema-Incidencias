<template>
  <div class="dashboard-cambios">
    <h1>Gestión de Cambios y Almacén</h1>
    
    <div v-if="$route.path === '/cambios'" class="grid">
      <router-link to="/cambios/solicitudes" class="card">
        <div class="card-icon">📋</div>
        <h3>Solicitudes de Cambio (RFC)</h3>
        <p>Gestionar, aprobar e implementar cambios en la infraestructura.</p>
      </router-link>
      
      <router-link to="/cambios/almacen" class="card">
        <div class="card-icon">📦</div>
        <h3>Gestión de Almacén</h3>
        <p>Control de inventario, entradas y salidas de hardware y consumibles.</p>
      </router-link>
    </div>

    <RouterView /> 
  </div>
</template>

<script setup lang="ts">
// Importar `useRoute` de Vue Router para acceder a la ruta actual
import { RouterView, useRoute } from 'vue-router';

// Obtener la instancia de la ruta
const route = useRoute();

// No necesita más lógica por ahora.
</script>

<style scoped>
.dashboard-cambios {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-top: 30px;
}

.card {
  background: white;
  padding: 30px 25px;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  text-align: center;
}

.card:hover {
  /*transform: translateY(-5px);*/
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border-color: #2563eb;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.card h3 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 1.25rem;
}

.card p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .card {
    padding: 20px;
  }
}
</style>