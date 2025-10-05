<template>
  <div class="dashboard-configuracion">
    <h1>Gestión de Configuración</h1>
    
    <div class="grid">
      <!-- Gestion de Ubicaciones -->
      <router-link to="/configuracion/ubicaciones" class="card">
        <div class="card-icon">🏢</div>
        <h3>Ubicaciones</h3>
        <p>Gestionar edificios, aulas y departamentos</p>
      </router-link>
      
      <!-- Gestion de Equipos -->
      <router-link to="/configuracion/equipos" class="card">
        <div class="card-icon">💻</div>
        <h3>Equipos</h3>
        <p>Gestionar hardware y dispositivos</p>
      </router-link>
      
      <!-- Gestion de Software -->
      <router-link to="/configuracion/software" class="card">
        <div class="card-icon">💾</div>
        <h3>Software</h3>
        <p>Gestionar aplicaciones y licencias</p>
      </router-link>
      
      <!-- Gestion de Contratos 
      <router-link to="/configuracion/contratos" class="card">
        <div class="card-icon">📝</div>
        <h3>Contratos</h3>
        <p>Gestionar mantenimiento y garantías</p>
      </router-link>-->
      
      <!-- Gestion de Usuarios -->
      <router-link to="/configuracion/usuarios" class="card">
        <div class="card-icon">👥</div>
        <h3>Usuarios</h3>
        <p>Gestionar cuentas de usuario</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.dashboard-configuracion {
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