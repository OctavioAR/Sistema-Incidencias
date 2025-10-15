<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Reportar Nueva Incidencia</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="form-section">
          <h4>Información de la Incidencia</h4>
          <div class="form-group">
            <label for="titulo">Título *</label>
            <input 
              id="titulo"
              v-model="formulario.titulo" 
              type="text" 
              required 
              maxlength="255"
              placeholder="Ej: Proyector no enciende, Computadora lenta..."
            >
          </div>
          
          <div class="form-group">
            <label for="descripcion">Descripción Detallada *</label>
            <textarea 
              id="descripcion"
              v-model="formulario.descripcion" 
              required
              rows="4"
              maxlength="1000"
              placeholder="Describe el problema con detalle: qué pasa, cuándo empezó, cómo se reproduce..."
            ></textarea>
            <small>{{ formulario.descripcion.length }}/1000 caracteres</small>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="idTipoIncidencia">Tipo de Incidencia *</label>
              <select 
                id="idTipoIncidencia"
                v-model="formulario.idTipoIncidencia" 
                required
                class="form-select"
              >
                <option value="">Seleccionar tipo...</option>
                <option 
                  v-for="tipo in tiposIncidencia" 
                  :key="tipo.idTipoIncidencia" 
                  :value="tipo.idTipoIncidencia"
                >
                  {{ tipo.nombre }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="prioridad">Prioridad *</label>
              <select 
                id="prioridad"
                v-model="formulario.prioridad" 
                required
                class="form-select"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4>Equipo y Ubicación</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="idEquipo">Equipo Afectado (Opcional)</label>
              <select 
                id="idEquipo"
                v-model="formulario.idEquipo" 
                class="form-select"
              >
                <option :value="null">No aplica / No sé</option>
                <option 
                  v-for="equipo in equiposDisponibles" 
                  :key="equipo.idEquipo" 
                  :value="equipo.idEquipo"
                >
                  {{ equipo.codigo }} - {{ equipo.nombre }}
                </option>
              </select>
              <small>Selecciona el equipo específico si aplica</small>
            </div>
            
            <div class="form-group">
              <label for="idDepartamento">Ubicación / Departamento</label>
              <select 
                id="idDepartamento"
                v-model="formulario.idDepartamento" 
                class="form-select"
              >
                <option :value="null">Seleccionar...</option>
                <option 
                  v-for="depto in departamentos" 
                  :key="depto.idDepartamento" 
                  :value="depto.idDepartamento"
                >
                  {{ depto.nombre }}
                </option>
              </select>
              <small>Donde ocurre el problema</small>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando || !formularioValido" class="btn-primary">
            {{ cargando ? 'Enviando...' : 'Reportar Incidencia' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { incidenciasService, type CrearIncidenciaRequest } from '../api/incidenciasAPI';
import type { Equipo } from '../../configuracion/api/equiposAPI';
import type { Departamento } from '../../configuracion/api/ubicacionesAPI';

interface Props {
  mostrar: boolean;
  equipos: Equipo[];
  departamentos: Departamento[];
  tiposIncidencia: Array<{ idTipoIncidencia: number; nombre: string }>;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

const formulario = ref<CrearIncidenciaRequest>({
  titulo: '',
  descripcion: '',
  idTipoIncidencia: 0,
  idEquipo: null,
  idDepartamento: null,
  prioridad: 'media'
});

const formularioValido = computed(() => {
  return (
    formulario.value.titulo.trim() &&
    formulario.value.descripcion.trim() &&
    formulario.value.idTipoIncidencia > 0
  );
});

const equiposDisponibles = computed(() => {
  return props.equipos.filter(equipo => 
    equipo.estado === 'activo' || equipo.estado === 'mantenimiento'
  );
});

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    // Si el usuario tiene departamento, asignarlo por defecto
    if (usuarioActual.value.idDepartamento) {
      formulario.value.idDepartamento = usuarioActual.value.idDepartamento;
    }
  } else {
    // Resetear formulario al cerrar
    formulario.value = {
      titulo: '',
      descripcion: '',
      idTipoIncidencia: 0,
      idEquipo: null,
      idDepartamento: usuarioActual.value.idDepartamento || null,
      prioridad: 'media'
    };
  }
});

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formularioValido.value) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }

  cargando.value = true;
  try {
    await incidenciasService.crearIncidencia(formulario.value);
    alert('Incidencia reportada correctamente');
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al reportar la incidencia';
    alert(' ' + mensajeError);
    console.error('Error al reportar incidencia:', error);
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
  max-width: 700px;
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
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}

.form-section h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-group input,
.form-select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
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
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>