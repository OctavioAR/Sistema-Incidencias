<template>
  <div v-if="mostrar && usuarioValido" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔑 Cambiar Contraseña</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="user-info">
          <p><strong>Usuario:</strong> {{ usuario!.nombre }} {{ usuario!.apellidoPat }}</p>
          <p><strong>Email:</strong> {{ usuario!.email }}</p>
        </div>
        
        <div class="form-group">
          <label for="nuevaPassword">Nueva Contraseña *</label>
          <input 
            id="nuevaPassword"
            v-model="nuevaPassword" 
            type="password" 
            required 
            minlength="6"
            placeholder="Mínimo 6 caracteres"
          >
          <small>La nueva contraseña debe tener al menos 6 caracteres</small>
        </div>
        
        <div class="form-group">
          <label for="confirmarPassword">Confirmar Contraseña *</label>
          <input 
            id="confirmarPassword"
            v-model="confirmarPassword" 
            type="password" 
            required 
            minlength="6"
            placeholder="Repite la contraseña"
          >
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando" class="btn-primary">
            {{ cargando ? 'Cambiando...' : 'Cambiar Contraseña' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { usuariosService, type UsuarioCompleto } from '../api/usuariosAPI';

interface Props {
  mostrar: boolean;
  usuario: UsuarioCompleto | null; 
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const nuevaPassword = ref('');
const confirmarPassword = ref('');
const error = ref('');

const usuarioValido = computed(() => {
  return props.usuario && props.usuario.idUsuario;
});

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (!usuarioValido.value) {
      cerrar();
      return;
    }
    
    nuevaPassword.value = '';
    confirmarPassword.value = '';
    error.value = '';
  }
});

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!usuarioValido.value) {
    error.value = 'Usuario no válido';
    return;
  }

  if (!nuevaPassword.value) {
    error.value = 'La nueva contraseña es obligatoria';
    return;
  }

  if (nuevaPassword.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres';
    return;
  }

  if (nuevaPassword.value !== confirmarPassword.value) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }

  cargando.value = true;
  error.value = '';

  try {
    await usuariosService.cambiarPassword(props.usuario!.idUsuario!, nuevaPassword.value);
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al cambiar la contraseña';
    error.value = mensajeError;
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

.user-info {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #0ea5e9;
}

.user-info p {
  margin: 5px 0;
  color: #374151;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #6b7280;
  font-size: 12px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px;
  border-radius: 4px;
  margin: 15px 0;
  border: 1px solid #fecaca;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>