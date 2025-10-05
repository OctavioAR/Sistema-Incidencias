<!-- modules/configuration/componentes/ModalContrato.vue -->
<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ esEdicion ? '✏️ Editar Contrato' : '📝 Nuevo Contrato' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <!-- Información del Contrato -->
        <div class="form-section">
          <h4>Información del Contrato</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="numeroContrato">Número de Contrato *</label>
              <input 
                id="numeroContrato"
                v-model="formulario.numeroContrato" 
                type="text" 
                required 
                maxlength="100"
                placeholder="Ej: CTO-DELL-2023-001"
              >
            </div>
            
            <div class="form-group">
              <label for="proveedor">Proveedor *</label>
              <input 
                id="proveedor"
                v-model="formulario.proveedor" 
                type="text" 
                required 
                maxlength="100"
                placeholder="Ej: Dell México, Epson Service"
              >
            </div>
            
            <div class="form-group">
              <label for="idEquipo">Equipo *</label>
              <select 
                id="idEquipo"
                v-model="formulario.idEquipo" 
                required
                class="form-select"
              >
                <option value="">Seleccionar equipo...</option>
                <option 
                  v-for="equipo in equipos" 
                  :key="equipo.idEquipo" 
                  :value="equipo.idEquipo"
                >
                  {{ equipo.codigo }} - {{ equipo.nombre }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="estado">Estado del Contrato</label>
              <select 
                id="estado"
                v-model="formulario.estado" 
                class="form-select"
              >
                <option value="Vigente">Vigente</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Vencido">Vencido</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Información de Contacto -->
        <div class="form-section">
          <h4>Información de Contacto</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="contactoProveedor">Contacto del Proveedor</label>
              <input 
                id="contactoProveedor"
                v-model="formulario.contactoProveedor" 
                type="text" 
                maxlength="100"
                placeholder="Ej: Ing. Roberto Martínez"
              >
            </div>
            
            <div class="form-group">
              <label for="telefonoContacto">Teléfono de Contacto</label>
              <input 
                id="telefonoContacto"
                v-model="formulario.telefonoContacto" 
                type="tel" 
                maxlength="20"
                placeholder="Ej: 555-123-4567"
              >
            </div>
            
            <div class="form-group">
              <label for="emailContacto">Email de Contacto</label>
              <input 
                id="emailContacto"
                v-model="formulario.emailContacto" 
                type="email" 
                maxlength="100"
                placeholder="Ej: contacto@proveedor.com"
              >
            </div>
          </div>
        </div>

        <!-- Vigencia y Costo -->
        <div class="form-section">
          <h4>Vigencia y Costo</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="fechaInicio">Fecha de Inicio *</label>
              <input 
                id="fechaInicio"
                v-model="formulario.fechaInicio" 
                type="date" 
                required
              >
            </div>
            
            <div class="form-group">
              <label for="fechaFin">Fecha de Fin *</label>
              <input 
                id="fechaFin"
                v-model="formulario.fechaFin" 
                type="date" 
                required
              >
              <small v-if="formulario.fechaInicio && formulario.fechaFin">
                Duración: {{ calcularDuracion() }}
              </small>
            </div>
            
            <div class="form-group">
              <label for="costo">Costo ($) *</label>
              <input 
                id="costo"
                v-model="formulario.costo" 
                type="number" 
                step="0.01"
                min="0"
                required
                placeholder="0.00"
              >
            </div>
          </div>
        </div>

        <!-- Cobertura -->
        <div class="form-section">
          <h4>Cobertura del Contrato</h4>
          <div class="form-group">
            <label for="cobertura">Descripción de la Cobertura</label>
            <textarea 
              id="cobertura"
              v-model="formulario.cobertura" 
              rows="4"
              maxlength="500"
              placeholder="Describa los servicios incluidos en el contrato, garantías, condiciones, etc."
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.cobertura?.length || 0 }}/500 caracteres</small>
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
import { contratosService, type ContratoMantenimiento, type CrearContratoRequest } from '../api/contratosAPI';
import type { Equipo } from '../api/equiposAPI';

interface Props {
  mostrar: boolean;
  contrato?: ContratoMantenimiento | null;
  equipos: Equipo[];
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const formulario = ref<CrearContratoRequest>({
  idEquipo: 0,
  proveedor: '',
  numeroContrato: '',
  contactoProveedor: '',
  telefonoContacto: '',
  emailContacto: '',
  fechaInicio: '',
  fechaFin: '',
  costo: 0,
  cobertura: '',
  estado: 'Vigente'
});

const esEdicion = computed(() => !!props.contrato);

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (props.contrato) {
      // Modo edición
      formulario.value = {
        idEquipo: props.contrato.idEquipo,
        proveedor: props.contrato.proveedor,
        numeroContrato: props.contrato.numeroContrato,
        contactoProveedor: props.contrato.contactoProveedor || '',
        telefonoContacto: props.contrato.telefonoContacto || '',
        emailContacto: props.contrato.emailContacto || '',
        fechaInicio: props.contrato.fechaInicio ? formatDateForInput(props.contrato.fechaInicio) : '',
        fechaFin: props.contrato.fechaFin ? formatDateForInput(props.contrato.fechaFin) : '',
        costo: props.contrato.costo,
        cobertura: props.contrato.cobertura || '',
        estado: props.contrato.estado || 'Vigente'
      };
    } else {
      // Modo creación
      formulario.value = {
        idEquipo: 0,
        proveedor: '',
        numeroContrato: '',
        contactoProveedor: '',
        telefonoContacto: '',
        emailContacto: '',
        fechaInicio: '',
        fechaFin: '',
        costo: 0,
        cobertura: '',
        estado: 'Vigente'
      };
    }
  }
});

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const calcularDuracion = () => {
  if (!formulario.value.fechaInicio || !formulario.value.fechaFin) return '';
  
  const inicio = new Date(formulario.value.fechaInicio);
  const fin = new Date(formulario.value.fechaFin);
  const diffTime = Math.abs(fin.getTime() - inicio.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} días`;
  } else if (diffDays < 365) {
    const meses = Math.floor(diffDays / 30);
    return `${meses} mes${meses > 1 ? 'es' : ''}`;
  } else {
    const años = Math.floor(diffDays / 365);
    const mesesRestantes = Math.floor((diffDays % 365) / 30);
    return `${años} año${años > 1 ? 's' : ''}${mesesRestantes > 0 ? ` y ${mesesRestantes} mes${mesesRestantes > 1 ? 'es' : ''}` : ''}`;
  }
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!validarFormulario()) return;

  cargando.value = true;
  try {
    if (esEdicion.value && props.contrato?.idContrato) {
      await contratosService.actualizarContrato(props.contrato.idContrato, formulario.value);
    } else {
      await contratosService.crearContrato(formulario.value);
    }
    
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el contrato';
    alert(mensajeError);
  } finally {
    cargando.value = false;
  }
};

const validarFormulario = () => {
  if (!formulario.value.numeroContrato.trim()) {
    alert('Por favor ingresa el número de contrato');
    return false;
  }
  
  if (!formulario.value.proveedor.trim()) {
    alert('Por favor ingresa el nombre del proveedor');
    return false;
  }
  
  if (!formulario.value.idEquipo) {
    alert('Por favor selecciona un equipo');
    return false;
  }
  
  if (!formulario.value.fechaInicio || !formulario.value.fechaFin) {
    alert('Por favor ingresa las fechas de inicio y fin');
    return false;
  }
  
  const inicio = new Date(formulario.value.fechaInicio);
  const fin = new Date(formulario.value.fechaFin);
  
  if (fin <= inicio) {
    alert('La fecha de fin debe ser posterior a la fecha de inicio');
    return false;
  }
  
  if (!formulario.value.costo || formulario.value.costo <= 0) {
    alert('Por favor ingresa un costo válido');
    return false;
  }
  
  return true;
};
</script>

<style scoped>
/* Reutilizar los mismos estilos del ModalSoftware */
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