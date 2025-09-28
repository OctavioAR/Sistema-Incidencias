<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ esEdicion ? 'Editar Software' : 'Nuevo Software' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="form-section">           
          <!-- Informacion basica -->
          <h4>Información Básica</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="nombre">Nombre del Software *</label>
              <input 
                id="nombre"
                v-model="formulario.nombre" 
                type="text" 
                required 
                maxlength="100"
                placeholder="Ej: Microsoft Office, Adobe Photoshop"
              >
            </div>
            
            <div class="form-group">
              <label for="version">Versión</label>
              <input 
                id="version"
                v-model="formulario.version" 
                type="text" 
                maxlength="50"
                placeholder="Ej: 2021, CC 2023, 3.11"
              >
            </div>
            
            <div class="form-group">
              <label for="fabricante">Fabricante</label>
              <input 
                id="fabricante"
                v-model="formulario.fabricante" 
                type="text" 
                maxlength="100"
                placeholder="Ej: Microsoft, Adobe, Google"
              >
            </div>
          </div>
        </div>

        <!-- Gestion de Licencias -->
        <div class="form-section">
          <h4>Gestión de Licencias</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="tipoLicencia">Tipo de Licencia</label>
              <select 
                id="tipoLicencia"
                v-model="formulario.tipoLicencia" 
                class="form-select"
              >
                <option value="">Seleccionar tipo...</option>
                <option value="Libre">Libre</option>
                <option value="Comercial">Comercial</option>
                <option value="Educativa">Educativa</option>
                <option value="Prueba">Prueba</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="fechaExpiracionLicencia">Fecha de Expiración de Licencia</label>
              <input 
                id="fechaExpiracionLicencia"
                v-model="formulario.fechaExpiracionLicencia" 
                type="date" 
              >
              <small v-if="formulario.fechaExpiracionLicencia">
                Licencia expira: {{ formatFecha(formulario.fechaExpiracionLicencia) }}
              </small>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="formulario.requiereActivacion" 
                  class="checkbox"
                  :true-value="1"
                  :false-value="0"
                >
                <span>¿Requiere activación?</span>
              </label>
              <small>Marcar si el software necesita clave de activación</small>
            </div>
          </div>
        </div>

        <!-- Informacion Adicional -->
        <div class="form-section">
          <h4>Información Adicional</h4>
          <div class="form-group">
            <label for="comentarios">Comentarios</label>
            <textarea 
              id="comentarios"
              v-model="formulario.comentarios" 
              rows="3"
              maxlength="500"
              placeholder="Información adicional sobre el software, requisitos, observaciones..."
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.comentarios?.length || 0 }}/500 caracteres</small>
          </div>
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
import { softwareService, type Software } from '../api/softwareAPI';

interface Props {
  mostrar: boolean;
  software?: Software | null;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const formulario = ref<Omit<Software, 'idSoftware' | 'fecha_creacion'>>({
  nombre: '',
  version: '',
  fabricante: '',
  tipoLicencia: undefined,
  fechaExpiracionLicencia: '',
  requiereActivacion: 0,
  comentarios: ''
});

const esEdicion = computed(() => !!props.software);

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (props.software) {
      formulario.value = {
        nombre: props.software.nombre,
        version: props.software.version || '',
        fabricante: props.software.fabricante || '',
        tipoLicencia: props.software.tipoLicencia,
        fechaExpiracionLicencia: props.software.fechaExpiracionLicencia 
          ? formatDateForInput(props.software.fechaExpiracionLicencia) 
          : '',
        requiereActivacion: props.software.requiereActivacion || 0,
        comentarios: props.software.comentarios || ''
      };
    } else {
      formulario.value = {
        nombre: '',
        version: '',
        fabricante: '',
        tipoLicencia: undefined,
        fechaExpiracionLicencia: '',
        requiereActivacion: 0,
        comentarios: ''
      };
    }
  }
});

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formulario.value.nombre.trim()) {
    alert('Por favor ingresa el nombre del software');
    return;
  }

  cargando.value = true;
  try {
    if (esEdicion.value && props.software?.idSoftware) {
      await softwareService.actualizarSoftware(props.software.idSoftware, formulario.value);
    } else {
      await softwareService.crearSoftware(formulario.value);
    }
    
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el software';
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
  max-width: 600px;
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
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-group input,
.form-select,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-select:focus,
.form-textarea:focus {
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

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: normal;
  margin-bottom: 5px;
}

.checkbox {
  margin-right: 10px;
  width: 18px;
  height: 18px;
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