<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ esEdicion ? 'Editar Equipo' : 'Nuevo Equipo' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <!-- Información Básica -->
        <div class="form-section">
          <h4>Información Básica</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="codigo">Código del Equipo *</label>
              <input 
                id="codigo"
                v-model="formulario.codigo" 
                type="text" 
                required 
                maxlength="20"
                placeholder="Ej: EAA01C001"
              >
              <small>Código único para identificar el equipo</small>
            </div>
            
            <div class="form-group">
              <label for="nombre">Nombre del Equipo *</label>
              <input 
                id="nombre"
                v-model="formulario.nombre" 
                type="text" 
                required 
                maxlength="100"
                placeholder="Ej: Computadora Profesor Aula 01"
              >
            </div>
            
            <div class="form-group">
              <label for="idTipoEquipo">Tipo de Equipo *</label>
              <select 
                id="idTipoEquipo"
                v-model="formulario.idTipoEquipo" 
                required
                class="form-select"
              >
                <option value="">Seleccionar tipo...</option>
                <option 
                  v-for="tipo in tiposEquipo" 
                  :key="tipo.idTipoEquipo" 
                  :value="tipo.idTipoEquipo"
                >
                  {{ tipo.nombre }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="estado">Estado del Equipo</label>
              <select 
                id="estado"
                v-model="formulario.estado" 
                class="form-select"
              >
                <option value="activo">Activo</option>
                <option value="mantenimiento">En mantenimiento</option>
                <option value="en_stock">En stock</option>
                <option value="baja">De baja</option>
                <option value="obsoleto">Obsoleto</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Especificaciones Técnicas -->
        <div class="form-section">
          <h4>Especificaciones Técnicas</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="marca">Marca</label>
              <input 
                id="marca"
                v-model="formulario.marca" 
                type="text" 
                maxlength="100"
                placeholder="Ej: Dell, HP, Lenovo"
              >
            </div>
            
            <div class="form-group">
              <label for="modelo">Modelo</label>
              <input 
                id="modelo"
                v-model="formulario.modelo" 
                type="text" 
                maxlength="100"
                placeholder="Ej: OptiPlex 3090, EliteBook 840"
              >
            </div>
            
            <div class="form-group">
              <label for="noSerie">Número de Serie</label>
              <input 
                id="noSerie"
                v-model="formulario.noSerie" 
                type="text" 
                maxlength="100"
                placeholder="Número de serie del equipo"
              >
            </div>
            
            <div class="form-group">
              <label for="sistemaOperativo">Sistema Operativo</label>
              <input 
                id="sistemaOperativo"
                v-model="formulario.sistemaOperativo" 
                type="text" 
                maxlength="100"
                placeholder="Ej: Windows 10, Windows 11, Linux"
              >
            </div>
            
            <div class="form-group">
              <label for="procesador">Procesador</label>
              <input 
                id="procesador"
                v-model="formulario.procesador" 
                type="text" 
                maxlength="100"
                placeholder="Ej: Intel i5-10500, AMD Ryzen 5"
              >
            </div>
            
            <div class="form-group">
              <label for="ram_gb">Memoria RAM (GB)</label>
              <input 
                id="ram_gb"
                v-model="formulario.ram_gb" 
                type="number" 
                min="0"
                max="512"
                placeholder="Ej: 8, 16, 32"
              >
            </div>
            
            <div class="form-group">
              <label for="almacenamiento_gb">Almacenamiento (GB)</label>
              <input 
                id="almacenamiento_gb"
                v-model="formulario.almacenamiento_gb" 
                type="number" 
                min="0"
                placeholder="Ej: 256, 512, 1000"
              >
            </div>
          </div>
        </div>

        <!-- Información de Red -->
        <div class="form-section">
          <h4>Información de Red</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="direccion_ip">Dirección IP</label>
              <input 
                id="direccion_ip"
                v-model="formulario.direccion_ip" 
                type="text" 
                maxlength="15"
                placeholder="Ej: 192.168.1.10"
              >
            </div>
            
            <div class="form-group">
              <label for="direccion_mac">Dirección MAC</label>
              <input 
                id="direccion_mac"
                v-model="formulario.direccion_mac" 
                type="text" 
                maxlength="17"
                placeholder="Ej: 00:1A:2B:3C:4D:10"
              >
            </div>
          </div>
        </div>

        <!-- Ubicación y Responsable -->
        <div class="form-section">
          <h4>Ubicación y Responsable</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="idDepartamento">Departamento</label>
              <select 
                id="idDepartamento"
                v-model="formulario.idDepartamento" 
                class="form-select"
                @change="formulario.idAula = undefined"
              >
                <option :value="undefined">Seleccionar departamento...</option>
                <option 
                  v-for="depto in departamentos" 
                  :key="depto.idDepartamento" 
                  :value="depto.idDepartamento"
                >
                  {{ depto.nombre }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="idAula">Aula</label>
              <select 
                id="idAula"
                v-model="formulario.idAula" 
                class="form-select"
              >
                <option :value="undefined">Seleccionar aula...</option>
                <option 
                  v-for="aula in aulasFiltradas" 
                  :key="aula.idAula" 
                  :value="aula.idAula"
                >
                  {{ aula.codigo }} - {{ aula.nombre }}
                </option>
              </select>
              <small v-if="formulario.idDepartamento && aulasFiltradas.length === 0">
                No hay aulas en este departamento
              </small>
            </div>
            
            <div class="form-group">
              <label for="idResponsable">Responsable</label>
              <select 
                id="idResponsable"
                v-model="formulario.idResponsable" 
                class="form-select"
              >
                <option :value="undefined">Seleccionar responsable...</option>
                <option 
                  v-for="usuario in usuarios" 
                  :key="usuario.idUsuario" 
                  :value="usuario.idUsuario"
                >
                  {{ usuario.nombre }} {{ usuario.apellidoPat }} ({{ usuario.tipo_usuario_nombre }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Información de Garantía -->
        <div class="form-section">
          <h4>Información de Garantía</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="fechaCompra">Fecha de Compra</label>
              <input 
                id="fechaCompra"
                v-model="formulario.fechaCompra" 
                type="date" 
              >
            </div>
            
            <div class="form-group">
              <label for="expiracionGarantia">Vencimiento de Garantía</label>
              <input 
                id="expiracionGarantia"
                v-model="formulario.expiracionGarantia" 
                type="date" 
              >
            </div>
            
            <div class="form-group" v-if="esEdicion">
              <label for="fechaUltimoMantenimiento">Último Mantenimiento</label>
              <input 
                id="fechaUltimoMantenimiento"
                v-model="formulario.fechaUltimoMantenimiento" 
                type="date" 
              >
            </div>
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
import { equiposService, type Equipo, type CrearEquipoRequest, type ActualizarEquipoRequest } from '../api/equiposAPI';
import type { Departamento, Aula } from '../api/ubicacionesAPI';
import type { UsuarioCompleto } from '../api/usuariosAPI';

interface Props {
  mostrar: boolean;
  equipo?: Equipo | null;
  tiposEquipo: Array<{ idTipoEquipo: number; nombre: string }>;
  departamentos: Departamento[];
  aulas: Aula[];
  usuarios: UsuarioCompleto[];
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const formulario = ref<ActualizarEquipoRequest>({
  codigo: '',
  nombre: '',
  marca: '',
  modelo: '',
  noSerie: '',
  idTipoEquipo: undefined,
  sistemaOperativo: '',
  procesador: '',
  ram_gb: undefined,
  almacenamiento_gb: undefined,
  direccion_ip: '',
  direccion_mac: '',
  fechaCompra: '',
  expiracionGarantia: '',
  idDepartamento: undefined,
  idAula: undefined,
  idResponsable: undefined,
  estado: 'activo',
  fechaUltimoMantenimiento: '',
  fechaBaja: '',
});

const esEdicion = computed(() => !!props.equipo);

const aulasFiltradas = computed(() => {
  if (!formulario.value.idDepartamento) return props.aulas;
  return props.aulas.filter(aula => aula.idEdificio === formulario.value.idDepartamento);
});

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (props.equipo) {
      formulario.value = {
        codigo: props.equipo.codigo,
        nombre: props.equipo.nombre,
        marca: props.equipo.marca || '',
        modelo: props.equipo.modelo || '',
        noSerie: props.equipo.noSerie || '',
        idTipoEquipo: props.equipo.idTipoEquipo,
        sistemaOperativo: props.equipo.sistemaOperativo || '',
        procesador: props.equipo.procesador || '',
        ram_gb: props.equipo.ram_gb,
        almacenamiento_gb: props.equipo.almacenamiento_gb,
        direccion_ip: props.equipo.direccion_ip || '',
        direccion_mac: props.equipo.direccion_mac || '',
        fechaCompra: props.equipo.fechaCompra ? formatDateForInput(props.equipo.fechaCompra) : '',
        expiracionGarantia: props.equipo.expiracionGarantia ? formatDateForInput(props.equipo.expiracionGarantia) : '',
        idDepartamento: props.equipo.idDepartamento,
        idAula: props.equipo.idAula,
        idResponsable: props.equipo.idResponsable,
        estado: props.equipo.estado || 'activo',
        fechaUltimoMantenimiento: props.equipo.fechaUltimoMantenimiento ? formatDateForInput(props.equipo.fechaUltimoMantenimiento) : '',
        fechaBaja: props.equipo.fechaBaja ? formatDateForInput(props.equipo.fechaBaja) : ''
      };
    } else {
      formulario.value = {
        codigo: '',
        nombre: '',
        marca: '',
        modelo: '',
        noSerie: '',
        idTipoEquipo: undefined,
        sistemaOperativo: '',
        procesador: '',
        ram_gb: undefined,
        almacenamiento_gb: undefined,
        direccion_ip: '',
        direccion_mac: '',
        fechaCompra: '',
        expiracionGarantia: '',
        idDepartamento: undefined,
        idAula: undefined,
        idResponsable: undefined,
        estado: 'activo',
        fechaUltimoMantenimiento: '',
        fechaBaja: ''
      };
    }
  }
});

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formulario.value.codigo?.trim() || 
      !formulario.value.nombre?.trim() || !formulario.value.idTipoEquipo) {
    alert('Por favor completa los campos obligatorios: Código, Nombre y Tipo de Equipo');
    return;
  }

  if (formulario.value.direccion_ip && !isValidIP(formulario.value.direccion_ip)) {
    alert('Por favor ingresa una dirección IP válida');
    return;
  }

  if (formulario.value.direccion_mac && !isValidMAC(formulario.value.direccion_mac)) {
    alert('Por favor ingresa una dirección MAC válida (formato: 00:1A:2B:3C:4D:10)');
    return;
  }

  cargando.value = true;
  try {
    if (esEdicion.value && props.equipo?.idEquipo) {
      await equiposService.actualizarEquipo(props.equipo.idEquipo, formulario.value);
    } else {
      await equiposService.crearEquipo({
        ...formulario.value,
        idTipoEquipo: formulario.value.idTipoEquipo as number,
        codigo: formulario.value.codigo || '',
        nombre: formulario.value.nombre || '',
        marca: formulario.value.marca || '',
        modelo: formulario.value.modelo || '',
        noSerie: formulario.value.noSerie || '',
        sistemaOperativo: formulario.value.sistemaOperativo || '',
        procesador: formulario.value.procesador || '',
        direccion_ip: formulario.value.direccion_ip || '',
        direccion_mac: formulario.value.direccion_mac || '',
        fechaCompra: formulario.value.fechaCompra || '',
        expiracionGarantia: formulario.value.expiracionGarantia || '',
        estado: formulario.value.estado || 'activo'
      });
    }
    
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el equipo';
    alert(mensajeError);
  } finally {
    cargando.value = false;
  }
};

const isValidIP = (ip: string) => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipRegex.test(ip);
};

const isValidMAC = (mac: string) => {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
};
</script>

<style scoped>
/* Reutilizar estilos del ModalUsuario pero adaptar para más campos */
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
.form-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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

.modal-content {
  max-width: 900px;
  max-height: 90vh;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
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
.form-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-select:focus {
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
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>