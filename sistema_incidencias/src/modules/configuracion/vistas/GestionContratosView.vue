<!-- modules/configuration/vistas/GestionContratosView.vue -->
<template>
  <div class="gestion-contratos">
    <div class="header">
      <h1>Gestión de Contratos</h1>
    </div>

    <div v-if="esJefeTaller" class="permisos-info">
      <p>✅ Tienes permisos para gestionar contratos del sistema</p>
    </div>
    <div v-else class="permisos-info no-permisos">
      <p>❌ Solo el Jefe de Taller puede gestionar contratos</p>
    </div>

    <div class="filtros" v-if="esJefeTaller">
      <div class="filtro-group">
        <label for="filtroEstado">Filtrar por estado:</label>
        <select id="filtroEstado" v-model="filtroEstado" @change="aplicarFiltros">
          <option value="">Todos los estados</option>
          <option value="Vigente">Vigente</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Vencido">Vencido</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label for="filtroEquipo">Filtrar por equipo:</label>
        <select id="filtroEquipo" v-model="filtroEquipo" @change="aplicarFiltros">
          <option value="">Todos los equipos</option>
          <option v-for="equipo in equipos" :key="equipo.idEquipo" :value="equipo.idEquipo">
            {{ equipo.codigo }} - {{ equipo.nombre }}
          </option>
        </select>
      </div>
      
      <div class="filtro-group">
        <input 
          type="text" 
          v-model="terminoBusqueda" 
          placeholder="Buscar por proveedor, número de contrato..."
          @input="aplicarFiltros"
          class="busqueda-input"
        >
      </div>
      
      <button v-if="esJefeTaller" @click="mostrarModalContrato" class="btn-primary btn-nuevo-contrato">
        ➕ Nuevo Contrato
      </button>
    </div>

    <!-- Estadísticas rápidas 
    <div class="estadisticas" v-if="esJefeTaller">
      <div class="estadistica-item">
        <div class="estadistica-valor">{{ estadisticas.total }}</div>
        <div class="estadistica-label">Total</div>
      </div>
      <div class="estadistica-item vigente">
        <div class="estadistica-valor">{{ estadisticas.vigentes }}</div>
        <div class="estadistica-label">Vigentes</div>
      </div>
      <div class="estadistica-item proximo-vencer">
        <div class="estadistica-valor">{{ estadisticas.proximosVencer }}</div>
        <div class="estadistica-label">Próximos a vencer</div>
      </div>
      <div class="estadistica-item vencido">
        <div class="estadistica-valor">{{ estadisticas.vencidos }}</div>
        <div class="estadistica-label">Vencidos</div>
      </div>
    </div>-->

    <div v-if="cargando" class="loading">Cargando contratos...</div>
    <div v-else-if="contratosFiltrados.length === 0" class="no-data">
      <p>No hay contratos registrados</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Contrato</th>
            <th>Proveedor</th>
            <th>Equipo</th>
            <th>Vigencia</th>
            <th>Costo</th>
            <th>Estado</th>
            <th v-if="esJefeTaller">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contrato in contratosFiltrados" 
              :key="contrato.idContrato"
              @click="verDetallesContrato(contrato)"
              class="fila-clickeable">
            <td><strong>{{ contrato.numeroContrato }}</strong></td>
            <td>{{ contrato.proveedor }}</td>
            <td>
              <div class="equipo-info">
                <span class="equipo-codigo">{{ contrato.equipo_codigo }}</span>
                <span class="equipo-nombre">{{ contrato.equipo_nombre }}</span>
              </div>
            </td>
            <td>
              <div class="vigencia-info">
                <span class="fecha-inicio">{{ formatFecha(contrato.fechaInicio) }}</span>
                <span class="separador">→</span>
                <span class="fecha-fin" :class="{ 'proximo-vencer': esProximoAVencer(contrato.fechaFin) }">
                  {{ formatFecha(contrato.fechaFin) }}
                </span>
                <span v-if="esProximoAVencer(contrato.fechaFin)" class="alerta-vencimiento">
                  
                </span>
              </div>
            </td>
            <td class="costo">${{ contrato.costo.toLocaleString() }}</td>
            <td>
              <span class="badge" :class="getBadgeClass(contrato.estado)">
                {{ getEstadoTexto(contrato.estado) }}
              </span>
            </td>
            <td v-if="esJefeTaller" class="actions" @click.stop>
              <button @click="editarContrato(contrato)" class="btn-edit" title="Editar">✏️</button>
              <button @click="eliminarContrato(contrato)" class="btn-delete" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalContrato 
      :mostrar="modalContrato.mostrar"
      :contrato="modalContrato.contrato"
      :equipos="equipos"
      @cerrar="modalContrato.mostrar = false"
      @guardado="handleGuardado"
    />

    <!-- Modal de Detalles del Contrato -->
    <div v-if="modalDetalles.mostrar" class="modal-overlay" @click.self="cerrarDetalles">
      <div class="modal-content detalles-modal">
        <div class="modal-header">
          <h3>Detalles del Contrato</h3>
          <button @click="cerrarDetalles" class="btn-cerrar">×</button>
        </div>
        <div class="modal-body" v-if="modalDetalles.contrato">
          <div class="detalles-grid">
            <div class="detalle-item">
              <label>Número de Contrato:</label>
              <span class="contrato-numero">{{ modalDetalles.contrato.numeroContrato }}</span>
            </div>
            <div class="detalle-item">
              <label>Proveedor:</label>
              <span>{{ modalDetalles.contrato.proveedor }}</span>
            </div>
            <div class="detalle-item">
              <label>Equipo:</label>
              <span class="equipo-detalle">
                {{ modalDetalles.contrato.equipo_codigo }} - {{ modalDetalles.contrato.equipo_nombre }}
              </span>
            </div>
            <div class="detalle-item">
              <label>Estado:</label>
              <span class="badge" :class="getBadgeClass(modalDetalles.contrato.estado)">
                {{ getEstadoTexto(modalDetalles.contrato.estado) }}
              </span>
            </div>
            
            <div class="detalle-item">
              <label>Fecha de Inicio:</label>
              <span>{{ formatFecha(modalDetalles.contrato.fechaInicio) }}</span>
            </div>
            <div class="detalle-item">
              <label>Fecha de Fin:</label>
              <span :class="{ 'proximo-vencer': esProximoAVencer(modalDetalles.contrato.fechaFin) }">
                {{ formatFecha(modalDetalles.contrato.fechaFin) }}
                <span v-if="esProximoAVencer(modalDetalles.contrato.fechaFin)" class="alerta-vencimiento">
                  Próximo a vencer
                </span>
              </span>
            </div>
            <div class="detalle-item">
              <label>Días restantes:</label>
              <span :class="getClaseDiasRestantes(modalDetalles.contrato.fechaFin)">
                {{ calcularDiasRestantes(modalDetalles.contrato.fechaFin) }}
              </span>
            </div>
            <div class="detalle-item">
              <label>Costo:</label>
              <span class="costo-detalle">${{ modalDetalles.contrato.costo.toLocaleString() }}</span>
            </div>
            
            <div class="detalle-item">
              <label>Contacto:</label>
              <span>{{ modalDetalles.contrato.contactoProveedor || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Teléfono:</label>
              <span>{{ modalDetalles.contrato.telefonoContacto || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <label>Email:</label>
              <span>{{ modalDetalles.contrato.emailContacto || 'N/A' }}</span>
            </div>
          </div>
          
          <div class="cobertura-section" v-if="modalDetalles.contrato.cobertura">
            <label>Cobertura:</label>
            <div class="cobertura-content">
              {{ modalDetalles.contrato.cobertura }}
            </div>
          </div>

          <div class="form-actions">
            <button @click="cerrarDetalles" class="btn-secondary">Cerrar</button>
            <button v-if="esJefeTaller" @click="editarDesdeDetalles" class="btn-primary">✏️ Editar Contrato</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { contratosService, type ContratoMantenimiento } from '../api/contratosAPI';
import { equiposService, type Equipo } from '../api/equiposAPI';
import ModalContrato from '../componentes/ModalContrato.vue';

const cargando = ref(false);
const contratos = ref<ContratoMantenimiento[]>([]);
const equipos = ref<Equipo[]>([]);

const filtroEstado = ref('');
const filtroEquipo = ref('');
const terminoBusqueda = ref('');

const modalContrato = ref({
  mostrar: false,
  contrato: null as ContratoMantenimiento | null
});

const modalDetalles = ref({
  mostrar: false,
  contrato: null as ContratoMantenimiento | null
});

const esJefeTaller = computed(() => {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) return false;
  const usuario = JSON.parse(usuarioStr);
  return usuario.tipo_usuario_nombre === 'Jefe de Taller';
});

// Estadísticas
const estadisticas = computed(() => {
  const total = contratos.value.length;
  const vigentes = contratos.value.filter(c => c.estado === 'Vigente').length;
  const vencidos = contratos.value.filter(c => c.estado === 'Vencido').length;
  const proximosVencer = contratos.value.filter(c => 
    c.estado === 'Vigente' && esProximoAVencer(c.fechaFin)
  ).length;

  return { total, vigentes, vencidos, proximosVencer };
});

const contratosFiltrados = computed(() => {
  let filtered = contratos.value;

  if (filtroEstado.value) {
    filtered = filtered.filter(c => c.estado === filtroEstado.value);
  }

  if (filtroEquipo.value) {
    filtered = filtered.filter(c => c.idEquipo === Number(filtroEquipo.value));
  }

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(c => 
      c.proveedor.toLowerCase().includes(searchTerm) ||
      c.numeroContrato.toLowerCase().includes(searchTerm) ||
      c.contactoProveedor?.toLowerCase().includes(searchTerm) ||
      c.equipo_nombre?.toLowerCase().includes(searchTerm) ||
      c.equipo_codigo?.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

const getBadgeClass = (estado: string | undefined) => {
  switch (estado) {
    case 'Vigente': return 'badge-vigente';
    case 'Pendiente': return 'badge-pendiente';
    case 'Vencido': return 'badge-vencido';
    case 'Cancelado': return 'badge-cancelado';
    default: return 'badge-default';
  }
};

const getEstadoTexto = (estado: string | undefined) => {
  switch (estado) {
    case 'Vigente': return 'Vigente';
    case 'Pendiente': return 'Pendiente';
    case 'Vencido': return 'Vencido';
    case 'Cancelado': return 'Cancelado';
    default: return estado;
  }
};

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES');
};

const esProximoAVencer = (fechaFin: string) => {
  const fin = new Date(fechaFin);
  const hoy = new Date();
  const diffTime = fin.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays > 0;
};

const calcularDiasRestantes = (fechaFin: string) => {
  const fin = new Date(fechaFin);
  const hoy = new Date();
  const diffTime = fin.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Vencido';
  if (diffDays === 0) return 'Vence hoy';
  if (diffDays === 1) return '1 día';
  return `${diffDays} días`;
};

const getClaseDiasRestantes = (fechaFin: string) => {
  const fin = new Date(fechaFin);
  const hoy = new Date();
  const diffTime = fin.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'vencido';
  if (diffDays <= 7) return 'critico';
  if (diffDays <= 30) return 'advertencia';
  return 'normal';
};

const cargarDatos = async () => {
  cargando.value = true;
  try {
    const [resContratos, resEquipos] = await Promise.all([
      contratosService.obtenerContratos(),
      equiposService.obtenerEquipos()
    ]);
    
    contratos.value = resContratos.data;
    equipos.value = resEquipos.data;
  } catch (error) {
    console.error('Error al cargar datos:', error);
    alert('Error al cargar la lista de contratos');
  } finally {
    cargando.value = false;
  }
};

const aplicarFiltros = () => {
  // Los filtros se aplican automáticamente mediante computed properties
};

const mostrarModalContrato = () => {
  modalContrato.value = {
    mostrar: true,
    contrato: null
  };
};

const editarContrato = (contrato: ContratoMantenimiento) => {
  modalContrato.value = {
    mostrar: true,
    contrato: contrato
  };
};

const eliminarContrato = async (contrato: ContratoMantenimiento) => {
  if (!contrato.idContrato) return;

  const confirmacion = confirm(
    `¿Estás seguro de eliminar el contrato "${contrato.numeroContrato}"?\n\n` +
    `Proveedor: ${contrato.proveedor}\n` +
    `Esta acción no se puede deshacer.`
  );

  if (!confirmacion) return;

  try {
    await contratosService.eliminarContrato(contrato.idContrato);
    await cargarDatos();
    alert('Contrato eliminado correctamente');
  } catch (error: any) {
    alert('Error al eliminar contrato: ' + (error.response?.data?.error || error.message));
  }
};

const verDetallesContrato = (contrato: ContratoMantenimiento) => {
  modalDetalles.value = {
    mostrar: true,
    contrato: contrato
  };
};

const cerrarDetalles = () => {
  modalDetalles.value.mostrar = false;
};

const editarDesdeDetalles = () => {
  if (modalDetalles.value.contrato) {
    editarContrato(modalDetalles.value.contrato);
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
.gestion-contratos {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.estadisticas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.estadistica-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #6b7280;
}

.estadistica-item.vigente {
  border-left-color: #10b981;
}

.estadistica-item.proximo-vencer {
  border-left-color: #f59e0b;
}

.estadistica-item.vencido {
  border-left-color: #ef4444;
}

.estadistica-valor {
  font-size: 2rem;
  font-weight: bold;
  color: #374151;
  margin-bottom: 5px;
}

.estadistica-label {
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-vigente {
  background: #d1fae5;
  color: #065f46;
}

.badge-pendiente {
  background: #fef3c7;
  color: #d97706;
}

.badge-vencido {
  background: #fecaca;
  color: #dc2626;
}

.badge-cancelado {
  background: #e5e7eb;
  color: #6b7280;
}

.equipo-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.equipo-codigo {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 4px;
  border-radius: 3px;
  align-self: flex-start;
}

.equipo-nombre {
  font-size: 14px;
  color: #374151;
}

.vigencia-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.separador {
  color: #9ca3af;
}

.fecha-inicio {
  color: #6b7280;
}

.fecha-fin.proximo-vencer {
  color: #d97706;
  font-weight: 500;
}

.alerta-vencimiento {
  color: #d97706;
  font-size: 12px;
}

.costo {
  font-weight: 600;
  color: #059669;
}

.contrato-numero {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.equipo-detalle {
  font-weight: 500;
  color: #374151;
}

.costo-detalle {
  font-weight: 600;
  color: #059669;
  font-size: 16px;
}

.vencido {
  color: #dc2626;
  font-weight: 600;
}

.critico {
  color: #dc2626;
  font-weight: 600;
}

.advertencia {
  color: #d97706;
  font-weight: 600;
}

.normal {
  color: #059669;
  font-weight: 600;
}

.cobertura-section {
  margin-top: 20px;
}

.cobertura-section label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  display: block;
  margin-bottom: 8px;
}

.cobertura-content {
  background: #f9fafb;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  color: #374151;
  line-height: 1.5;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .estadisticas {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .vigencia-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .separador {
    display: none;
  }
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
  color: #374151;
}

.filtro-group select,
.busqueda-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
  color: #374151;
  background: white;
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
  color: #374151;
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
  color: white;
}

.badge-libre {
  background: #10b981;
}

.badge-comercial {
  background: #3b82f6;
}

.badge-educativa {
  background: #f59e0b;
}

.badge-prueba {
  background: #8b5cf6;
}

.badge-default {
  background: #6b7280;
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
  font-weight: 500;
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
  font-weight: 500;
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

.detalles-modal {
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
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

.software-info-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.software-info-section h4 {
  margin: 0 0 20px 0;
  color: #374151;
  font-size: 18px;
}

.detalles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.detalle-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  background: #f8fafc;
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

.software-nombre {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.activacion-status {
  font-weight: 500;
}

.comentarios-section {
  margin-top: 15px;
}

.comentarios-section label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  display: block;
  margin-bottom: 8px;
}

.comentarios-content {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  color: #374151;
  line-height: 1.5;
  white-space: pre-wrap;
}

.equipos-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
}

.section-header h4 {
  margin: 0;
  color: #374151;
  font-size: 18px;
}

.badge-count {
  background: #2563eb;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.loading-equipos, .no-equipos {
  text-align: center;
  padding: 30px;
  color: #6b7280;
}

.equipos-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.equipo-item * {
  color: #374151;
}

.equipo-item {
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s;
}

.equipo-item:hover {
  background: #f8fafc;
  border-color: #d1d5db;
}

.equipo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.equipo-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.equipo-nombre {
  color: #374151;
  font-size: 16px;
}

.equipo-codigo {
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  align-self: flex-start;
}

.estado-equipo.activo {
  color: #15803d;
  font-weight: 500;
  font-size: 12px;
}

.estado-equipo.mantenimiento {
  color: #d97706;
  font-weight: 500;
  font-size: 12px;
}

.estado-equipo.baja, .estado-equipo.obsoleto {
  color: #dc2626;
  font-weight: 500;
  font-size: 12px;
}

.equipo-especificaciones,
.equipo-ubicacion,
.equipo-responsable {
  color: #374151;
}

.fecha-instalacion,
.instalado-por {
  color: #374151; /* FORZAR COLOR OSCURO */
  font-weight: 500;
}

.equipo-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #374151;
}

.marca-modelo {
  font-weight: 500;
  color: #374151;
}

.tipo-equipo {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.no-ubicacion{
  color: #6b7280;
  font-style: italic;
}

.instalacion-info {
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
}

.instalacion-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #374151;
  margin-bottom: 5px;
}

.licencia-info {
  margin-bottom: 5px;
}

.licencia-key {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.comentarios-instalacion {
  background: #f8fafc;
  padding: 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  border-left: 3px solid #e5e7eb;
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

.btn-secondary:hover {
  background: #4b5563;
}
</style>