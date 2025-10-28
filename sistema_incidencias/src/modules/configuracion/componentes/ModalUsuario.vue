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
                <option value="0">Seleccionar tipo...</option>
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
                :required="requiereDepartamento"
                class="form-select"
                :disabled="!puedeSeleccionarDepartamento"
              >
                <option :value="null">Seleccionar departamento...</option>
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

        <!-- ESPECIALIDADES - Solo para técnicos -->
        <div class="form-section" v-if="esTecnico">
          <h4>🎯 Especialidades del Técnico</h4>
          <p class="section-description">Selecciona las áreas en las que este técnico tiene experiencia</p>
          
          <div class="especialidades-grid">
            <div v-for="especialidad in especialidades" 
                 :key="especialidad.idEspecialidad" 
                 class="especialidad-item">
              <label class="especialidad-checkbox">
                <input 
                  type="checkbox"
                  :value="especialidad.idEspecialidad"
                  v-model="formulario.especialidadesSeleccionadas"
                  @change="onEspecialidadChange(especialidad.idEspecialidad, ($event.target as HTMLInputElement).checked)"
                >
                <span class="checkmark"></span>
                <div class="especialidad-info">
                  <strong>{{ especialidad.nombre }}</strong>
                  <span class="especialidad-desc">{{ especialidad.descripcion }}</span>
                </div>
              </label>
              
              <!-- Nivel de expertise - Solo visible si la especialidad está seleccionada -->
              <div v-if="formulario.especialidadesSeleccionadas.includes(especialidad.idEspecialidad)" 
                   class="nivel-expertise">
                <label>Nivel de expertise:</label>
                <select 
                  v-model="formulario.nivelesExpertise[especialidad.idEspecialidad]"
                  class="form-select small"
                >
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Resumen de especialidades seleccionadas -->
          <div v-if="formulario.especialidadesSeleccionadas.length > 0" class="resumen-especialidades">
            <h5>Especialidades Seleccionadas:</h5>
            <div class="especialidades-tags">
              <span v-for="espId in formulario.especialidadesSeleccionadas" 
                    :key="espId" 
                    class="especialidad-tag">
                {{ getNombreEspecialidad(espId) }} 
                <small>({{ formulario.nivelesExpertise[espId] }})</small>
                <button type="button" 
                        @click="removerEspecialidad(espId)" 
                        class="btn-remover">×</button>
              </span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando || !formularioValido" class="btn-primary">
            {{ cargando ? 'Guardando...' : (esEdicion ? '💾 Actualizar Usuario' : '➕ Crear Usuario') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { usuariosService, type UsuarioCompleto, type CrearUsuarioRequest } from '../api/usuariosAPI';
import { especialidadesService } from '../api/especialidadesAPI';
import type { Departamento } from '../api/ubicacionesAPI';

interface Props {
  mostrar: boolean;
  usuario: UsuarioCompleto | null;
  tiposUsuario: Array<{ idTipoUsuario: number; nombre: string }>;
  departamentos: Array<{ idDepartamento: number; nombre: string }>;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const especialidades = ref<any[]>([]);
const especialidadesExistentes = ref<any[]>([]);

const formulario = ref({
  nombre: '',
  apellidoPat: '',
  apellidoMat: '',
  email: '',
  idTipoUsuario: 0,
  idDepartamento: null as number | null,
  password: '',
  especialidadesSeleccionadas: [] as number[],
  nivelesExpertise: {} as { [key: number]: string }
});

// Computed properties
const esEdicion = computed(() => !!props.usuario);

const esTecnico = computed(() => {
  if (!formulario.value.idTipoUsuario) return false;
  const tipo = (props.tiposUsuario || []).find(t => t.idTipoUsuario === formulario.value.idTipoUsuario);
  return tipo?.nombre === 'Técnico';
});

const formularioValido = computed(() => {
  const baseValido = !!formulario.value.nombre.trim() && 
                    !!formulario.value.apellidoPat.trim() && 
                    !!formulario.value.email.trim() && 
                    formulario.value.idTipoUsuario > 0;
  
  if (!props.usuario) {
    return baseValido && formulario.value.password.length >= 6;
  }
  
  return baseValido;
});

// Computed helpers para template (evitan errores si props indefinidos)
const tiposUsuarioFiltrados = computed(() => props.tiposUsuario || []);
const departamentosDisponibles = computed(() => props.departamentos || []);
const requiereDepartamento = computed(() => true); // Ajusta según reglas de negocio
const puedeSeleccionarDepartamento = computed(() => true); // Si hay lógica de permisos, reemplazar aquí
const esJefeDepartamento = computed(() => false); // Si necesitas detectar rol del usuario actual, reemplazar aquí

// Watchers
watch(() => props.mostrar, async (nuevoValor) => {
  if (nuevoValor) {
    await cargarEspecialidades();
    if (props.usuario) {
      // Modo edición - cargar datos existentes
      await llenarFormularioEdicion();
    } else {
      // Modo nuevo - resetear formulario
      resetearFormulario();
    }
  }
});

// Métodos
const cargarEspecialidades = async () => {
  try {
    const response = await especialidadesService.obtenerEspecialidades();
    especialidades.value = response.data;
  } catch (error) {
    console.error('Error al cargar especialidades:', error);
  }
};

const cargarEspecialidadesUsuario = async (idUsuario: number) => {
  try {
    const response = await especialidadesService.obtenerEspecialidadesPorUsuario(idUsuario);
    especialidadesExistentes.value = response.data;
  } catch (error) {
    console.error('Error al cargar especialidades del usuario:', error);
  }
};

const llenarFormularioEdicion = async () => {
  if (!props.usuario) return;
  
  formulario.value = {
    nombre: props.usuario.nombre || '',
    apellidoPat: props.usuario.apellidoPat || '',
    apellidoMat: props.usuario.apellidoMat || '',
    email: props.usuario.email || '',
    idTipoUsuario: props.usuario.idTipoUsuario || 0,
    idDepartamento: props.usuario.idDepartamento ?? null,
    password: '', // No mostrar contraseña existente
    especialidadesSeleccionadas: [],
    nivelesExpertise: {}
  };

  // Cargar especialidades existentes del usuario
  if (props.usuario.idUsuario !== undefined) {
    await cargarEspecialidadesUsuario(props.usuario.idUsuario);
  }
  
  // Llenar especialidades seleccionadas y niveles
  especialidadesExistentes.value.forEach(esp => {
    formulario.value.especialidadesSeleccionadas.push(esp.idEspecialidad);
    formulario.value.nivelesExpertise[esp.idEspecialidad] = esp.nivel_expertise;
  });
};

const resetearFormulario = () => {
  formulario.value = {
    nombre: '',
    apellidoPat: '',
    apellidoMat: '',
    email: '',
    idTipoUsuario: 0,
    idDepartamento: null,
    password: '',
    especialidadesSeleccionadas: [],
    nivelesExpertise: {}
  };
};

const onTipoUsuarioChange = () => {
  // Si cambia de técnico a otro tipo, limpiar especialidades
  if (!esTecnico.value) {
    formulario.value.especialidadesSeleccionadas = [];
    formulario.value.nivelesExpertise = {};
  }
};

const onEspecialidadChange = (idEspecialidad: number, seleccionada: boolean) => {
  if (seleccionada && !formulario.value.nivelesExpertise[idEspecialidad]) {
    // Asignar nivel por defecto
    formulario.value.nivelesExpertise[idEspecialidad] = 'intermedio';
  } else if (!seleccionada) {
    // Remover nivel si se deselecciona
    delete formulario.value.nivelesExpertise[idEspecialidad];
  }
};

const removerEspecialidad = (idEspecialidad: number) => {
  formulario.value.especialidadesSeleccionadas = 
    formulario.value.especialidadesSeleccionadas.filter(id => id !== idEspecialidad);
  delete formulario.value.nivelesExpertise[idEspecialidad];
};

const getNombreEspecialidad = (idEspecialidad: number) => {
  const especialidad = especialidades.value.find(e => e.idEspecialidad === idEspecialidad);
  return especialidad?.nombre || 'Desconocida';
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formularioValido.value) return;

  cargando.value = true;
  try {
    if (props.usuario) {
      // Actualizar usuario existente
      await usuariosService.actualizarUsuario(props.usuario.idUsuario!, {
        nombre: formulario.value.nombre,
        apellidoPat: formulario.value.apellidoPat,
        apellidoMat: formulario.value.apellidoMat,
        email: formulario.value.email,
        idTipoUsuario: formulario.value.idTipoUsuario,
        idDepartamento: formulario.value.idDepartamento || undefined,
        activo: props.usuario.activo ?? true
      });

      // Actualizar especialidades solo si es técnico
      if (esTecnico.value) {
        await especialidadesService.actualizarEspecialidadesUsuario(
          props.usuario.idUsuario!,
          formulario.value.especialidadesSeleccionadas.map(id => ({
            idEspecialidad: id,
            nivel_expertise: formulario.value.nivelesExpertise[id]
          }))
        );
      }

      alert('✅ Usuario actualizado correctamente');
    } else {
      // Crear nuevo usuario
      const nuevoUsuario = await usuariosService.crearUsuario({
        nombre: formulario.value.nombre,
        apellidoPat: formulario.value.apellidoPat,
        apellidoMat: formulario.value.apellidoMat,
        email: formulario.value.email,
        password: formulario.value.password,
        idTipoUsuario: formulario.value.idTipoUsuario,
        idDepartamento: formulario.value.idDepartamento
      } as CrearUsuarioRequest);

      // Agregar especialidades si es técnico
      if (esTecnico.value && formulario.value.especialidadesSeleccionadas.length > 0) {
        await especialidadesService.agregarEspecialidadesUsuario(
          nuevoUsuario.data.id,
          formulario.value.especialidadesSeleccionadas.map(id => ({
            idEspecialidad: id,
            nivel_expertise: formulario.value.nivelesExpertise[id]
          }))
        );
      }

      alert('✅ Usuario creado correctamente');
    }

    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al guardar el usuario';
    alert('❌ ' + mensajeError);
    console.error('Error al guardar usuario:', error);
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