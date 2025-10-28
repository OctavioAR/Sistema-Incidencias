<template>
  <div class="gestion-cambios">
    <div class="header">
      <h1>📋 Gestión de Cambios (RFC)</h1>
      <button @click="mostrarModalRFC" class="btn-primary">
        📝 Nueva Solicitud de Cambio
      </button>
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <div class="filtro-group">
        <label for="filtroEstado">Filtrar por estado:</label>
        <select id="filtroEstado" v-model="filtroEstado" @change="aplicarFiltros">
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="pendiente_aprobacion">Pendiente Aprobación</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
          <option value="en_progreso">En Progreso</option>
          <option value="completado">Completado</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label for="filtroTipo">Filtrar por tipo:</label>
        <select id="filtroTipo" v-model="filtroTipo" @change="aplicarFiltros">
          <option value="">Todos los tipos</option>
          <option value="emergencia">Emergencia</option>
          <option value="normal">Normal</option>
          <option value="estandar">Estándar</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <input 
          type="text" 
          v-model="terminoBusqueda" 
          placeholder="Buscar por título..."
          @input="aplicarFiltros"
          class="busqueda-input"
        >
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="estadisticas">
      <div class="estadistica-card">
        <div class="estadistica-numero">{{ rfcPendientes.length }}</div>
        <div class="estadistica-label">Pendientes</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero en-progreso">{{ rfcEnProgreso.length }}</div>
        <div class="estadistica-label">En Progreso</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero completados">{{ rfcCompletados.length }}</div>
        <div class="estadistica-label">Completados</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero">{{ rfcList.length }}</div>
        <div class="estadistica-label">Total RFC</div>
      </div>
    </div>

    <!-- Tabla de RFC -->
    <div v-if="cargando" class="loading">Cargando solicitudes de cambio...</div>
    <div v-else-if="rfcFiltrados.length === 0" class="no-data">
      <p>No hay solicitudes de cambio</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Tipo</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Solicitante</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rfc in rfcFiltrados" :key="rfc.idRFC"
              @click="verDetallesRFC(rfc)"
              class="fila-clickeable">
            <td><strong>#{{ rfc.idRFC }}</strong></td>
            <td class="titulo-rfc">{{ rfc.titulo }}</td>
            <td>
              <span class="badge-tipo" :class="rfc.idTipoCambio">
                {{ getTextoTipo(rfc.idTipoCambio) }}
              </span>
            </td>
            <td>
              <span class="badge-prioridad" :class="rfc.prioridad">
                {{ getTextoPrioridad(rfc.prioridad) }}
              </span>
            </td>
            <td>
              <span class="badge-estado" :class="rfc.estado">
                {{ getTextoEstado(rfc.estado) }}
              </span>
            </td>
            <td>{{ rfc.solicitante_nombre }}</td>
            <td>{{ formatFecha(rfc.fecha_solicitud) }}</td>
            <td class="actions" @click.stop>
              <button @click="verDetallesRFC(rfc)" class="btn-info" title="Ver detalles">👁️</button>
              <button @click="editarRFC(rfc)" class="btn-edit" title="Editar" 
                      v-if="rfc.estado === 'borrador'">✏️</button>
              <button @click="aprobarRFC(rfc)" class="btn-success" title="Aprobar"
                      v-if="esJefeTaller && rfc.estado === 'pendiente_aprobacion'">✅</button>
              <button @click="rechazarRFC(rfc)" class="btn-warning" title="Rechazar"
                      v-if="esJefeTaller && rfc.estado === 'pendiente_aprobacion'">❌</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para crear/editar RFC -->
    <ModalRFC 
      :mostrar="modalRFC.mostrar"
      :rfc="modalRFC.rfc"
      @cerrar="modalRFC.mostrar = false"
      @guardado="handleGuardado"
    />

    <!-- Modal de detalles RFC -->
    <div v-if="modalDetalles.mostrar" class="modal-overlay" @click.self="cerrarDetalles">
      <div class="modal-content detalles-modal">
        <div class="modal-header">
          <h3>Detalles RFC #{{ modalDetalles.rfc?.idRFC }}</h3>
          <button @click="cerrarDetalles" class="btn-cerrar">×</button>
        </div>
        
        <div class="modal-body" v-if="modalDetalles.rfc">
          <!-- Información General -->
          <div class="seccion">
            <h4>Información General</h4>
            <div class="detalles-grid">
              <div class="detalle-item">
                <label>ID:</label>
                <span><strong>#{{ modalDetalles.rfc.idRFC }}</strong></span>
              </div>
              <div class="detalle-item">
                <label>Título:</label>
                <span>{{ modalDetalles.rfc.titulo }}</span>
              </div>
              <div class="detalle-item">
                <label>Tipo:</label>
                <span class="badge-tipo" :class="modalDetalles.rfc.idTipoCambio">
                  {{ getTextoTipo(modalDetalles.rfc.idTipoCambio) }}
                </span>
              </div>
              <div class="detalle-item">
                <label>Prioridad:</label>
                <span class="badge-prioridad" :class="modalDetalles.rfc.prioridad">
                  {{ getTextoPrioridad(modalDetalles.rfc.prioridad) }}
                </span>
              </div>
              <div class="detalle-item">
                <label>Estado:</label>
                <span class="badge-estado" :class="modalDetalles.rfc.estado">
                  {{ getTextoEstado(modalDetalles.rfc.estado) }}
                </span>
              </div>
              <div class="detalle-item">
                <label>Solicitante:</label>
                <span>{{ modalDetalles.rfc.solicitante_nombre }}</span>
              </div>
              <div class="detalle-item">
                <label>Fecha solicitud:</label>
                <span>{{ formatFechaHora(modalDetalles.rfc.fecha_solicitud) }}</span>
              </div>
              <div class="detalle-item" v-if="modalDetalles.rfc.fecha_aprobacion">
                <label>Fecha aprobación:</label>
                <span>{{ formatFechaHora(modalDetalles.rfc.fecha_aprobacion) }}</span>
              </div>
              <div class="detalle-item" v-if="modalDetalles.rfc.aprobador_nombre">
                <label>Aprobador:</label>
                <span>{{ modalDetalles.rfc.aprobador_nombre }}</span>
              </div>
            </div>
          </div>

          <!-- Descripción y Justificación -->
          <div class="seccion">
            <h4>Descripción del Cambio</h4>
            <div class="descripcion-content">
              {{ modalDetalles.rfc.descripcion }}
            </div>
          </div>

          <div class="seccion" v-if="modalDetalles.rfc.justificacion">
            <h4>Justificación</h4>
            <div class="descripcion-content">
              {{ modalDetalles.rfc.justificacion }}
            </div>
          </div>

          <div class="seccion" v-if="modalDetalles.rfc.impacto">
            <h4>Impacto Esperado</h4>
            <div class="descripcion-content">
              {{ modalDetalles.rfc.impacto }}
            </div>
          </div>

          <!-- Items del RFC -->
          <div class="seccion" v-if="itemsRFC.length > 0">
            <h4>Items a Cambiar ({{ itemsRFC.length }})</h4>
            <div class="items-list">
              <div v-for="item in itemsRFC" :key="item.idRFCItem" class="item-card">
                <div class="item-header">
                  <span class="item-tipo">{{ getTextoTipoItem(item.tipo_item) }}</span>
                  <span class="item-id">ID: {{ item.id_item }}</span>
                </div>
                <div class="item-descripcion">
                  <strong>Descripción:</strong> {{ item.descripcion_cambio }}
                </div>
                <div v-if="item.estado_anterior" class="item-estado">
                  <strong>Estado anterior:</strong> {{ item.estado_anterior }}
                </div>
                <div v-if="item.estado_nuevo" class="item-estado">
                  <strong>Estado nuevo:</strong> {{ item.estado_nuevo }}
                </div>
              </div>
            </div>
          </div>

          <!-- Bitácora -->
          <div class="seccion" v-if="bitacoraRFC.length > 0">
            <h4>Bitácora de Cambios</h4>
            <div class="bitacora-list">
              <div v-for="item in bitacoraRFC" :key="item.idBitacora" class="bitacora-item">
                <div class="bitacora-header">
                  <span class="bitacora-fecha">{{ formatFechaHora(item.fecha_cambio) }}</span>
                  <span class="bitacora-usuario">{{ item.usuario_nombre }}</span>
                </div>
                <div class="bitacora-tipo">{{ item.tipo_cambio }}</div>
                <div class="bitacora-descripcion">{{ item.descripcion }}</div>
                <div v-if="item.detalles" class="bitacora-detalles">
                  <strong>Detalles:</strong> {{ item.detalles }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="cerrarDetalles" class="btn-secondary">Cerrar</button>
          <button @click="editarRFC(modalDetalles.rfc!)" class="btn-edit" 
                  v-if="modalDetalles.rfc?.estado === 'borrador'">✏️ Editar RFC</button>
          <button @click="enviarAprobacion(modalDetalles.rfc!)" class="btn-primary"
                  v-if="modalDetalles.rfc?.estado === 'borrador'">📤 Enviar para Aprobación</button>
          <button @click="aprobarRFC(modalDetalles.rfc!)" class="btn-success"
                  v-if="esJefeTaller && modalDetalles.rfc?.estado === 'pendiente_aprobacion'">✅ Aprobar</button>
          <button @click="rechazarRFC(modalDetalles.rfc!)" class="btn-warning"
                  v-if="esJefeTaller && modalDetalles.rfc?.estado === 'pendiente_aprobacion'">❌ Rechazar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { cambiosService, type RFC, type RFCItem, type BitacoraCambio } from '../api/cambiosAPI';
import ModalRFC from '../componentes/ModalRFC.vue';

const cargando = ref(false);
const rfcList = ref<RFC[]>([]);
const itemsRFC = ref<RFCItem[]>([]);
const bitacoraRFC = ref<BitacoraCambio[]>([]);
const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

const filtroEstado = ref('');
const filtroTipo = ref('');
const terminoBusqueda = ref('');

const modalRFC = ref({
  mostrar: false,
  rfc: null as RFC | null
});

const modalDetalles = ref({
  mostrar: false,
  rfc: null as RFC | null
});

// Computed properties
const esJefeTaller = computed(() => {
  return usuarioActual.value.tipo_usuario_nombre === 'Jefe de Taller';
});

const rfcPendientes = computed(() => {
  return rfcList.value.filter(rfc => 
    rfc.estado === 'pendiente_aprobacion' || rfc.estado === 'en_progreso'
  );
});

const rfcEnProgreso = computed(() => {
  return rfcList.value.filter(rfc => rfc.estado === 'en_progreso');
});

const rfcCompletados = computed(() => {
  return rfcList.value.filter(rfc => rfc.estado === 'completado');
});

const rfcFiltrados = computed(() => {
  let filtered = rfcList.value;

  if (filtroEstado.value) {
    filtered = filtered.filter(rfc => rfc.estado === filtroEstado.value);
  }

  if (filtroTipo.value) {
    filtered = filtered.filter(rfc => rfc.idTipoCambio === filtroTipo.value);
  }

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(rfc => 
      rfc.titulo.toLowerCase().includes(searchTerm) ||
      rfc.descripcion.toLowerCase().includes(searchTerm)
    );
  }

  return filtered.sort((a, b) => (b.idRFC || 0) - (a.idRFC || 0));
});

// Funciones helper
const getTextoTipo = (tipo: string) => {
  const tipoMap: { [key: string]: string } = {
    'emergencia': '🚨 Emergencia',
    'normal': '📋 Normal',
    'estandar': '⚙️ Estándar'
  };
  return tipoMap[tipo] || tipo;
};

const getTextoPrioridad = (prioridad: string) => {
  const prioridadMap: { [key: string]: string } = {
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta',
    'critica': 'Crítica'
  };
  return prioridadMap[prioridad] || prioridad;
};

const getTextoEstado = (estado: string) => {
  const estadoMap: { [key: string]: string } = {
    'borrador': 'Borrador',
    'pendiente_aprobacion': 'Pendiente Aprobación',
    'aprobado': 'Aprobado',
    'rechazado': 'Rechazado',
    'en_progreso': 'En Progreso',
    'completado': 'Completado',
    'cancelado': 'Cancelado'
  };
  return estadoMap[estado] || estado;
};

const getTextoTipoItem = (tipo: string) => {
  const tipoMap: { [key: string]: string } = {
    'equipo': '🖥️ Equipo',
    'software': '💾 Software',
    'configuracion': '⚙️ Configuración',
    'proceso': '📊 Proceso'
  };
  return tipoMap[tipo] || tipo;
};

const formatFecha = (fecha: string | undefined) => {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString('es-MX');
  } catch (error) {
    return 'Fecha inválida';
  }
};

const formatFechaHora = (fecha: string | undefined) => {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleString('es-MX');
  } catch (error) {
    return 'Fecha inválida';
  }
};

// Cargar datos
const cargarDatos = async () => {
  cargando.value = true;
  try {
    const response = await cambiosService.obtenerRFC();
    rfcList.value = response.data;
  } catch (error) {
    console.error('Error al cargar RFC:', error);
    alert('Error al cargar las solicitudes de cambio.');
  } finally {
    cargando.value = false;
  }
};

const cargarItemsRFC = async (idRFC: number) => {
  try {
    const response = await cambiosService.obtenerItemsRFC(idRFC);
    itemsRFC.value = response.data;
  } catch (error) {
    console.error('Error al cargar items RFC:', error);
    itemsRFC.value = [];
  }
};

const cargarBitacoraRFC = async (idRFC: number) => {
  try {
    const response = await cambiosService.obtenerBitacoraRFC(idRFC);
    bitacoraRFC.value = response.data;
  } catch (error) {
    console.error('Error al cargar bitácora:', error);
    bitacoraRFC.value = [];
  }
};

// Funciones de UI
const aplicarFiltros = () => {
  // Los filtros se aplican automáticamente mediante computed properties
};

const mostrarModalRFC = () => {
  modalRFC.value = {
    mostrar: true,
    rfc: null
  };
};

const verDetallesRFC = async (rfc: RFC) => {
  modalDetalles.value = {
    mostrar: true,
    rfc: rfc
  };
  
  if (rfc.idRFC) {
    await cargarItemsRFC(rfc.idRFC);
    await cargarBitacoraRFC(rfc.idRFC);
  }
};

const cerrarDetalles = () => {
  modalDetalles.value.mostrar = false;
  itemsRFC.value = [];
  bitacoraRFC.value = [];
};

const editarRFC = (rfc: RFC) => {
  modalRFC.value = {
    mostrar: true,
    rfc: rfc
  };
  cerrarDetalles();
};

const enviarAprobacion = async (rfc: RFC) => {
  if (!rfc.idRFC) return;

  try {
    await cambiosService.actualizarEstadoRFC(rfc.idRFC, 'pendiente_aprobacion');
    alert(' RFC enviado para aprobación');
    cerrarDetalles();
    cargarDatos();
  } catch (error: any) {
    alert(' Error al enviar RFC: ' + (error.response?.data?.error || error.message));
  }
};

const aprobarRFC = async (rfc: RFC) => {
  if (!rfc.idRFC) return;

  const comentario = prompt('Ingrese comentarios de aprobación (opcional):');
  
  try {
    await cambiosService.aprobarRFC(rfc.idRFC, comentario || '');
    alert(' RFC aprobado correctamente');
    cerrarDetalles();
    cargarDatos();
  } catch (error: any) {
    alert(' Error al aprobar RFC: ' + (error.response?.data?.error || error.message));
  }
};

const rechazarRFC = async (rfc: RFC) => {
  if (!rfc.idRFC) return;

  const comentario = prompt('Ingrese motivo del rechazo:');
  if (!comentario) {
    alert('Debe ingresar un motivo para rechazar el RFC');
    return;
  }

  try {
    await cambiosService.rechazarRFC(rfc.idRFC, comentario);
    alert(' RFC rechazado');
    cerrarDetalles();
    cargarDatos();
  } catch (error: any) {
    alert(' Error al rechazar RFC: ' + (error.response?.data?.error || error.message));
  }
};

const handleGuardado = () => {
  cargarDatos();
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
/* Estilos específicos para gestión de cambios */
.badge-tipo {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-tipo.emergencia {
  background: #fef2f2;
  color: #dc2626;
}

.badge-tipo.normal {
  background: #f0f9ff;
  color: #0369a1;
}

.badge-tipo.estandar {
  background: #f0fdf4;
  color: #166534;
}

.badge-estado {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-estado.borrador {
  background: #f3f4f6;
  color: #6b7280;
}

.badge-estado.pendiente_aprobacion {
  background: #fef3c7;
  color: #d97706;
}

.badge-estado.aprobado {
  background: #d1fae5;
  color: #065f46;
}

.badge-estado.rechazado {
  background: #fee2e2;
  color: #dc2626;
}

.badge-estado.en_progreso {
  background: #dbeafe;
  color: #1e40af;
}

.badge-estado.completado {
  background: #ecfdf5;
  color: #047857;
}

/* Estilos para items RFC */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  background: #f8fafc;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-tipo {
  font-weight: 600;
  color: #374151;
}

.item-id {
  font-size: 12px;
  color: #6b7280;
}

.item-descripcion, .item-estado {
  font-size: 14px;
  margin-bottom: 5px;
  color: #4b5563;
}

/* Estilos para bitácora */
.bitacora-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bitacora-item {
  border-left: 3px solid #3b82f6;
  padding: 10px 15px;
  background: #f8fafc;
  border-radius: 0 6px 6px 0;
}

.bitacora-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
  color: #6b7280;
}

.bitacora-tipo {
  font-weight: 600;
  color: #374151;
  margin-bottom: 5px;
}

.bitacora-descripcion {
  color: #4b5563;
  margin-bottom: 5px;
}

.bitacora-detalles {
  font-size: 12px;
  color: #6b7280;
  background: #f1f5f9;
  padding: 5px 8px;
  border-radius: 4px;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}
.gestion-cambios {
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

/* Filtros */
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

/* Estadísticas */
.estadisticas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.estadistica-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
  border-left: 4px solid #3b82f6;
}

.estadistica-card .en-progreso {
  color: #f59e0b;
}

.estadistica-card .completados {
  color: #10b981;
}

.estadistica-numero {
  font-size: 2rem;
  font-weight: bold;
  color: #3b82f6;
}

.estadistica-label {
  color: #6b7280;
  font-size: 14px;
  margin-top: 5px;
}

/* Tabla */
.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
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

.fila-clickeable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.fila-clickeable:hover {
  background-color: #f8fafc;
}

.titulo-rfc {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Badges */
.badge-prioridad {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-prioridad.baja {
  background: #d1fae5;
  color: #065f46;
}

.badge-prioridad.media {
  background: #fef3c7;
  color: #92400e;
}

.badge-prioridad.alta {
  background: #fed7aa;
  color: #9a3412;
}

.badge-prioridad.critica {
  background: #fecaca;
  color: #991b1b;
}

/* Botones */
.actions {
  white-space: nowrap;
  text-align: center;
}

.btn-info, .btn-edit, .btn-success, .btn-warning {
  border: none;
  padding: 6px 10px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-info:hover {
  background: #2563eb;
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover {
  background: #d97706;
}

/* Estados de carga */
.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Botones principales */
.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* Modal styles */
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detalles-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.seccion {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.seccion h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 18px;
}

.detalles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
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
  color: #374151;
  font-size: 14px;
}

.descripcion-content {
  background: #f8fafc;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  line-height: 1.6;
  white-space: pre-wrap;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}
</style>