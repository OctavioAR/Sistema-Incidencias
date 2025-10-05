<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Cambiar Contraseña</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="cambiarPassword" class="modal-body">
        <div class="form-section">
          <div class="form-group">
            <label for="passwordActual">Contraseña Actual:</label>
            <input 
              id="passwordActual"
              v-model="formulario.passwordActual" 
              type="password" 
              required
              placeholder="Ingresa tu contraseña actual"
            >
          </div>
          
          <div class="form-group">
            <label for="nuevaPassword">Nueva Contraseña:</label>
            <input 
              id="nuevaPassword"
              v-model="formulario.nuevaPassword" 
              type="password" 
              required
              minlength="6"
              placeholder="Mínimo 6 caracteres"
            >
          </div>
          
          <div class="form-group">
            <label for="confirmarPassword">Confirmar Nueva Contraseña:</label>
            <input 
              id="confirmarPassword"
              v-model="formulario.confirmarPassword" 
              type="password" 
              required
              placeholder="Repite la nueva contraseña"
            >
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando || !formularioValido" class="btn-primary">
            {{ cargando ? 'Cambiando...' : 'Cambiar Contraseña' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { authService } from '../api/authAPI';

interface Props {
  mostrar: boolean;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'cambiado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);

const formulario = ref({
  passwordActual: '',
  nuevaPassword: '',
  confirmarPassword: ''
});

// Validación del formulario
const formularioValido = computed(() => {
  return (
    formulario.value.passwordActual &&
    formulario.value.nuevaPassword &&
    formulario.value.confirmarPassword &&
    formulario.value.nuevaPassword === formulario.value.confirmarPassword &&
    formulario.value.nuevaPassword.length >= 6
  );
});

const cerrar = () => {
  formulario.value = {
    passwordActual: '',
    nuevaPassword: '',
    confirmarPassword: ''
  };
  emit('cerrar');
};

const cambiarPassword = async () => {
  if (!formularioValido.value) {
    alert('Por favor completa todos los campos correctamente');
    return;
  }

  if (formulario.value.nuevaPassword !== formulario.value.confirmarPassword) {
    alert('Las contraseñas nuevas no coinciden');
    return;
  }

  cargando.value = true;
  try {
    await authService.cambiarPassword({
      passwordActual: formulario.value.passwordActual,
      nuevaPassword: formulario.value.nuevaPassword
    });
    
    alert('Contraseña cambiada correctamente');
    emit('cambiado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al cambiar la contraseña';
    alert('' + mensajeError);
    console.error('Error al cambiar contraseña:', error);
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.modal-header h3 {
  margin: 0;
  color: #374151;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-section {
  margin-bottom: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-group input {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group small {
  margin-top: 5px;
  color: #6b7280;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>