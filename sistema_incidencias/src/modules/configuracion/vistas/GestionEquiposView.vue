<template>
  <div class="gestion-equipos">
    <div class="header">
      <h1>Gestión de Equipos</h1>
    </div>

    <div v-if="tienePermisos" class="permisos-info">
      <p>✅ Tienes permisos para gestionar equipos del sistema</p>
    </div>
    <div v-else class="permisos-info no-permisos">
      <p>❌ Solo el Jefe de Taller o Jefe de Departamento puede gestionar equipos</p>
    </div>

    <div class="filtros" v-if="tienePermisos">
      <div class="filtro-group">
        <label for="filtroTipo">Filtrar por tipo:</label>
        <select id="filtroTipo" v-model="filtroTipo" @change="aplicarFiltros">
          <option value="">Todos los tipos</option>
          <option v-for="tipo in tiposEquipo" :key="tipo.idTipoEquipo" :value="tipo.idTipoEquipo">
            {{ tipo.nombre }}
          </option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label for="filtroEstado">Filtrar por estado:</label>
        <select id="filtroEstado" v-model="filtroEstado" @change="aplicarFiltros">
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="mantenimiento">En mantenimiento</option>
          <option value="baja">De baja</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <input 
          type="text" 
          v-model="terminoBusqueda" 
          placeholder="Buscar por nombre o código..."
          @input="aplicarFiltros"
          class="busqueda-input"
        >
      </div>
      
      <button v-if="tienePermisos" @click="mostrarModalEquipo" class="btn-primary btn-nuevo-usuario">
        ➕ Nuevo Equipo
      </button>
    </div>

    <div v-if="cargando" class="loading">Cargando equipos...</div>
    <div v-else-if="equiposFiltrados.length === 0" class="no-data">
      <p>No hay equipos registrados</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Marca/Modelo</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Responsable</th>
            <th v-if="tienePermisos">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="equipo in equiposFiltrados" 
              :key="equipo.idEquipo" 
              @click="verDetallesEquipo(equipo)"
              class="fila-clickeable">
            <td><strong>{{ equipo.codigo }}</strong></td>
            <td>{{ equipo.nombre }}</td>
            <td>
              <span class="badge" :class="getBadgeClass(equipo.tipo_equipo_nombre)">
                {{ equipo.tipo_equipo_nombre }}
              </span>
            </td>
            <td>{{ equipo.marca }} {{ equipo.modelo }}</td>
            <td>
              <span v-if="equipo.edificio_nombre && equipo.aula_nombre" class="ubicacion">
                {{ equipo.edificio_nombre }} / {{ equipo.aula_nombre }}
              </span>
              <span v-else class="no-assignment">Sin ubicación</span>
            </td>
            <td>
              <span class="estado" :class="equipo.estado">
                {{ getEstadoTexto(equipo.estado) }}
              </span>
            </td>
            <td>{{ equipo.responsable_nombre || 'No asignado' }}</td>
            <td v-if="tienePermisos" class="actions" @click.stop>
              <button 
                @click="instalarSoftware(equipo)" 
                class="btn-info" 
                :class="{ disabled: !puedeTenerSoftware(equipo) }"
                :disabled="!puedeTenerSoftware(equipo)"
                :title="puedeTenerSoftware(equipo) ? 'Instalar Software' : 'Este tipo de equipo no puede tener software instalado'">
                💾
              </button>
              <button @click="editarEquipo(equipo)" class="btn-edit" title="Editar">✏️</button>
              <button @click="eliminarEquipo(equipo)" class="btn-delete" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalEquipo 
      :mostrar="modalEquipo.mostrar"
      :equipo="modalEquipo.equipo"
      :tiposEquipo="tiposEquipo"
      :departamentos="departamentos"
      :aulas="aulas"
      :usuarios="usuarios"
      :edificios="edificios" 
      @cerrar="modalEquipo.mostrar = false"
      @guardado="handleGuardado"
    />

    <ModalInstalarSoftware 
      :mostrar="modalInstalarSoftware.mostrar"
      :equipo="modalInstalarSoftware.equipo"
      @cerrar="modalInstalarSoftware.mostrar = false"
      @guardado="handleGuardado"
    />

    <div v-if="modalDetalles.mostrar" class="modal-overlay" @click.self="cerrarDetalles">
      <div class="modal-content detalles-modal">
        <div class="modal-header">
          <h3>Detalles del Equipo</h3>
          <button @click="cerrarDetalles" class="btn-cerrar">×</button>
        </div>
        <div class="modal-body" v-if="modalDetalles.equipo">
          <div class="detalles-grid">
            <div class="detalle-item">
              <label>Código:</label>
              <span><strong>{{ modalDetalles.equipo.codigo }}</strong></span>
            </div>
            <div class="detalle-item">
              <label>Nombre:</label>
              <span>{{ modalDetalles.equipo.nombre }}</span>
            </div>
            <div class="detalle-item">
              <label>Tipo:</label>
              <span class="badge" :class="getBadgeClass(modalDetalles.equipo.tipo_equipo_nombre)">
                {{ modalDetalles.equipo.tipo_equipo_nombre }}
              </span>
            </div>
            <div class="detalle-item">
              <label>Estado:</label>
              <span class="estado" :class="modalDetalles.equipo.estado">
                {{ getEstadoTexto(modalDetalles.equipo.estado) }}
              </span>
            </div>
            
            <div class="detalle-item">
              <label>Marca:</label>
              <span>{{ modalDetalles.equipo.marca || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Modelo:</label>
              <span>{{ modalDetalles.equipo.modelo || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Número de Serie:</label>
              <span>{{ modalDetalles.equipo.noSerie || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Sistema Operativo:</label>
              <span>{{ modalDetalles.equipo.sistemaOperativo || 'N/A' }}</span>
            </div>
            
            <div class="detalle-item">
              <label>Procesador:</label>
              <span>{{ modalDetalles.equipo.procesador || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Memoria RAM:</label>
              <span>{{ modalDetalles.equipo.ram_gb ? modalDetalles.equipo.ram_gb + ' GB' : 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Almacenamiento:</label>
              <span>{{ modalDetalles.equipo.almacenamiento_gb ? modalDetalles.equipo.almacenamiento_gb + ' GB' : 'N/A' }}</span>
            </div>
            
            <div class="detalle-item">
              <label>Dirección IP:</label>
              <span>{{ modalDetalles.equipo.direccion_ip || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Dirección MAC:</label>
              <span>{{ modalDetalles.equipo.direccion_mac || 'N/A' }}</span>
            </div>
            
            <div class="detalle-item">
              <label>Ubicación:</label>
              <span v-if="modalDetalles.equipo.edificio_nombre && modalDetalles.equipo.aula_nombre" class="ubicacion">
                {{ modalDetalles.equipo.edificio_nombre }} / {{ modalDetalles.equipo.aula_nombre }}
              </span>
              <span v-else class="no-assignment">Sin ubicación asignada</span>
            </div>
            <div class="detalle-item">
              <label>Departamento:</label>
              <span>{{ modalDetalles.equipo.departamento_nombre || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Responsable:</label>
              <span>{{ modalDetalles.equipo.responsable_nombre || 'No asignado' }}</span>
            </div>
            
            <div class="detalle-item">
              <label>Fecha de Compra:</label>
              <span>{{ modalDetalles.equipo.fechaCompra ? formatFecha(modalDetalles.equipo.fechaCompra) : 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Vencimiento Garantía:</label>
              <span :class="{ 'expirado': esGarantiaExpirada(modalDetalles.equipo.expiracionGarantia) }">
                {{ modalDetalles.equipo.expiracionGarantia ? formatFecha(modalDetalles.equipo.expiracionGarantia) : 'N/A' }}
                <span v-if="esGarantiaExpirada(modalDetalles.equipo.expiracionGarantia)" class="expirado-badge">
                  Expirada
                </span>
              </span>
            </div>
            <div class="detalle-item">
              <label>Último Mantenimiento:</label>
              <span>{{ modalDetalles.equipo.fechaUltimoMantenimiento ? formatFecha(modalDetalles.equipo.fechaUltimoMantenimiento) : 'Nunca' }}</span>
            </div>
            <div class="detalle-item">
              <label>Fecha de Baja:</label>
              <span>{{ modalDetalles.equipo.fechaBaja ? formatFecha(modalDetalles.equipo.fechaBaja) : 'N/A' }}</span>
            </div>
          </div>

          <div class="software-section" v-if="softwareEquipo.length > 0">
            <h4>Software Instalado ({{ softwareEquipo.length }})</h4>
            <div class="software-list">
              <div v-for="item in softwareEquipo" :key="item.idEquipoSoftware" class="software-item">
                <div class="software-info">
                  <strong>{{ item.nombre }}</strong>
                  <span class="software-version">{{ item.version || 'Sin versión' }}</span>
                  <span class="fabricante">{{ item.fabricante }}</span>
                  <span class="fecha-instalacion">Instalado: {{ formatFecha(item.fechaInstalacion) }}</span>
                  <span v-if="item.licenciaKey" class="licencia-key">Licencia: {{ item.licenciaKey }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="cerrarDetalles" class="btn-secondary">Cerrar</button>
            <button v-if="tienePermisos" @click="editarEquipoDesdeDetalles" class="btn-primary">Editar Equipo</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { equiposService, type Equipo, type EquipoSoftware } from '../api/equiposAPI';
import { ubicacionesService, type Departamento, type Aula, type Edificio } from '../api/ubicacionesAPI';
import { usuariosService, type UsuarioCompleto } from '../api/usuariosAPI';
import ModalEquipo from '../componentes/ModalEquipo.vue';
import ModalInstalarSoftware from '../componentes/ModalInstalarSoftware.vue';

const cargando = ref(false);
const equipos = ref<Equipo[]>([]);
const departamentos = ref<Departamento[]>([]);
const aulas = ref<Aula[]>([]);
const edificios = ref<Edificio[]>([]); 
const usuarios = ref<UsuarioCompleto[]>([]);
const softwareEquipo = ref<EquipoSoftware[]>([]);

const filtroTipo = ref('');
const filtroEstado = ref('');
const terminoBusqueda = ref('');

const modalEquipo = ref({
  mostrar: false,
  equipo: null as Equipo | null
});

const modalDetalles = ref({
  mostrar: false,
  equipo: null as Equipo | null
});

const puedeTenerSoftware = (equipo: Equipo): boolean => {
  return equipo.tipo_equipo_nombre === 'Computadora';
};

const modalInstalarSoftware = ref({
  mostrar: false,
  equipo: null as Equipo | null
});

const instalarSoftware = (equipo: Equipo) => {
  modalInstalarSoftware.value = {
    mostrar: true,
    equipo: equipo
  };
};

const tiposEquipo = [
  { idTipoEquipo: 1, nombre: 'Computadora' },
  { idTipoEquipo: 2, nombre: 'Proyector' },
  { idTipoEquipo: 3, nombre: 'Impresora' },
  { idTipoEquipo: 4, nombre: 'Switch' },
  { idTipoEquipo: 5, nombre: 'Router' },
  { idTipoEquipo: 6, nombre: 'Monitor' }
];

const tienePermisos = computed(() => {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) return false;
  const usuario = JSON.parse(usuarioStr);
  return usuario.tipo_usuario_nombre === 'Jefe de Taller'||
         usuario.tipo_usuario_nombre === 'Jefe de Departamento';
});

const equiposFiltrados = computed(() => {
  let filtered = equipos.value;

  if (filtroTipo.value) {
    filtered = filtered.filter(e => e.idTipoEquipo === Number(filtroTipo.value));
  }

  if (filtroEstado.value) {
    filtered = filtered.filter(e => e.estado === filtroEstado.value);
  }

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(e => 
      e.nombre.toLowerCase().includes(searchTerm) ||
      e.codigo.toLowerCase().includes(searchTerm) ||
      e.marca?.toLowerCase().includes(searchTerm) ||
      e.modelo?.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

const getBadgeClass = (tipo: string | undefined) => {
  switch (tipo) {
    case 'Computadora': return 'badge-computadora';
    case 'Proyector': return 'badge-proyector';
    case 'Impresora': return 'badge-impresora';
    case 'Switch': return 'badge-switch';
    case 'Router': return 'badge-router';
    case 'Monitor': return 'badge-monitor';
    default: return 'badge-default';
  }
};

const getEstadoTexto = (estado: string | undefined) => {
  switch (estado) {
    case 'activo': return 'Activo';
    case 'mantenimiento': return 'Mantenimiento';
    case 'baja': return 'De baja';
    case 'obsoleto': return 'Obsoleto';
    case 'en_stock': return 'En stock';
    default: return estado;
  }
};

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES');
};

const esGarantiaExpirada = (fechaExpiracion: string | undefined) => {
  if (!fechaExpiracion) return false;
  return new Date(fechaExpiracion) < new Date();
};

const cargarDatos = async () => {
  cargando.value = true;
  try {
    const [resEquipos, resDepartamentos, resAulas, resUsuarios, resEdificios] = await Promise.all([
      equiposService.obtenerEquipos(),
      ubicacionesService.obtenerDepartamentos(),
      ubicacionesService.obtenerAulas(),
      usuariosService.obtenerUsuarios(),
      ubicacionesService.obtenerEdificios() // Agregar esta línea
    ]);
    
    equipos.value = resEquipos.data;
    departamentos.value = resDepartamentos.data;
    aulas.value = resAulas.data;
    usuarios.value = resUsuarios.data;
    edificios.value = resEdificios.data; // Agregar esta línea
  } catch (error) {
    console.error('Error al cargar datos:', error);
  } finally {
    cargando.value = false;
  }
};

const cargarSoftwareEquipo = async (idEquipo: number) => {
  try {
    const response = await equiposService.obtenerSoftwareEquipo(idEquipo);
    softwareEquipo.value = response.data;
  } catch (error) {
    console.error('Error al cargar software del equipo:', error);
    softwareEquipo.value = [];
  }
};

const aplicarFiltros = () => {
  // Los filtros se aplican automáticamente mediante computed properties
};

const mostrarModalEquipo = () => {
  modalEquipo.value = {
    mostrar: true,
    equipo: null
  };
};

const editarEquipo = (equipo: Equipo) => {
  modalEquipo.value = {
    mostrar: true,
    equipo: equipo
  };
};

const eliminarEquipo = async (equipo: Equipo) => {
  if (!equipo.idEquipo) return;

  const confirmacion = confirm(
    `¿Estás seguro de eliminar el equipo "${equipo.nombre}"?\n\n` +
    `Código: ${equipo.codigo}\n` +
    `Esta acción no se puede deshacer.`
  );

  if (!confirmacion) return;

  try {
    await equiposService.eliminarEquipo(equipo.idEquipo);
    await cargarDatos();
    alert('Equipo eliminado correctamente');
  } catch (error: any) {
    alert('Error al eliminar equipo: ' + (error.response?.data?.error || error.message));
  }
};

const verDetallesEquipo = async (equipo: Equipo) => {
  modalDetalles.value = {
    mostrar: true,
    equipo: equipo
  };
  
  // Cargar software instalado cuando se muestran los detalles
  if (equipo.idEquipo) {
    await cargarSoftwareEquipo(equipo.idEquipo);
  }
};

const cerrarDetalles = () => {
  modalDetalles.value.mostrar = false;
  softwareEquipo.value = []; // Limpiar software al cerrar
};

const editarEquipoDesdeDetalles = () => {
  if (modalDetalles.value.equipo) {
    editarEquipo(modalDetalles.value.equipo);
  }
  cerrarDetalles();
};

const handleGuardado = () => {
  cargarDatos();
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.gestion-equipos {
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

.btn-nuevo-usuario {
  align-self: flex-end;
  margin-left: auto;
  margin-bottom: 8px;
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
  cursor: pointer;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-computadora {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-proyector {
  background: #fef3c7;
  color: #d97706;
}

.badge-impresora {
  background: #f0fdf4;
  color: #15803d;
}

.badge-switch {
  background: #f3e8ff;
  color: #7c3aed;
}

.badge-router {
  background: #ffe4e6;
  color: #e11d48;
}

.badge-monitor {
  background: #ecfdf5;
  color: #047857;
}

.badge-default {
  background: #f3f4f6;
  color: #6b7280;
}

.estado.activo {
  color: #15803d;
  font-weight: 500;
}

.estado.mantenimiento {
  color: #d97706;
  font-weight: 500;
}

.estado.baja, .estado.obsoleto {
  color: #dc2626;
  font-weight: 500;
}

.estado.en_stock {
  color: #2563eb;
  font-weight: 500;
}

.no-assignment {
  color: #9ca3af;
  font-style: italic;
}

.ubicacion {
  font-weight: 500;
  color: #374151;
}

.actions {
  white-space: nowrap;
  text-align: center;
}

.btn-info{
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 10px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;  
}

.btn-info:hover:not(.disabled) {
  background: #2563eb;
}

.btn-info.disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-edit, .btn-delete{
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

.btn-info{
  background: #af96e7;
}

.btn-delete {
  background: #dc2626;
  color: white;
}

.btn-delete:hover {
  background: #b91c1c;
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

/* Estilos para el modal de detalles */
.detalles-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.detalles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.detalle-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.detalle-item label {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detalle-item span {
  color: #6b7280;
  font-size: 14px;
}

.expirado {
  color: #dc2626;
  font-weight: 500;
}

.expirado-badge {
  background: #fecaca;
  color: #dc2626;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  margin-left: 8px;
}

.software-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}

.software-section h4 {
  margin: 0 0 15px 0;
  color: #374151;
}

.software-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.software-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
}

.software-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.software-info strong {
  color: #374151;
  font-size: 14px;
}

.software-version {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  align-self: flex-start;
}

.fabricante, .fecha-instalacion, .licencia-key {
  font-size: 12px;
  color: #6b7280;
}

.licencia-key {
  background: #fef3c7;
  color: #d97706;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
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

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
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

@media (max-width: 768px) {
  .filtros {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-nuevo-usuario {
    margin-left: 0;
    align-self: stretch;
  }
  
  .detalles-grid {
    grid-template-columns: 1fr;
  }
  
  .data-table {
    font-size: 14px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
  }
  
  .detalles-modal {
    width: 95%;
    margin: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>