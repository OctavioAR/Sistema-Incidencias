<template>
  <div class="detalle-equipo-view">
    <h1>Detalle del Equipo</h1>
    <p>Vista detallada del equipo ID: {{ $route.params.id }}</p>
    <!-- Aquí irá la información detallada del equipo -->
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<style scoped>
.detalle-equipo-view {
  padding: 20px;
}
</style>