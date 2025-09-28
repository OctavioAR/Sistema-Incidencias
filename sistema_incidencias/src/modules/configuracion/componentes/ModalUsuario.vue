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
          </div>
        </div>

        <div class="form-section">
          <h4>Información de Cuenta</h4>
          <div class="form-grid">
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
              <small v-if="!esEdicion">La contraseña se asignará al usuario</small>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4>Configuración del Usuario</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="idTipoUsuario">Tipo de Usuario *</label>
              <select 
                id="idTipoUsuario"
                v-model="formulario.idTipoUsuario" 
                required
                class="form-select"
              >
                <option value="">Seleccionar tipo...</option>
                <option 
                  v-for="tipo in tiposUsuario" 
                  :key="tipo.idTipoUsuario" 
                  :value="tipo.idTipoUsuario"
                >
                  {{ tipo.nombre }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="idDepartamento">Departamento</label>
              <select 
                id="idDepartamento"
                v-model="formulario.idDepartamento" 
                class="form-select"
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
              <small>Opcional: Asignar a un departamento específico</small>
            </div>
          </div>
        </div>

        <div class="form-section" v-if="esEdicion">
          <h4>Estado del Usuario</h4>
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="formulario.activo"
                class="checkbox"
              >
              <span class="checkmark"></span>
              Usuario activo (puede iniciar sesión)
            </label>
            <small>Desmarcar para desactivar temporalmente al usuario</small>
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
import { usuariosService, type UsuarioCompleto, type CrearUsuarioRequest, type ActualizarUsuarioRequest } from '../api/usuariosAPI';
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
const formulario = ref({
  nombre: '',
  apellidoPat: '',
  apellidoMat: '',
  email: '',
  password: 'password123',
  idTipoUsuario: 0,
  idDepartamento: undefined as number | undefined,
  activo: true
});

const esEdicion = computed(() => !!props.usuario);

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    if (props.usuario) {
      formulario.value = {
        nombre: props.usuario.nombre,
        apellidoPat: props.usuario.apellidoPat,
        apellidoMat: props.usuario.apellidoMat || '',
        email: props.usuario.email,
        password: '',
        idTipoUsuario: props.usuario.idTipoUsuario,
        idDepartamento: props.usuario.idDepartamento,
        activo: props.usuario.activo
      };
    } else {
      formulario.value = { 
        nombre: '', 
        apellidoPat: '', 
        apellidoMat: '', 
        email: '', 
        password: 'password123', 
        idTipoUsuario: 0, 
        idDepartamento: undefined, 
        activo: true 
      };
    }
  }
});

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formulario.value.nombre.trim() || 
      !formulario.value.apellidoPat.trim() || 
      !formulario.value.email.trim() || 
      formulario.value.idTipoUsuario === 0) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }

  if (!esEdicion.value && !formulario.value.password) {
    alert('La contraseña es obligatoria para nuevos usuarios');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formulario.value.email)) {
    alert('Por favor ingresa un email válido');
    return;
  }

  cargando.value = true;
  try {
    if (esEdicion.value && props.usuario?.idUsuario) {
      const datosActualizacion: ActualizarUsuarioRequest = {
        nombre: formulario.value.nombre,
        apellidoPat: formulario.value.apellidoPat,
        apellidoMat: formulario.value.apellidoMat || '',
        email: formulario.value.email,
        idTipoUsuario: formulario.value.idTipoUsuario,
        idDepartamento: formulario.value.idDepartamento,
        activo: formulario.value.activo
      };
      
      await usuariosService.actualizarUsuario(props.usuario.idUsuario, datosActualizacion);
    } else {
      const datosCreacion: CrearUsuarioRequest = {
        nombre: formulario.value.nombre,
        apellidoPat: formulario.value.apellidoPat,
        apellidoMat: formulario.value.apellidoMat || '',
        email: formulario.value.email,
        password: formulario.value.password,
        idTipoUsuario: formulario.value.idTipoUsuario,
        idDepartamento: formulario.value.idDepartamento
      };
      
      await usuariosService.crearUsuario(datosCreacion);
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