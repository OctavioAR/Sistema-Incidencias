<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ esEdicion ? '✏️ Editar Departamento' : '📚 Nuevo Departamento' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="form-group">
          <label for="nombre">Nombre del Departamento *</label>
          <input 
            id="nombre"
            v-model="formulario.nombre" 
            type="text" 
            required 
            maxlength="100"
            placeholder="Ej: Ingeniería Industrial"
          >
        </div>
        
        <div class="form-group">
          <label for="idEdificio">Edificio Principal</label>
          <select 
            id="idEdificio"
            v-model="formulario.idEdificio" 
            class="form-select"
            @change="formulario.idAula = undefined"
          >
            <option :value="undefined">Seleccionar edificio...</option>
            <option 
              v-for="edificio in edificios" 
              :key="edificio.idEdificio" 
              :value="edificio.idEdificio"
            >
              🏢 {{ edificio.codigo }} - {{ edificio.nombre }}
            </option>
          </select>
        </div>
        
        <div class="form-group" v-if="formulario.idEdificio">
          <label>Aulas Disponibles en este Edificio:</label>
          <div class="aulas-list">
            <div v-if="aulasFiltradas.length === 0" class="no-aulas">
              <p>⚠️ No hay aulas registradas en este edificio</p>
              <small>Crea aulas primero en la pestaña "Aulas"</small>
            </div>
            <div v-else class="aulas-grid">
              <label v-for="aula in aulasFiltradas" :key="aula.idAula" class="aula-option">
                <input 
                  type="radio" 
                  :value="aula.idAula" 
                  v-model="formulario.idAula"
                  :name="'aula-' + formulario.idEdificio"
                >
                <span class="aula-info">
                  <strong>{{ aula.codigo }}</strong> - {{ aula.nombre }}
                </span>
              </label>
            </div>
          </div>
          <small>Selecciona el aula principal del departamento</small>
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
import { ubicacionesService, type Departamento, type Edificio, type Aula } from '../api/ubicacionesAPI';

interface Props {
  mostrar: boolean;
  departamento?: Departamento | null;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const edificios = ref<Edificio[]>([]);
const aulas = ref<Aula[]>([]);
const formulario = ref({
  nombre: '',
  idEdificio: undefined as number | undefined,
  idAula: undefined as number | undefined
});

const esEdicion = computed(() => !!props.departamento);

const aulasFiltradas = computed(() => {
  if (!formulario.value.idEdificio) return [];
  return aulas.value.filter(aula => aula.idEdificio === formulario.value.idEdificio);
});

const cargarDatosSelects = async () => {
  try {
    const [resEdificios, resAulas] = await Promise.all([
      ubicacionesService.obtenerEdificios(),
      ubicacionesService.obtenerAulas()
    ]);
    edificios.value = resEdificios.data;
    aulas.value = resAulas.data;
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
};

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (props.departamento) {
      formulario.value = {
        nombre: props.departamento.nombre,
        idEdificio: props.departamento.idEdificio,
        idAula: props.departamento.idAula
      };
    } else {
      formulario.value = { nombre: '', idEdificio: undefined, idAula: undefined };
    }
  }
});

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formulario.value.nombre.trim()) {
    alert('Por favor ingresa el nombre del departamento');
    return;
  }

  cargando.value = true;
  try {
    if (esEdicion.value && props.departamento?.idDepartamento) {
      await ubicacionesService.actualizarDepartamento(
        props.departamento.idDepartamento,
        formulario.value
      );
    } else {
      await ubicacionesService.crearDepartamento(formulario.value);
    }
    
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el departamento';
    alert(mensajeError);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  cargarDatosSelects();
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

.aulas-list {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
}

.no-aulas {
  text-align: center;
  color: #6b7280;
  padding: 10px;
}

.aulas-grid {
  display: grid;
  gap: 8px;
}

.aula-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.aula-option:hover {
  background: #f3f4f6;
  border-color: #2563eb;
}

.aula-option input[type="radio"] {
  margin-right: 10px;
}

.aula-info {
  flex: 1;
}

.no-assignment {
  color: #9ca3af;
  font-style: italic;
}

.aula-asignada {
  background: #10b981;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  margin: 0 2px;
}
</style>