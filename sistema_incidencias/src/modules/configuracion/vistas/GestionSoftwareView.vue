<template>
  <div class="gestion-software">
    <div class="header">
      <h1>Gestión de Software</h1>
    </div>

    <div v-if="esJefeTaller" class="permisos-info">
      <p>✅ Tienes permisos para gestionar software del sistema</p>
    </div>
    <div v-else class="permisos-info no-permisos">
      <p>❌ Solo el Jefe de Taller puede gestionar software</p>
    </div>

    <div class="filtros" v-if="esJefeTaller">
      <div class="filtro-group">
        <label for="filtroTipoLicencia">Filtrar por tipo de licencia:</label>
        <select id="filtroTipoLicencia" v-model="filtroTipoLicencia" @change="aplicarFiltros">
          <option value="">Todos los tipos</option>
          <option value="Libre">Libre</option>
          <option value="Comercial">Comercial</option>
          <option value="Educativa">Educativa</option>
          <option value="Prueba">Prueba</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label for="filtroRequiereActivacion">Requiere activación:</label>
        <select id="filtroRequiereActivacion" v-model="filtroRequiereActivacion" @change="aplicarFiltros">
          <option value="">Todos</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <input 
          type="text" 
          v-model="terminoBusqueda" 
          placeholder="Buscar por nombre, fabricante..."
          @input="aplicarFiltros"
          class="busqueda-input"
        >
      </div>
      
      <button v-if="esJefeTaller" @click="mostrarModalSoftware" class="btn-primary btn-nuevo-software">
        ➕ Nuevo Software
      </button>
    </div>

    <div v-if="cargando" class="loading">Cargando software...</div>
    <div v-else-if="softwareFiltrado.length === 0" class="no-data">
      <p>No hay software registrado</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Versión</th>
            <th>Fabricante</th>
            <th>Tipo Licencia</th>
            <th>Expiración Licencia</th>
            <th>Requiere Activación</th>
            <th v-if="esJefeTaller">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="soft in softwareFiltrado" 
              :key="soft.idSoftware"
              @click="verDetallesSoftware(soft)"
              class="fila-clickeable">
            <td><strong>{{ soft.nombre }}</strong></td>
            <td>{{ soft.version || 'N/A' }}</td>
            <td>{{ soft.fabricante || 'N/A' }}</td>
            <td>
              <span class="badge" :class="getBadgeClass(soft.tipoLicencia)">
                {{ getTipoLicenciaTexto(soft.tipoLicencia) }}
              </span>
            </td>
            <td>
              <span v-if="soft.fechaExpiracionLicencia" 
                    :class="{ 'expirado': esLicenciaExpirada(soft.fechaExpiracionLicencia) }">
                {{ formatFecha(soft.fechaExpiracionLicencia) }}
                <span v-if="esLicenciaExpirada(soft.fechaExpiracionLicencia)" class="expirado-badge">
                  Expirada
                </span>
              </span>
              <span v-else class="no-expira">No expira</span>
            </td>
            <td>
              <span class="estado" :class="soft.requiereActivacion ? 'si' : 'no'">
                {{ soft.requiereActivacion ? '✅ Sí' : '❌ No' }}
              </span>
            </td>
            <td v-if="esJefeTaller" class="actions" @click.stop>
              <button @click="editarSoftware(soft)" class="btn-edit" title="Editar">✏️</button>
              <button @click="eliminarSoftware(soft)" class="btn-delete" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalSoftware 
      :mostrar="modalSoftware.mostrar"
      :software="modalSoftware.software"
      @cerrar="modalSoftware.mostrar = false"
      @guardado="handleGuardado"
    />

    <div v-if="modalDetalles.mostrar" class="modal-overlay" @click.self="cerrarDetalles">
      <div class="modal-content detalles-modal">
        <div class="modal-header">
          <h3>Detalles del Software</h3>
          <button @click="cerrarDetalles" class="btn-cerrar">×</button>
        </div>
        <div class="modal-body" v-if="modalDetalles.software">
          <div class="detalles-grid">
            <div class="detalle-item">
              <label>Nombre:</label>
              <span>{{ modalDetalles.software.nombre }}</span>
            </div>
            <div class="detalle-item">
              <label>Versión:</label>
              <span>{{ modalDetalles.software.version || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Fabricante:</label>
              <span>{{ modalDetalles.software.fabricante || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Tipo de Licencia:</label>
              <span class="badge" :class="getBadgeClass(modalDetalles.software.tipoLicencia)">
                {{ getTipoLicenciaTexto(modalDetalles.software.tipoLicencia) }}
              </span>
            </div>
            <div class="detalle-item">
              <label>Expiración Licencia:</label>
              <span v-if="modalDetalles.software.fechaExpiracionLicencia" 
                    :class="{ 'expirado': esLicenciaExpirada(modalDetalles.software.fechaExpiracionLicencia) }">
                {{ formatFecha(modalDetalles.software.fechaExpiracionLicencia) }}
              </span>
              <span v-else>No expira</span>
            </div>
            <div class="detalle-item">
              <label>Requiere Activación:</label>
              <span>{{ modalDetalles.software.requiereActivacion ? 'Sí' : 'No' }}</span>
            </div>
            <div class="detalle-item full-width" v-if="modalDetalles.software.comentarios">
              <label>Comentarios:</label>
              <p class="comentarios">{{ modalDetalles.software.comentarios }}</p>
            </div>
          </div>
          <div class="form-actions">
            <button @click="cerrarDetalles" class="btn-secondary">Cerrar</button>
            <button v-if="esJefeTaller" @click="editarDesdeDetalles" class="btn-primary">Editar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { softwareService, type Software } from '../api/softwareAPI';
import ModalSoftware from '../componentes/ModalSoftware.vue';

const cargando = ref(false);
const software = ref<Software[]>([]);

const filtroTipoLicencia = ref('');
const filtroRequiereActivacion = ref('');
const terminoBusqueda = ref('');

const modalSoftware = ref({
  mostrar: false,
  software: null as Software | null
});

const modalDetalles = ref({
  mostrar: false,
  software: null as Software | null
});

const esJefeTaller = computed(() => {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) return false;
  const usuario = JSON.parse(usuarioStr);
  return usuario.tipo_usuario_nombre === 'Jefe de Taller';
});

const softwareFiltrado = computed(() => {
  let filtered = software.value;

  if (filtroTipoLicencia.value) {
    filtered = filtered.filter(s => s.tipoLicencia === filtroTipoLicencia.value);
  }

  if (filtroRequiereActivacion.value !== '') {
    filtered = filtered.filter(s => s.requiereActivacion === parseInt(filtroRequiereActivacion.value));
  }

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(s => 
      s.nombre.toLowerCase().includes(searchTerm) ||
      s.fabricante?.toLowerCase().includes(searchTerm) ||
      s.version?.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

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

const cargarSoftware = async () => {
  cargando.value = true;
  try {
    const response = await softwareService.obtenerSoftware();
    software.value = response.data;
  } catch (error) {
    console.error('Error al cargar software:', error);
    alert('Error al cargar la lista de software');
  } finally {
    cargando.value = false;
  }
};

const aplicarFiltros = () => {
  
};

const mostrarModalSoftware = () => {
  modalSoftware.value = {
    mostrar: true,
    software: null
  };
};

const editarSoftware = (soft: Software) => {
  modalSoftware.value = {
    mostrar: true,
    software: soft
  };
};

const eliminarSoftware = async (soft: Software) => {
  if (!soft.idSoftware) return;

  const confirmacion = confirm(
    `¿Estás seguro de eliminar el software "${soft.nombre}"?\n\n` +
    `Esta acción no se puede deshacer.`
  );

  if (!confirmacion) return;

  try {
    await softwareService.eliminarSoftware(soft.idSoftware);
    await cargarSoftware();
    alert('Software eliminado correctamente');
  } catch (error: any) {
    alert('Error al eliminar software: ' + (error.response?.data?.error || error.message));
  }
};

const verDetallesSoftware = (soft: Software) => {
  modalDetalles.value = {
    mostrar: true,
    software: soft
  };
};

const cerrarDetalles = () => {
  modalDetalles.value.mostrar = false;
};

const editarDesdeDetalles = () => {
  if (modalDetalles.value.software) {
    editarSoftware(modalDetalles.value.software);
  }
  cerrarDetalles();
};

const handleGuardado = () => {
  cargarSoftware();
};

onMounted(() => {
  cargarSoftware();
});
</script>

<style scoped>
.gestion-software {
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

.btn-nuevo-software {
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

.badge-libre {
  background: #d1fae5;
  color: #065f46;
}

.badge-comercial {
  background: #dbeafe;
  color: #1e40af;
}

.badge-educativa {
  background: #fef3c7;
  color: #d97706;
}

.badge-prueba {
  background: #f3e8ff;
  color: #7c3aed;
}

.badge-default {
  background: #f3f4f6;
  color: #6b7280;
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

.no-expira {
  color: #6b7280;
  font-style: italic;
}

.estado.si {
  color: #15803d;
  font-weight: 500;
}

.estado.no {
  color: #6b7280;
}

.actions {
  white-space: nowrap;
  text-align: center;
}

.btn-edit, .btn-delete {
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
  max-width: 600px;
}

.detalles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.detalle-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detalle-item.full-width {
  grid-column: 1 / -1;
}

.detalle-item label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.detalle-item span {
  color: #6b7280;
}

.comentarios {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin: 0;
  white-space: pre-wrap;
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

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .filtros {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-nuevo-software {
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
}
</style>