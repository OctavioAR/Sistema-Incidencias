<template>
  <div class="gestion-usuarios">
    <div class="header">
      <h1>Gestión de Usuarios</h1>
    </div>
    
    <div v-if="tienePermisos" class="permisos-info">
      <p>✅ Tienes permisos para gestionar usuarios del sistema</p>
    </div>
    <div v-else class="permisos-info no-permisos">
      <p>❌ Solo el Jefe de Taller y Jefe de Departamento puede gestionar usuarios</p>
    </div>

    <div class="filtros" v-if="tienePermisos">
      <div class="filtro-group">
        <label for="filtroTipo">Filtrar por tipo:</label>
        <select id="filtroTipo" v-model="filtroTipo" @change="aplicarFiltros">
          <option value="">Todos los tipos</option>
          <option v-for="tipo in tiposUsuario" :key="tipo.idTipoUsuario" :value="tipo.idTipoUsuario">
            {{ tipo.nombre }}
          </option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label for="filtroEstado">Filtrar por estado:</label>
        <select id="filtroEstado" v-model="filtroEstado" @change="aplicarFiltros">
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <input 
          type="text" 
          v-model="terminoBusqueda" 
          placeholder="Buscar por nombre o email..."
          @input="aplicarFiltros"
          class="busqueda-input"
        >
      </div>

      <button v-if="tienePermisos" @click="mostrarModalUsuario" class="btn-primary btn-nuevo-usuario">
        ➕ Nuevo Usuario
      </button>
    </div>

    <!-- Tabla de usuarios -->
    <div v-if="cargando" class="loading">Cargando usuarios...</div>
    <div v-else-if="usuariosFiltrados.length === 0" class="no-data">
      <p v-if="tienePermisos">No hay usuarios registrados</p>
      <p v-else>No tienes permisos para ver la lista de usuarios</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Email</th>
            <th>Tipo de Usuario</th>
            <th>Departamento</th>
            <th>Estado</th>
            <th>Fecha Registro</th>
            <th v-if="tienePermisos">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usuario in usuariosFiltrados" :key="usuario.idUsuario" 
              :class="{ 'inactive': !usuario.activo }">
            <td>
              <strong>{{ usuario.nombre }} {{ usuario.apellidoPat }} {{ usuario.apellidoMat || '' }}</strong>
            </td>
            <td>{{ usuario.email }}</td>
            <td>
              <span class="badge" :class="getBadgeClass(usuario.tipo_usuario_nombre)">
                {{ usuario.tipo_usuario_nombre }}
              </span>
            </td>
            <td>{{ usuario.departamento_nombre || 'Sin asignar' }}</td>
            <td>
              <span class="estado" :class="usuario.activo ? 'activo' : 'inactivo'">
                {{ usuario.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>{{ formatFecha(usuario.fecha_creacion) }}</td>
            <td v-if="tienePermisos" class="actions">
              <button @click="editarUsuario(usuario)" class="btn-edit" title="Editar">✏️</button>
              <button @click="cambiarEstadoUsuario(usuario)" 
                      :class="usuario.activo ? 'btn-warning' : 'btn-success'"
                      :title="usuario.activo ? 'Desactivar' : 'Activar'">
                {{ usuario.activo ? '⏸️' : '▶️' }}
              </button>
              <button @click="cambiarPassword(usuario)" class="btn-info" title="Cambiar contraseña">🔑</button>
              <button @click="eliminarUsuarioPermanente(usuario)" 
                      class="btn-delete" 
                      title="Eliminar permanentemente"
                      :disabled="esUsuarioActual(usuario)">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de usuario -->
    <ModalUsuario 
      :mostrar="modalUsuario.mostrar"
      :usuario="modalUsuario.usuario"
      :tiposUsuario="tiposUsuario"
      :departamentos="departamentos"
      @cerrar="modalUsuario.mostrar = false"
      @guardado="handleGuardado"
    />

    <!-- Modal de cambio de contraseña -->
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
const usuarios = ref<UsuarioCompleto[]>([]);
const departamentos = ref<Departamento[]>([]);

const filtroTipo = ref('');
const filtroEstado = ref('');
const terminoBusqueda = ref('');

const modalUsuario = ref({
  mostrar: false,
  usuario: null as UsuarioCompleto | null
});

const modalPassword = ref({
  mostrar: false,
  usuario: null as UsuarioCompleto | null 
});

const tiposUsuario = [
  { idTipoUsuario: 2, nombre: 'Jefe de Taller' },
  { idTipoUsuario: 3, nombre: 'Técnico' },
  { idTipoUsuario: 4, nombre: 'Maestro' },
  { idTipoUsuario: 5, nombre: 'Jefe de Departamento'}
];

const tienePermisos = computed(() => {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) return false;
  const usuario = JSON.parse(usuarioStr);
  return usuario.tipo_usuario_nombre === 'Jefe de Taller'||
    usuario.tipo_usuario_nombre === 'Jefe de Departamento';
});

const usuariosFiltrados = computed(() => {
  let filtered = usuarios.value;

  if (filtroTipo.value) {
    filtered = filtered.filter(u => u.idTipoUsuario === Number(filtroTipo.value));
  }

  if (filtroEstado.value === 'activo') {
    filtered = filtered.filter(u => u.activo);
  } else if (filtroEstado.value === 'inactivo') {
    filtered = filtered.filter(u => !u.activo);
  }

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(u => 
      u.nombre.toLowerCase().includes(searchTerm) ||
      u.apellidoPat.toLowerCase().includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

const getBadgeClass = (tipo: string | undefined) => {
  switch (tipo) {
    case 'Jefe de Taller': return 'badge-jefe';
    case 'Técnico': return 'badge-tecnico';
    case 'Maestro': return 'badge-maestro';
    default: return 'badge-default';
  }
};

const formatFecha = (fecha: string | undefined) => {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString('es-MX');
  } catch (error) {
    return 'Fecha inválida';
  }
};

const cargarDatos = async () => {
  if (!tienePermisos.value) return;
  
  cargando.value = true;
  try {
    const [resUsuarios, resDepartamentos] = await Promise.all([
      usuariosService.obtenerUsuarios(),
      ubicacionesService.obtenerDepartamentos()
    ]);
    
    usuarios.value = resUsuarios.data;
    departamentos.value = resDepartamentos.data;
  } catch (error) {
    console.error('Error al cargar datos:', error);
    alert('Error al cargar los datos. Verifica la conexión con el servidor.');
  } finally {
    cargando.value = false;
  }
};

const aplicarFiltros = () => {
  
};

const mostrarModalUsuario = () => {
  modalUsuario.value = {
    mostrar: true,
    usuario: null
  };
};

const editarUsuario = (usuario: UsuarioCompleto) => {
  modalUsuario.value = {
    mostrar: true,
    usuario: usuario
  };
};

const cambiarEstadoUsuario = async (usuario: UsuarioCompleto) => {
  const nuevoEstado = !usuario.activo;
  const confirmacion = confirm(
    `¿Estás seguro de ${nuevoEstado ? 'activar' : 'desactivar'} al usuario ${usuario.nombre}?`
  );
  
  if (!confirmacion) return;
  
  try {
    await usuariosService.cambiarEstado(usuario.idUsuario!, nuevoEstado);
    await cargarDatos();
    alert(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al cambiar estado';
    alert('Error: ' + mensajeError);
  }
};

const cambiarPassword = (usuario: UsuarioCompleto) => {
  if (!usuario.idUsuario) {
    alert('Error: Usuario no válido');
    return;
  }
  
  modalPassword.value = {
    mostrar: true,
    usuario: usuario
  };
};

const handleGuardado = () => {
  cargarDatos();
};

const handlePasswordCambiada = () => {
  alert('Contraseña cambiada correctamente');
};

const esUsuarioActual = (usuario: UsuarioCompleto) => {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) return false;
  const usuarioActual = JSON.parse(usuarioStr);
  return usuarioActual.idUsuario === usuario.idUsuario;
};

const eliminarUsuarioPermanente = async (usuario: UsuarioCompleto) => {
  if (!usuario.idUsuario) return;
  
  if (esUsuarioActual(usuario)) {
    alert('No puedes eliminarte a ti mismo');
    return;
  }

  const confirmacion1 = confirm(
    `¿ESTÁS ABSOLUTAMENTE SEGURO de que quieres ELIMINAR PERMANENTEMENTE a este usuario?\n\n` +
    `. ESTA ACCIÓN NO SE PUEDE DESHACER\n` +
    `. Se borrarán TODOS los datos del usuario de la base de datos\n` +
    `. El usuario no podrá recuperarse\n\n` +
    `Usuario: ${usuario.nombre} ${usuario.apellidoPat}\n` +
    `Email: ${usuario.email}\n` +
    `Tipo: ${usuario.tipo_usuario_nombre}\n\n` +
    `¿Continuar con la eliminación permanente?`
  );
  
  if (!confirmacion1) return;

  try {
    await usuariosService.eliminarUsuarioPermanente(usuario.idUsuario);
    await cargarDatos();
    alert('Usuario eliminado permanentemente de la base de datos');
  } catch (error: any) {
    if (
      error?.response?.data?.error?.includes('foreign key constraint fails') ||
      error?.code === 'ER_ROW_IS_REFERENCED_2' ||
      error?.errno === 1451
    ) {
      alert('No se puede eliminar este usuario porque tiene incidencias asociadas. Elimina o reasigna esas incidencias antes de eliminar el usuario.');
      return;
    }
    const mensajeError = error.response?.data?.error || 'Error al eliminar usuario';
    alert('Error al eliminar: ' + mensajeError);
  }
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.gestion-usuarios {
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

.permisos-info {
  padding: 12px;
  margin: 15px 0;
  border-radius: 6px;
  background: #e8f5e8;
  border: 1px solid #c6f6c6;
}

.permisos-info.no-permisos {
  background: #ffe8e8;
  border: 1px solid #fecaca;
}

.filtros {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap;
  align-items: end;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filtro-group label {
  font-weight: 500;
  font-size: 14px;
}

.filtro-group select,
.busqueda-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.busqueda-input {
  min-width: 250px;
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

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-jefe {
  background: #fef3c7;
  color: #d97706;
}

.badge-tecnico {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-maestro {
  background: #f0fdf4;
  color: #15803d;
}

.badge-default {
  background: #f3f4f6;
  color: #6b7280;
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
  background: #fbbf24;
  color: #000;
}

.btn-edit:hover {
  background: #f59e0b;
}

.btn-warning {
  background: #fef3c7;
  color: #d97706;
}

.btn-warning:hover {
  background: #fde68a;
}

.btn-success {
  background: #d1fae5;
  color: #065f46;
}

.btn-primary{
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-nuevo-usuario {
  align-self: flex-end;
  margin-left: auto;
  margin-bottom: 8px;
}

.btn-success:hover {
  background: #a7f3d0;
}

.btn-info {
  background: #dbeafe;
  color: #1e40af;
}

.btn-info:hover {
  background: #bfdbfe;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.btn-delete {
  background: #dc2626;
  color: white;
  border: none;
  padding: 6px 10px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-delete:hover:not(:disabled) {
  background: #b91c1c;
  transform: scale(1.1);
}

.btn-delete:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-edit {
  background: #f59e0b;
  color: black;
}

.btn-warning {
  background: #fbbf24;
  color: black;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.actions {
  white-space: nowrap;
  text-align: center;
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
  
  .data-table {
    font-size: 14px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
  }
}
</style>