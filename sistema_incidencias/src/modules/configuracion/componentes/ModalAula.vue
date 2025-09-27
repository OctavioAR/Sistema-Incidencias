<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ esEdicion ? '✏️ Editar Aula' : '🚪 Nueva Aula' }}</h3>
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
            placeholder="Ej: A01, LP, L02"
          >
        </div>
        
        <div class="form-group">
          <label for="nombre">Nombre *</label>
          <input 
            id="nombre"
            v-model="formulario.nombre" 
            type="text" 
            required 
            maxlength="100"
            placeholder="Ej: Aula 01, Laboratorio de Programación"
          >
        </div>
        
        <div class="form-group">
          <label for="idEdificio">Edificio</label>
          <select 
            id="idEdificio"
            v-model="formulario.idEdificio" 
            class="form-select"
          >
            <option :value="undefined">Seleccionar edificio...</option>
            <option 
              v-for="edificio in edificios" 
              :key="edificio.idEdificio" 
              :value="edificio.idEdificio"
            >
              {{ edificio.codigo }} - {{ edificio.nombre }}
            </option>
          </select>
          <small>Opcional: Selecciona el edificio donde se encuentra el aula</small>
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
import { ref, watch, computed, onMounted } from 'vue';
import { ubicacionesService, type Aula, type Edificio } from '../api/ubicacionesAPI';

interface Props {
  mostrar: boolean;
  aula?: Aula | null;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const edificios = ref<Edificio[]>([]);
const formulario = ref({
  codigo: '',
  nombre: '',
  idEdificio: undefined as number | undefined
});

const esEdicion = computed(() => !!props.aula);

const cargarEdificios = async () => {
  try {
    const response = await ubicacionesService.obtenerEdificios();
    edificios.value = response.data;
  } catch (error) {
    console.error('Error al cargar edificios:', error);
  }
};

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (props.aula) {
      formulario.value = {
        codigo: props.aula.codigo,
        nombre: props.aula.nombre,
        idEdificio: props.aula.idEdificio
      };
    } else {
      formulario.value = { codigo: '', nombre: '', idEdificio: undefined };
    }
  }
});

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formulario.value.codigo.trim() || !formulario.value.nombre.trim()) {
    alert('Por favor completa los campos obligatorios');
    return;
  }

  cargando.value = true;
  try {
    if (esEdicion.value && props.aula?.idAula) {
      await ubicacionesService.actualizarAula(props.aula.idAula, formulario.value);
    } else {
      await ubicacionesService.crearAula(formulario.value);
    }
    
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el aula';
    alert(mensajeError);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  cargarEdificios();
});
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