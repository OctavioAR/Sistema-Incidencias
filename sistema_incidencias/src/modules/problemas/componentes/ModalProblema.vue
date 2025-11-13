<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3>{{ problema ? 'Editar Problema' : 'Nuevo Problema' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <!-- Información básica -->
        <div class="form-section">
          <h4>Información Básica</h4>
          <div class="form-group">
            <label for="titulo">Título del Problema *</label>
            <input 
              id="titulo"
              v-model="formulario.titulo" 
              type="text" 
              required 
              maxlength="255"
              placeholder="Ej: Lentitud recurrente en Laboratorio LP"
              class="form-input"
            >
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="idEstadoProblema">Estado *</label>
              <select 
                id="idEstadoProblema"
                v-model="formulario.idEstadoProblema" 
                required
                class="form-select"
              >
                <option value="">Seleccionar estado...</option>
                <option v-for="estado in estadosProblema" :key="estado.idEstadoProblema" :value="estado.idEstadoProblema">
                  {{ estado.nombre }}
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
                <option value="baja">🟢 Baja</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🟠 Alta</option>
                <option value="critica">🔴 Crítica</option>
              </select>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="idCategoriaProblema">Categoría</label>
              <select 
                id="idCategoriaProblema"
                v-model="formulario.idCategoriaProblema" 
                class="form-select"
              >
                <option value="">Seleccionar categoría...</option>
                <option v-for="categoria in categoriasProblema" :key="categoria.idCategoriaProblema" :value="categoria.idCategoriaProblema">
                  {{ categoria.nombre }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="idTecnicoAsignado">Técnico Asignado</label>
              <select 
                id="idTecnicoAsignado"
                v-model="formulario.idTecnicoAsignado" 
                class="form-select"
              >
                <option value="">Sin asignar</option>
                <option v-for="tecnico in tecnicos" :key="tecnico.idUsuario" :value="tecnico.idUsuario">
                  {{ tecnico.nombre }} {{ tecnico.apellidoPat }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Descripción del problema -->
        <div class="form-section">
          <h4>Descripción del Problema</h4>
          <div class="form-group">
            <label for="descripcion">Descripción Detallada *</label>
            <textarea 
              id="descripcion"
              v-model="formulario.descripcion" 
              required
              rows="4"
              maxlength="2000"
              placeholder="Describe el problema, patrones observados, equipos afectados, frecuencia..."
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.descripcion.length }}/2000 caracteres</small>
          </div>
        </div>

        <!-- Causa raíz y solución -->
        <div class="form-section">
          <h4>Análisis y Solución</h4>
          <div class="form-group">
            <label for="causa_raiz">Causa Raíz Identificada</label>
            <textarea 
              id="causa_raiz"
              v-model="formulario.causa_raiz" 
              rows="3"
              maxlength="1000"
              placeholder="¿Cuál es la causa subyacente del problema?"
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.causa_raiz?.length || 0 }}/1000 caracteres</small>
          </div>
          
          <div class="form-group">
            <label for="solucion_permanente">Solución Permanente Propuesta</label>
            <textarea 
              id="solucion_permanente"
              v-model="formulario.solucion_permanente" 
              rows="3"
              maxlength="1000"
              placeholder="¿Cuál es la solución definitiva para prevenir recurrencias?"
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.solucion_permanente?.length || 0 }}/1000 caracteres</small>
          </div>
        </div>

        <!-- Impacto y fechas -->
        <div class="form-section">
          <h4>Impacto y Seguimiento</h4>
          <div class="form-group">
            <label for="impacto">Impacto del Problema</label>
            <textarea 
              id="impacto"
              v-model="formulario.impacto" 
              rows="2"
              maxlength="500"
              placeholder="¿Qué áreas/personas/equipos afecta? ¿Cuál es el impacto en operaciones?"
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.impacto?.length || 0 }}/500 caracteres</small>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="fecha_vencimiento">Fecha Límite</label>
              <input 
                id="fecha_vencimiento"
                v-model="formulario.fecha_vencimiento" 
                type="date"
                class="form-input"
              >
            </div>
            
            <div class="form-group" v-if="problema && problema.fecha_cierre">
              <label>Fecha de Cierre</label>
              <input 
                :value="formatFecha(problema.fecha_cierre)" 
                type="text"
                class="form-input"
                disabled
              >
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando || !formularioValido" class="btn-primary">
            {{ cargando ? 'Guardando...' : (problema ? '💾 Actualizar Problema' : '📝 Crear Problema') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { problemaService, type Problema, type EstadoProblema, type CategoriaProblema } from '../api/ProblemaAPI';

interface Props {
  mostrar: boolean;
  problema: Problema | null;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const estadosProblema = ref<EstadoProblema[]>([]);
const categoriasProblema = ref<CategoriaProblema[]>([]);
const tecnicos = ref<any[]>([]);
const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

const formulario = ref({
  titulo: '',
  descripcion: '',
  causa_raiz: '',
  solucion_permanente: '',
  idEstadoProblema: 1, // Por defecto: Nuevo
  idUsuarioReporta: 0,
  idTecnicoAsignado: undefined as number | undefined,
  idCategoriaProblema: undefined as number | undefined,
  prioridad: 'media' as 'baja' | 'media' | 'alta' | 'critica',
  impacto: '',
  fecha_vencimiento: ''
});

const formularioValido = computed(() => {
  return formulario.value.titulo.trim() &&
         formulario.value.descripcion.trim() &&
         formulario.value.idEstadoProblema > 0;
});

// Cargar datos auxiliares
const cargarDatosAuxiliares = async () => {
  try {
    const [estadosResponse, categoriasResponse, tecnicosResponse] = await Promise.all([
      problemaService.obtenerEstadosProblema(),
      problemaService.obtenerCategoriasProblema(),
      fetch('http://localhost:3001/tecnicos').then(r => r.json())
    ]);

    estadosProblema.value = estadosResponse.data;
    categoriasProblema.value = categoriasResponse.data;
    tecnicos.value = tecnicosResponse;
  } catch (error) {
    console.error('Error al cargar datos auxiliares:', error);
  }
};

watch([() => props.mostrar, () => props.problema], async () => {
  if (props.mostrar) {
    await cargarDatosAuxiliares();
    
    if (props.problema) {
      // Modo edición
      Object.assign(formulario.value, props.problema);
    } else {
      // Modo creación
      resetearFormulario();
    }
  }
});

const resetearFormulario = () => {
  formulario.value = {
    titulo: '',
    descripcion: '',
    causa_raiz: '',
    solucion_permanente: '',
    idEstadoProblema: 1,
    idUsuarioReporta: usuarioActual.value.idUsuario,
    idTecnicoAsignado: undefined,
    idCategoriaProblema: undefined,
    prioridad: 'media',
    impacto: '',
    fecha_vencimiento: ''
  };
};

const formatFecha = (fecha: string | undefined) => {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString('es-MX');
  } catch (error) {
    return 'Fecha inválida';
  }
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formularioValido.value) return;

  cargando.value = true;
  try {
    // Asegurar que el usuario reporta esté asignado
    const datosParaEnviar = {
      ...formulario.value,
      idUsuarioReporta: usuarioActual.value.idUsuario
    };

    if (props.problema) {
      // Actualizar problema existente
      await problemaService.actualizarProblema(props.problema.idProblema!, datosParaEnviar);
      alert('✅ Problema actualizado correctamente');
    } else {
      // Crear nuevo problema
      await problemaService.crearProblema(datosParaEnviar);
      alert('✅ Problema creado correctamente');
    }

    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el problema';
    alert('❌ ' + mensajeError);
    console.error('Error al guardar problema:', error);
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
/* Reutilizar estilos de otros modales */
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

.form-input, .form-select, .form-textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary, .btn-primary {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}
</style>