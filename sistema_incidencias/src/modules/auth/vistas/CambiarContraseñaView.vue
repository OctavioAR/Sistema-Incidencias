<template>
  <div class="user-menu">
    <button @click="mostrarCambiarPassword" class="btn-change-password">
      Cambiar Contraseña
    </button>
  </div>

  <ModalCambiarPassword 
    :mostrar="modalCambiarPassword.mostrar"
    @cerrar="modalCambiarPassword.mostrar = false"
    @cambiado="onPasswordCambiada"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ModalCambiarPassword from '../componentes/ModalCambiarPassword.vue';

const modalCambiarPassword = ref({
  mostrar: false
});

const mostrarCambiarPassword = () => {
  modalCambiarPassword.value.mostrar = true;
};

const onPasswordCambiada = () => {
  console.log('Contraseña cambiada exitosamente');
};
</script>

<style scoped>
.btn-change-password {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-change-password:hover {
  background: #e5e7eb;
}
</style>