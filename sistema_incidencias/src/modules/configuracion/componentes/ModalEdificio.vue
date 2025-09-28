<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ esEdicion ? 'Editar Edificio' : 'Nuevo Edificio' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="form-group">
          <label for="codigo">Código *</label>
          <input 
            id="codigo"
            v-model="formulario.codigo" 
            type="text" 
            required 
            maxlength="10"
            placeholder="Ej: EA, EB, EC"
          >
          <small>Código único del edificio (máx. 10 caracteres)</small>
        </div>
        
        <div class="form-group">
          <label for="nombre">Nombre *</label>
          <input 
            id="nombre"
            v-model="formulario.nombre" 
            type="text" 
            required 
            maxlength="100"
            placeholder="Ej: Edificio A - Sistemas"
          >
        </div>
        
        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando" class="btn-primary">
            {{ cargando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ubicacionesService, type Edificio } from '../api/ubicacionesAPI';

interface Props {
  mostrar: boolean;
  edificio?: Edificio | null;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const formulario = ref({
  codigo: '',
  nombre: ''
});

const esEdicion = computed(() => !!props.edificio);

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (props.edificio) {
      formulario.value = {
        codigo: props.edificio.codigo,
        nombre: props.edificio.nombre
      };
    } else {
      formulario.value = { codigo: '', nombre: '' };
    }
  }
});

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formulario.value.codigo.trim() || !formulario.value.nombre.trim()) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }

  cargando.value = true;
  try {
    if (esEdicion.value && props.edificio?.idEdificio) {
      await ubicacionesService.actualizarEdificio(
        props.edificio.idEdificio,
        formulario.value
      );
    } else {
      await ubicacionesService.crearEdificio(formulario.value);
    }
    
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el edificio';
    alert(mensajeError);
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group small {
  color: #666;
  font-size: 12px;
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
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>