<template>
  <div class="dashboard-configuracion">
    <h1>Gestión de Configuración</h1>
    <div class="grid">
      <router-link to="/configuracion/ubicaciones" class="card">
        <h3>🏢 Ubicaciones</h3>
        <p>Gestionar Ubicaciones del plantel</p>
      </router-link>
      <router-link to="/configuracion/usuarios" class="card">
        <h3>👥 Usuarios</h3>
        <p>Gestionar cuentas de usuario</p>
      </router-link>
      <router-link to="/configuracion/equipos" class="card">
        <h3>📊 Equipos</h3>
        <p>Gestionar hardware y dispositivos</p>
      </router-link>
      <router-link to="/configuracion/software" class="card">
        <h3>💾 Software</h3>
        <p>Gestionar aplicaciones y licencias</p>
      </router-link>
      <router-link to="/configuracion/contratos" class="card">
        <h3>📝 Contratos</h3>
        <p>Gestionar mantenimiento y garantías</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.dashboard-configuracion {
  padding: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.card {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s;
  background: white;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
</style>