<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ esEdicion ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="form-section">
          <h4>Información Personal</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="nombre">Nombre *</label>
              <input 
                id="nombre"
                v-model="formulario.nombre" 
                type="text" 
                required 
                maxlength="100"
                placeholder="Ej: Juan"
              >
            </div>
            
            <div class="form-group">
              <label for="apellidoPat">Apellido Paterno *</label>
              <input 
                id="apellidoPat"
                v-model="formulario.apellidoPat" 
                type="text" 
                required 
                maxlength="100"
                placeholder="Ej: Pérez"
              >
            </div>
            
            <div class="form-group">
              <label for="apellidoMat">Apellido Materno</label>
              <input 
                id="apellidoMat"
                v-model="formulario.apellidoMat" 
                type="text" 
                maxlength="100"
                placeholder="Ej: Gómez"
              >
            </div>
            
            <div class="form-group">
              <label for="email">Email *</label>
              <input 
                id="email"
                v-model="formulario.email" 
                type="email" 
                required 
                maxlength="255"
                placeholder="Ej: juan.perez@universidad.edu"
              >
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4>Información de Rol y Departamento</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="idTipoUsuario">Tipo de Usuario *</label>
              <select 
                id="idTipoUsuario"
                v-model="formulario.idTipoUsuario" 
                required
                class="form-select"
                @change="onTipoUsuarioChange"
              >
                <option value="">Seleccionar tipo...</option>
                <option 
                  v-for="tipo in tiposUsuarioFiltrados" 
                  :key="tipo.idTipoUsuario" 
                  :value="tipo.idTipoUsuario"
                >
                  {{ tipo.nombre }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="idDepartamento">Departamento *</label>
              <select 
                id="idDepartamento"
                v-model="formulario.idDepartamento" 
                :required="!!requiereDepartamento"
                class="form-select"
                :disabled="!puedeSeleccionarDepartamento"
              >
                <option value="">Seleccionar departamento...</option>
                <option 
                  v-for="depto in departamentosDisponibles" 
                  :key="depto.idDepartamento" 
                  :value="depto.idDepartamento"
                >
                  {{ depto.nombre }}
                </option>
              </select>
              <small v-if="!puedeSeleccionarDepartamento">
                El Jefe de Taller puede asignar cualquier departamento
              </small>
              <small v-else-if="esJefeDepartamento">
                Será responsable de este departamento
              </small>
            </div>
            
            <div class="form-group" v-if="!esEdicion">
              <label for="password">Contraseña *</label>
              <input 
                id="password"
                v-model="formulario.password" 
                type="password" 
                :required="!esEdicion"
                minlength="6"
                placeholder="Mínimo 6 caracteres"
              >
              <small>La contraseña debe tener al menos 6 caracteres</small>
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
import { usuariosService, type UsuarioCompleto, type CrearUsuarioRequest } from '../api/usuariosAPI';
import type { Departamento } from '../api/ubicacionesAPI';

interface Props {
  mostrar: boolean;
  usuario?: UsuarioCompleto | null;
  tiposUsuario: Array<{ idTipoUsuario: number; nombre: string }>;
  departamentos: Departamento[];
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

const formulario = ref({
  nombre: '',
  apellidoPat: '',
  apellidoMat: '',
  email: '',
  idTipoUsuario: undefined as number | undefined,
  idDepartamento: undefined as number | undefined,
  password: ''
});

const esEdicion = computed(() => !!props.usuario);

// Computed properties para la lógica de permisos
const esJefeTaller = computed(() => {
  return usuarioActual.value.tipo_usuario_nombre === 'Jefe de Taller';
});

const esJefeDepartamento = computed(() => {
  return formulario.value.idTipoUsuario === 5; // ID del Jefe de Departamento
});

const requiereDepartamento = computed(() => {
  // Jefes de Departamento y Maestros requieren departamento
  const tiposConDepartamento = [4, 5]; // Maestro y Jefe de Departamento
  return formulario.value.idTipoUsuario && tiposConDepartamento.includes(formulario.value.idTipoUsuario);
});

const puedeSeleccionarDepartamento = computed(() => {
  // Solo Jefe de Taller puede seleccionar departamento libremente
  // Jefes de Departamento solo pueden ser asignados a su propio departamento
  return esJefeTaller.value;
});

const tiposUsuarioFiltrados = computed(() => {
  // Jefe de Taller puede crear cualquier tipo de usuario
  if (esJefeTaller.value) {
    return props.tiposUsuario;
  }
  
  // Jefe de Departamento solo puede crear Maestros
  if (usuarioActual.value.tipo_usuario_nombre === 'Jefe de Departamento') {
    return props.tiposUsuario.filter(tipo => tipo.nombre === 'Maestro');
  }
  
  return [];
});

const departamentosDisponibles = computed(() => {
  // Jefe de Taller ve todos los departamentos
  if (esJefeTaller.value) {
    return props.departamentos;
  }
  
  // Jefe de Departamento solo ve su propio departamento
  if (usuarioActual.value.tipo_usuario_nombre === 'Jefe de Departamento') {
    return props.departamentos.filter(depto => depto.idDepartamento === usuarioActual.value.idDepartamento);
  }
  
  return [];
});

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (props.usuario) {
      formulario.value = {
        nombre: props.usuario.nombre,
        apellidoPat: props.usuario.apellidoPat,
        apellidoMat: props.usuario.apellidoMat || '',
        email: props.usuario.email,
        idTipoUsuario: props.usuario.idTipoUsuario,
        idDepartamento: props.usuario.idDepartamento,
        password: '' // No mostramos la contraseña en edición
      };
    } else {
      formulario.value = {
        nombre: '',
        apellidoPat: '',
        apellidoMat: '',
        email: '',
        idTipoUsuario: undefined,
        idDepartamento: undefined,
        password: ''
      };
      
      // Si es Jefe de Departamento, asignar automáticamente su departamento
      if (usuarioActual.value.tipo_usuario_nombre === 'Jefe de Departamento') {
        formulario.value.idDepartamento = usuarioActual.value.idDepartamento;
      }
    }
  }
});

const onTipoUsuarioChange = () => {
  // Limpiar departamento si el nuevo tipo no lo requiere
  if (!requiereDepartamento.value) {
    formulario.value.idDepartamento = undefined;
  }
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!validarFormulario()) return;

  cargando.value = true;
  try {
    if (esEdicion.value && props.usuario?.idUsuario) {
      const { password, ...resto } = formulario.value;
      const datosActualizacion = {
        ...resto,
        activo: props.usuario.activo, // Asegura que el campo 'activo' esté presente
        idTipoUsuario: formulario.value.idTipoUsuario ?? 0,
        idDepartamento: formulario.value.idDepartamento ?? 0
      };
      await usuariosService.actualizarUsuario(props.usuario.idUsuario, datosActualizacion);
    } else {
      await usuariosService.crearUsuario(formulario.value as CrearUsuarioRequest);
    }
    
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el usuario';
    alert(mensajeError);
  } finally {
    cargando.value = false;
  }
};

const validarFormulario = (): boolean => {
  if (!formulario.value.nombre.trim() || 
      !formulario.value.apellidoPat.trim() || 
      !formulario.value.email.trim() || 
      !formulario.value.idTipoUsuario) {
    alert('Por favor completa todos los campos obligatorios');
    return false;
  }

  if (!esEdicion.value && !formulario.value.password) {
    alert('Por favor ingresa una contraseña');
    return false;
  }

  if (requiereDepartamento.value && !formulario.value.idDepartamento) {
    alert('Este tipo de usuario requiere un departamento');
    return false;
  }

  return true;
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