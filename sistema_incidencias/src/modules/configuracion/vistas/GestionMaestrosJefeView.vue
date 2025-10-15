<template>
  <div class="gestion-maestros-jefe">
    <div class="header">
      <h1>Gestión de Maestros - {{ departamentoActual?.nombre }}</h1>
      <div class="header-actions">
        <button @click="mostrarModalUsuario" class="btn-primary">
          ➕ Nuevo Maestro
        </button>
      </div>
    </div>

    <div class="filtros">
      <div class="filtro-group">
        <input 
          type="text" 
          v-model="terminoBusqueda" 
          placeholder="Buscar por nombre o email..."
          @input="aplicarFiltros"
          class="busqueda-input"
        >
      </div>
    </div>

    <div v-if="cargando" class="loading">Cargando maestros...</div>
    <div v-else-if="maestrosFiltrados.length === 0" class="no-data">
      <p v-if="terminoBusqueda">No se encontraron maestros que coincidan con la búsqueda</p>
      <p v-else>No hay maestros registrados en este departamento</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Fecha Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="maestro in maestrosFiltrados" :key="maestro.idUsuario"
              :class="{ 'inactive': !maestro.activo }">
            <td>
              <strong>{{ maestro.nombre }} {{ maestro.apellidoPat }} {{ maestro.apellidoMat || '' }}</strong>
            </td>
            <td>{{ maestro.email }}</td>
    <td>
              <span class="estado" :class="maestro.activo ? 'activo' : 'inactivo'">
                {{ maestro.activo ? '✅ Activo' : '❌ Inactivo' }}
              </span>
            </td>
            <td>{{ formatFecha(maestro.fecha_creacion) }}</td>
            <td class="actions">
              <button @click="editarMaestro(maestro)" class="btn-edit" title="Editar">✏️</button>
              <button @click="cambiarEstadoMaestro(maestro)" 
                      :class="maestro.activo ? 'btn-warning' : 'btn-success'"
                      :title="maestro.activo ? 'Desactivar' : 'Activar'">
                {{ maestro.activo ? '⏸️' : '▶️' }}
              </button>
              <button @click="cambiarPassword(maestro)" class="btn-info" title="Cambiar contraseña">🔑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalUsuario 
      :mostrar="modalUsuario.mostrar"
      :usuario="modalUsuario.usuario"
      :tiposUsuario="tiposUsuario"
      :departamentos="departamentosDisponibles"
      @cerrar="modalUsuario.mostrar = false"
      @guardado="handleGuardado"
    />

    <ModalPassword 
      :mostrar="modalPassword.mostrar"
      :usuario="modalPassword.usuario"
      v-if="modalPassword.usuario"
      @cerrar="modalPassword.mostrar = false"
      @guardado="handlePasswordCambiada"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usuariosService, type UsuarioCompleto } from '../api/usuariosAPI';
import { ubicacionesService, type Departamento } from '../api/ubicacionesAPI';
import ModalUsuario from '../../configuracion/componentes/ModalUsuario.vue';
import ModalPassword from '../../configuracion/componentes/ModalPassword.vue';

const cargando = ref(false);
const maestros = ref<UsuarioCompleto[]>([]);
const departamentoActual = ref<Departamento | null>(null);
const terminoBusqueda = ref('');

const modalUsuario = ref({
  mostrar: false,
  usuario: null as UsuarioCompleto | null
});

const modalPassword = ref({
  mostrar: false,
  usuario: null as UsuarioCompleto | null 
});

const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

// Solo maestros pueden ser gestionados por el Jefe de Departamento
const tiposUsuario = [
  { idTipoUsuario: 4, nombre: 'Maestro' }
];

const departamentosDisponibles = computed(() => {
  // El Jefe de Departamento solo puede asignar maestros a su propio departamento
  return departamentoActual.value ? [departamentoActual.value] : [];
});

const maestrosFiltrados = computed(() => {
  let filtered = maestros.value;

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(m => 
      m.nombre.toLowerCase().includes(searchTerm) ||
      m.apellidoPat.toLowerCase().includes(searchTerm) ||
      m.email.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

const formatFecha = (fecha: string | undefined) => {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString('es-MX');
  } catch (error) {
    return 'Fecha inválida';
  }
};

const cargarDatos = async () => {
  cargando.value = true;
  try {
    // Cargar información del departamento del jefe actual
    if (usuarioActual.value.idDepartamento) {
      const resDepartamentos = await ubicacionesService.obtenerDepartamentos();
      departamentoActual.value = resDepartamentos.data.find(
        (d: Departamento) => d.idDepartamento === usuarioActual.value.idDepartamento
      ) || null;
    }

    // Cargar maestros del departamento
    const resUsuarios = await usuariosService.obtenerUsuarios();
    maestros.value = resUsuarios.data.filter((usuario: UsuarioCompleto) => 
      usuario.idTipoUsuario === 4 && // Solo maestros
      usuario.idDepartamento === usuarioActual.value.idDepartamento // Solo del mismo departamento
    );
  } catch (error) {
    console.error('Error al cargar datos:', error);
    alert('Error al cargar los datos. Verifica la conexión con el servidor.');
  } finally {
    cargando.value = false;
  }
};

const aplicarFiltros = () => {
  // Los filtros se aplican automáticamente mediante computed properties
};

const mostrarModalUsuario = () => {
  modalUsuario.value = {
    mostrar: true,
    usuario: null
  };
};

const editarMaestro = (maestro: UsuarioCompleto) => {
  modalUsuario.value = {
    mostrar: true,
    usuario: maestro
  };
};

const cambiarEstadoMaestro = async (maestro: UsuarioCompleto) => {
  const nuevoEstado = !maestro.activo;
  const confirmacion = confirm(
    `¿Estás seguro de ${nuevoEstado ? 'activar' : 'desactivar'} al maestro ${maestro.nombre}?`
  );
  
  if (!confirmacion) return;
  
  try {
    await usuariosService.cambiarEstado(maestro.idUsuario!, nuevoEstado);
    await cargarDatos();
    alert(`Maestro ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al cambiar estado';
    alert('Error: ' + mensajeError);
  }
};

const cambiarPassword = (maestro: UsuarioCompleto) => {
  if (!maestro.idUsuario) {
    alert('Error: Maestro no válido');
    return;
  }
  
  modalPassword.value = {
    mostrar: true,
    usuario: maestro
  };
};

const handleGuardado = () => {
  cargarDatos();
};

const handlePasswordCambiada = () => {
  alert('Contraseña cambiada correctamente');
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.gestion-maestros-jefe {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filtros {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  align-items: end;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.busqueda-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 300px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.data-table tbody tr.inactive {
  opacity: 0.6;
  background: #fef2f2;
}

.estado.activo {
  color: #15803d;
  font-weight: 500;
}

.estado.inactivo {
  color: #dc2626;
  font-weight: 500;
}

.actions {
  white-space: nowrap;
  text-align: center;
}

.btn-edit, .btn-warning, .btn-success, .btn-info {
  border: none;
  padding: 6px 10px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-edit {
  background: #f59e0b;
  color: black;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-warning {
  background: #fbbf24;
  color: black;
}

.btn-warning:hover {
  background: #f59e0b;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-info:hover {
  background: #2563eb;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .filtros {
    flex-direction: column;
    gap: 10px;
  }
  
  .busqueda-input {
    min-width: 100%;
  }
  
  .data-table {
    font-size: 14px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
  }
}
</style>