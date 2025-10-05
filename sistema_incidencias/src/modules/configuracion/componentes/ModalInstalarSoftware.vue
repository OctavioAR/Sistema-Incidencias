<!-- modules/configuration/componentes/ModalInstalarSoftware.vue -->
<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Instalar Software en Equipo</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="info-equipo" v-if="equipo">
          <h4>Equipo: {{ equipo.nombre }}</h4>
          <p>Código: {{ equipo.codigo }}</p>
        </div>

        <div class="form-section">
          <h4>Seleccionar Software</h4>
          <div class="form-group">
            <label for="idSoftware">Software *</label>
            <select 
              id="idSoftware"
              v-model="formulario.idSoftware" 
              required
              class="form-select"
              @change="onSoftwareChange"
            >
              <option value="">Seleccionar software...</option>
              <option 
                v-for="soft in softwareDisponible" 
                :key="soft.idSoftware" 
                :value="soft.idSoftware"
              >
                {{ soft.nombre }} {{ soft.version ? `(${soft.version})` : '' }} - {{ soft.fabricante }}
              </option>
            </select>
          </div>

          <!-- Información del software seleccionado -->
          <div v-if="softwareSeleccionado" class="software-info">
            <div class="info-grid">
              <div class="info-item">
                <label>Tipo de Licencia:</label>
                <span class="badge" :class="getBadgeClass(softwareSeleccionado.tipoLicencia)">
                  {{ getTipoLicenciaTexto(softwareSeleccionado.tipoLicencia) }}
                </span>
              </div>
              <div class="info-item">
                <label>Requiere Activación:</label>
                <span>{{ softwareSeleccionado.requiereActivacion ? '✅ Sí' : '❌ No' }}</span>
              </div>
              <div v-if="softwareSeleccionado.fechaExpiracionLicencia" class="info-item">
                <label>Expiración Licencia:</label>
                <span :class="{ 'expirado': esLicenciaExpirada(softwareSeleccionado.fechaExpiracionLicencia) }">
                  {{ formatFecha(softwareSeleccionado.fechaExpiracionLicencia) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4>Detalles de la Instalación</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="fechaInstalacion">Fecha de Instalación *</label>
              <input 
                id="fechaInstalacion"
                v-model="formulario.fechaInstalacion" 
                type="date" 
                required
              >
            </div>
            
            <div class="form-group" v-if="softwareSeleccionado?.requiereActivacion">
              <label for="licenciaKey">Clave de Licencia</label>
              <input 
                id="licenciaKey"
                v-model="formulario.licenciaKey" 
                type="text" 
                maxlength="255"
                placeholder="Ingrese la clave de activación"
              >
            </div>
            
            <div class="form-group">
              <label for="usuarioInstalacion">Usuario que Instala *</label>
              <input 
                id="usuarioInstalacion"
                v-model="formulario.usuarioInstalacion" 
                type="text" 
                required
                maxlength="100"
                placeholder="Ej: Admin, Técnico Juan"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="comentarios">Comentarios de la Instalación</label>
            <textarea 
              id="comentarios"
              v-model="formulario.comentarios" 
              rows="3"
              maxlength="500"
              placeholder="Observaciones sobre la instalación, configuración, etc."
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.comentarios?.length || 0 }}/500 caracteres</small>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando" class="btn-primary">
            {{ cargando ? 'Instalando...' : 'Instalar Software' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { softwareService, type Software } from '../api/softwareAPI';
import type { Equipo } from '../api/equiposAPI';

interface Props {
  mostrar: boolean;
  equipo: Equipo | null;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const softwareDisponible = ref<Software[]>([]);
const softwareSeleccionado = ref<Software | null>(null);

const formulario = ref({
  idSoftware: 0,
  fechaInstalacion: new Date().toISOString().split('T')[0],
  licenciaKey: '',
  usuarioInstalacion: '',
  comentarios: ''
});

const equipoPuedeTenerSoftware = computed(() => {
  if (!props.equipo) return false;
  return props.equipo.tipo_equipo_nombre === 'Computadora';
});

watch(() => props.mostrar, async (nuevoValor) => {
  if (nuevoValor) {
    if (!equipoPuedeTenerSoftware.value) {
      alert('Este tipo de equipo no puede tener software instalado');
      cerrar();
      return;
    }
    
    await cargarSoftwareDisponible();
    resetFormulario();
  } else {
    softwareSeleccionado.value = null;
  }
});

const cargarSoftwareDisponible = async () => {
  try {
    const response = await softwareService.obtenerSoftware();
    softwareDisponible.value = response.data;
  } catch (error) {
    console.error('Error al cargar software disponible:', error);
    softwareDisponible.value = [];
  }
};

const onSoftwareChange = () => {
  const software = softwareDisponible.value.find(s => s.idSoftware === formulario.value.idSoftware);
  softwareSeleccionado.value = software || null;
};

const resetFormulario = () => {
  formulario.value = {
    idSoftware: 0,
    fechaInstalacion: new Date().toISOString().split('T')[0],
    licenciaKey: '',
    usuarioInstalacion: '',
    comentarios: ''
  };
  softwareSeleccionado.value = null;
};

const getBadgeClass = (tipoLicencia: string | undefined) => {
  switch (tipoLicencia) {
    case 'Libre': return 'badge-libre';
    case 'Comercial': return 'badge-comercial';
    case 'Educativa': return 'badge-educativa';
    case 'Prueba': return 'badge-prueba';
    default: return 'badge-default';
  }
};

const getTipoLicenciaTexto = (tipoLicencia: string | undefined) => {
  switch (tipoLicencia) {
    case 'Libre': return 'Libre';
    case 'Comercial': return 'Comercial';
    case 'Educativa': return 'Educativa';
    case 'Prueba': return 'Prueba';
    default: return 'No especificado';
  }
};

const esLicenciaExpirada = (fechaExpiracion: string) => {
  return new Date(fechaExpiracion) < new Date();
};

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES');
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!validarFormulario()) return;

  cargando.value = true;
  try {
    if (props.equipo?.idEquipo) {
      await softwareService.instalarSoftware(props.equipo.idEquipo, formulario.value);
      emit('guardado');
      cerrar();
    }
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al instalar el software';
    alert(mensajeError);
  } finally {
    cargando.value = false;
  }
};

const validarFormulario = () => {
  if (!formulario.value.idSoftware) {
    alert('Por favor selecciona un software');
    return false;
  }
  
  if (!formulario.value.fechaInstalacion) {
    alert('Por favor ingresa la fecha de instalación');
    return false;
  }
  
  if (!formulario.value.usuarioInstalacion.trim()) {
    alert('Por favor ingresa el usuario que realiza la instalación');
    return false;
  }
  
  if (softwareSeleccionado.value?.requiereActivacion && !formulario.value.licenciaKey.trim()) {
    const confirmar = confirm('Este software requiere activación pero no se ingresó una clave de licencia. ¿Deseas continuar?');
    if (!confirmar) return false;
  }
  
  return true;
};
</script>

<style scoped>
.info-equipo {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #bae6fd;
  margin-bottom: 20px;
}

.info-equipo h4 {
  margin: 0 0 5px 0;
  color: #0369a1;
}

.info-equipo p {
  margin: 0;
  color: #0c4a6e;
  font-size: 14px;
}

.software-info {
  background: #f8fafc;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-top: 15px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  color: #374151;
  font-size: 13px;
}

.expirado {
  color: #dc2626;
  font-weight: 500;
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
  margin-bottom: 15px;
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

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.badge-libre {
  background: #10b981;
}

.badge-comercial {
  background: #3b82f6;
}

.badge-educativa {
  background: #f59e0b;
}

.badge-prueba {
  background: #8b5cf6;
}

.badge-default {
  background: #6b7280;
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
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>