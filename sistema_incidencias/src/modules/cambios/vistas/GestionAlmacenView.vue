<template>
  <div class="gestion-almacen">
    <div class="header">
      <h1>📦 Gestión de Almacén</h1>
      <button @click="mostrarModalItem" class="btn-primary">
        ➕ Nuevo Item
      </button>
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <div class="filtro-group">
        <label for="filtroCategoria">Filtrar por categoría:</label>
        <select id="filtroCategoria" v-model="filtroCategoria" @change="aplicarFiltros">
          <option value="">Todas las categorías</option>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="consumibles">Consumibles</option>
          <option value="herramientas">Herramientas</option>
          <option value="repuestos">Repuestos</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label for="filtroEstado">Filtrar por estado:</label>
        <select id="filtroEstado" v-model="filtroEstado" @change="aplicarFiltros">
          <option value="">Todos</option>
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
          <option value="baja">De baja</option>
          <option value="mantenimiento">Mantenimiento</option>
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
    </div>

    <!-- Alertas de stock bajo -->
    <div v-if="itemsStockBajo.length > 0" class="alerta-stock">
      <h4>⚠️ Alertas de Stock Bajo</h4>
      <div class="alertas-list">
        <div v-for="item in itemsStockBajo" :key="item.idAlmacen" class="alerta-item">
          <span class="alerta-codigo">{{ item.codigo }}</span>
          <span class="alerta-nombre">{{ item.nombre }}</span>
          <span class="alerta-stock">Stock: {{ item.stock_actual }} (Mínimo: {{ item.stock_minimo }})</span>
          <button @click="registrarMovimiento(item, 'entrada')" class="btn-success small">Reponer</button>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="estadisticas">
      <div class="estadistica-card">
        <div class="estadistica-numero">{{ itemsAlmacen.length }}</div>
        <div class="estadistica-label">Total Items</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero disponible">{{ itemsDisponibles.length }}</div>
        <div class="estadistica-label">Disponibles</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero stock-bajo">{{ itemsStockBajo.length }}</div>
        <div class="estadistica-label">Stock Bajo</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero agotado">{{ itemsAgotados.length }}</div>
        <div class="estadistica-label">Agotados</div>
      </div>
    </div>

    <!-- Tabla de almacén -->
    <div v-if="cargando" class="loading">Cargando inventario...</div>
    <div v-else-if="itemsFiltrados.length === 0" class="no-data">
      <p>No hay items en el almacén</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Ubicación</th>
            <th>Proveedor</th>
            <th>Costo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in itemsFiltrados" :key="item.idAlmacen">
            <td><strong>{{ item.codigo }}</strong></td>
            <td class="nombre-item">{{ item.nombre }}</td>
            <td>
              <span class="badge-categoria" :class="item.categoria">
                {{ getTextoCategoria(item.categoria) }}
              </span>
            </td>
            <td>
              <span class="stock-info" :class="getClaseStock(item)">
                {{ item.stock_actual }} 
                <span v-if="item.stock_minimo > 0" class="stock-minimo">/ {{ item.stock_minimo }}</span>
              </span>
            </td>
            <td>{{ item.ubicacion || 'N/A' }}</td>
            <td>{{ item.proveedor || 'N/A' }}</td>
            <td>
              <span v-if="item.costo_unitario !== null && item.costo_unitario !== undefined" class="costo">
                ${{ Number(item.costo_unitario).toFixed(2) }}
              </span>
              <span v-else class="no-costo">N/A</span>
            </td>
            <td>
              <span class="badge-estado" :class="item.estado">
                {{ getTextoEstado(item.estado) }}
              </span>
            </td>
            <td class="actions">
              <button @click="verDetallesItem(item)" class="btn-info" title="Ver detalles">👁️</button>
              <button @click="editarItem(item)" class="btn-edit" title="Editar">✏️</button>
              <button @click="registrarMovimiento(item, 'entrada')" class="btn-success" title="Entrada">📥</button>
              <button @click="registrarMovimiento(item, 'salida')" class="btn-warning" title="Salida">📤</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para items -->
    <ModalItemAlmacen 
      :mostrar="modalItem.mostrar"
      :item="modalItem.item"
      @cerrar="modalItem.mostrar = false"
      @guardado="handleGuardado"
    />

    <!-- Modal para movimientos -->
    <ModalMovimientoAlmacen 
      :mostrar="modalMovimiento.mostrar"
      :item="modalMovimiento.item"
      :tipo="modalMovimiento.tipo"
      @cerrar="modalMovimiento.mostrar = false"
      @guardado="handleGuardado"
    />

    <!-- Modal de detalles -->
    <div v-if="modalDetalles.mostrar" class="modal-overlay" @click.self="cerrarDetalles">
      <div class="modal-content detalles-modal">
        <div class="modal-header">
          <h3>Detalles del Item - {{ modalDetalles.item?.codigo }}</h3>
          <button @click="cerrarDetalles" class="btn-cerrar">×</button>
        </div>
        
        <div class="modal-body" v-if="modalDetalles.item">
          <div class="seccion">
            <h4>Información General</h4>
            <div class="detalles-grid">
              <div class="detalle-item">
                <label>Código:</label>
                <span><strong>{{ modalDetalles.item.codigo }}</strong></span>
              </div>
              <div class="detalle-item">
                <label>Nombre:</label>
                <span>{{ modalDetalles.item.nombre }}</span>
              </div>
              <div class="detalle-item">
                <label>Categoría:</label>
                <span class="badge-categoria" :class="modalDetalles.item.categoria">
                  {{ getTextoCategoria(modalDetalles.item.categoria) }}
                </span>
              </div>
              <div class="detalle-item">
                <label>Stock Actual:</label>
                <span class="stock-info" :class="getClaseStock(modalDetalles.item)">
                  {{ modalDetalles.item.stock_actual }}
                </span>
              </div>
              <div class="detalle-item">
                <label>Stock Mínimo:</label>
                <span>{{ modalDetalles.item.stock_minimo }}</span>
              </div>
              <div class="detalle-item">
                <label>Estado:</label>
                <span class="badge-estado" :class="modalDetalles.item.estado">
                  {{ getTextoEstado(modalDetalles.item.estado) }}
                </span>
              </div>
              <div class="detalle-item">
                <label>Ubicación:</label>
                <span>{{ modalDetalles.item.ubicacion || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <label>Proveedor:</label>
                <span>{{ modalDetalles.item.proveedor || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <label>Costo Unitario:</label>
                <span>{{ formatCosto(modalDetalles.item.costo_unitario) }}</span>
              </div>
              <div class="detalle-item">
                <label>Fecha Adquisición:</label>
                <span>{{ modalDetalles.item.fecha_adquisicion ? formatFecha(modalDetalles.item.fecha_adquisicion) : 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="seccion" v-if="modalDetalles.item.descripcion">
            <h4>Descripción</h4>
            <div class="descripcion-content">
              {{ modalDetalles.item.descripcion }}
            </div>
          </div>

          <!-- Historial de movimientos -->
          <div class="seccion" v-if="movimientosItem.length > 0">
            <h4>Historial de Movimientos ({{ movimientosItem.length }})</h4>
            <div class="movimientos-list">
              <div v-for="movimiento in movimientosItem" :key="movimiento.idMovimiento" class="movimiento-item">
                <div class="movimiento-header">
                  <span class="movimiento-fecha">{{ formatFechaHora(movimiento.fecha_movimiento) }}</span>
                  <span class="movimiento-tipo" :class="movimiento.tipo_movimiento">
                    {{ getTextoTipoMovimiento(movimiento.tipo_movimiento) }}
                  </span>
                  <span class="movimiento-cantidad" :class="movimiento.tipo_movimiento">
                    {{ movimiento.tipo_movimiento === 'entrada' ? '+' : '-' }}{{ movimiento.cantidad }}
                  </span>
                </div>
                <div class="movimiento-info">
                  <span class="movimiento-motivo">{{ movimiento.motivo }}</span>
                  <span v-if="movimiento.comentarios" class="movimiento-comentarios">
                    {{ movimiento.comentarios }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="cerrarDetalles" class="btn-secondary">Cerrar</button>
          <button @click="editarItem(modalDetalles.item!)" class="btn-edit">✏️ Editar</button>
          <button @click="registrarMovimiento(modalDetalles.item!, 'entrada')" class="btn-success">📥 Entrada</button>
          <button @click="registrarMovimiento(modalDetalles.item!, 'salida')" class="btn-warning">📤 Salida</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { almacenService, type AlmacenItem, type MovimientoAlmacen } from '../api/almacenAPI';
import ModalItemAlmacen from '../componentes/ModalItemAlmacen.vue';
import ModalMovimientoAlmacen from '../componentes/ModalMovimientoAlmacen.vue';

const cargando = ref(false);
const itemsAlmacen = ref<AlmacenItem[]>([]);
const movimientosItem = ref<MovimientoAlmacen[]>([]);
const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

const filtroCategoria = ref('');
const filtroEstado = ref('');
const terminoBusqueda = ref('');

const modalItem = ref({
  mostrar: false,
  item: null as AlmacenItem | null
});

const modalMovimiento = ref({
  mostrar: false,
  item: null as AlmacenItem | null,
  tipo: 'entrada' as 'entrada' | 'salida'
});

const modalDetalles = ref({
  mostrar: false,
  item: null as AlmacenItem | null
});

// Computed properties
const itemsDisponibles = computed(() => {
  return itemsAlmacen.value.filter(item => item.estado === 'disponible');
});

const itemsStockBajo = computed(() => {
  return itemsAlmacen.value.filter(item => 
    item.stock_actual <= item.stock_minimo && 
    item.stock_actual > 0 &&
    item.estado === 'disponible'
  );
});

const itemsAgotados = computed(() => {
  return itemsAlmacen.value.filter(item => 
    item.stock_actual === 0 && 
    item.estado === 'disponible'
  );
});

const itemsFiltrados = computed(() => {
  let filtered = itemsAlmacen.value;

  if (filtroCategoria.value) {
    filtered = filtered.filter(item => item.categoria === filtroCategoria.value);
  }

  if (filtroEstado.value) {
    filtered = filtered.filter(item => item.estado === filtroEstado.value);
  }

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(item => 
      item.nombre.toLowerCase().includes(searchTerm) ||
      item.codigo.toLowerCase().includes(searchTerm) ||
      item.descripcion?.toLowerCase().includes(searchTerm)
    );
  }

  return filtered.sort((a, b) => a.codigo.localeCompare(b.codigo));
});

// Funciones helper
const getTextoCategoria = (categoria: string) => {
  const categoriaMap: { [key: string]: string } = {
    'hardware': '🖥️ Hardware',
    'software': '💾 Software',
    'consumibles': '🖨️ Consumibles',
    'herramientas': '🛠️ Herramientas',
    'repuestos': '🔧 Repuestos'
  };
  return categoriaMap[categoria] || categoria;
};

const getTextoEstado = (estado: string) => {
  const estadoMap: { [key: string]: string } = {
    'disponible': 'Disponible',
    'agotado': 'Agotado',
    'baja': 'De baja',
    'mantenimiento': 'Mantenimiento'
  };
  return estadoMap[estado] || estado;
};

const getTextoTipoMovimiento = (tipo: string) => {
  const tipoMap: { [key: string]: string } = {
    'entrada': 'Entrada',
    'salida': 'Salida',
    'ajuste': 'Ajuste'
  };
  return tipoMap[tipo] || tipo;
};

const getClaseStock = (item: AlmacenItem) => {
  if (item.stock_actual === 0) return 'stock-agotado';
  if (item.stock_actual <= item.stock_minimo) return 'stock-bajo';
  return 'stock-normal';
};

const formatFecha = (fecha: string | undefined) => {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString('es-MX');
  } catch (error) {
    return 'Fecha inválida';
  }
};
const formatCosto = (costo: any): string => {
  if (costo === null || costo === undefined || costo === '') {
    return 'N/A';
  }
  const numero = Number(costo);
  if (isNaN(numero)) {
    return 'N/A';
  }
  return '$' + numero.toFixed(2);
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
    console.log('Cargando items del almacén...');
    const response = await almacenService.obtenerItemsAlmacen();
    console.log('Datos recibidos:', response.data);
    itemsAlmacen.value = response.data;
  } catch (error: any) {
    console.error('Error al cargar items del almacén:', error);
    
    // Si hay error, mostrar array vacío para que no se quede cargando
    itemsAlmacen.value = [];
    
    // Mostrar mensaje más específico
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      console.error('Error de conexión con el servidor');
    } else {
      console.error('Error del servidor:', error.response?.data);
    }
  } finally {
    cargando.value = false;
  }
};

const cargarMovimientosItem = async (idAlmacen: number) => {
  try {
    console.log('Cargando movimientos para item:', idAlmacen);
    const response = await almacenService.obtenerMovimientos(idAlmacen);
    console.log('Movimientos recibidos:', response.data);
    movimientosItem.value = response.data;
  } catch (error) {
    console.error('Error al cargar movimientos:', error);
    // Si hay error, simplemente dejamos el array vacío
    movimientosItem.value = [];
  }
};

// Funciones de UI
const aplicarFiltros = () => {
  // Los filtros se aplican automáticamente mediante computed properties
};

const mostrarModalItem = () => {
  modalItem.value = {
    mostrar: true,
    item: null
  };
};

const verDetallesItem = async (item: AlmacenItem) => {
  console.log('👁️ Ver detalles del item:', item);
  
  modalDetalles.value = {
    mostrar: true,
    item: item
  };
  
  // Solo cargar movimientos si el item tiene ID
  if (item.idAlmacen) {
    try {
      await cargarMovimientosItem(item.idAlmacen);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      movimientosItem.value = [];
    }
  } else {
    movimientosItem.value = [];
  }
};

const cerrarDetalles = () => {
  modalDetalles.value.mostrar = false;
  movimientosItem.value = [];
};

const editarItem = (item: AlmacenItem) => {
  modalItem.value = {
    mostrar: true,
    item: item
  };
  cerrarDetalles();
};

const registrarMovimiento = (item: AlmacenItem, tipo: 'entrada' | 'salida') => {
  modalMovimiento.value = {
    mostrar: true,
    item: item,
    tipo: tipo
  };
};

const handleGuardado = () => {
  cargarDatos();
  cerrarDetalles();
};

onMounted(() => {
  console.log('GestionAlmacenView montado, cargando datos...');
  cargarDatos().then(() => {
    console.log('Carga de datos completada');
  }).catch(error => {
    console.error('Error en carga de datos:', error);
    cargando.value = false; // Asegurar que no se quede en estado de carga
  });
});
</script>

<style scoped>
.gestion-almacen {
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

/* Alertas de stock */
.alerta-stock {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.alerta-stock h4 {
  margin: 0 0 10px 0;
  color: #92400e;
}

.alertas-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alerta-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #fbbf24;
}

.alerta-codigo {
  font-weight: bold;
  color: #374151;
}

.alerta-nombre {
  flex: 1;
  color: #4b5563;
}

.alerta-stock {
  color: #dc2626;
  font-weight: 500;
}

.btn-success.small {
  padding: 4px 8px;
  font-size: 12px;
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

.estadistica-card .disponible {
  color: #10b981;
}

.estadistica-card .stock-bajo {
  color: #f59e0b;
}

.estadistica-card .agotado {
  color: #ef4444;
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

/* Tabla y elementos */
.nombre-item {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-categoria {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-categoria.hardware {
  background: #dbeafe;
  color: #1e40af;
}

.badge-categoria.software {
  background: #f0fdf4;
  color: #166534;
}

.badge-categoria.consumibles {
  background: #fef3c7;
  color: #92400e;
}

.badge-categoria.herramientas {
  background: #f3e8ff;
  color: #7c3aed;
}

.badge-categoria.repuestos {
  background: #fce7f3;
  color: #be185d;
}

.stock-info {
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
}

.stock-normal {
  background: #d1fae5;
  color: #065f46;
}

.stock-bajo {
  background: #fef3c7;
  color: #92400e;
}

.stock-agotado {
  background: #fee2e2;
  color: #dc2626;
}

.stock-minimo {
  font-size: 11px;
  color: #6b7280;
}

.costo {
  font-weight: 500;
  color: #059669;
}

.no-costo {
  color: #9ca3af;
  font-style: italic;
}

.badge-estado {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-estado.disponible {
  background: #d1fae5;
  color: #065f46;
}

.badge-estado.agotado {
  background: #fee2e2;
  color: #dc2626;
}

.badge-estado.baja {
  background: #f3f4f6;
  color: #6b7280;
}

.badge-estado.mantenimiento {
  background: #fef3c7;
  color: #92400e;
}

/* Movimientos */
.movimientos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.movimiento-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  background: #f8fafc;
}

.movimiento-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.movimiento-fecha {
  font-size: 12px;
  color: #6b7280;
}

.movimiento-tipo {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.movimiento-tipo.entrada {
  background: #d1fae5;
  color: #065f46;
}

.movimiento-tipo.salida {
  background: #fee2e2;
  color: #dc2626;
}

.movimiento-tipo.ajuste {
  background: #fef3c7;
  color: #92400e;
}

.movimiento-cantidad {
  font-weight: bold;
  font-size: 14px;
}

.movimiento-cantidad.entrada {
  color: #059669;
}

.movimiento-cantidad.salida {
  color: #dc2626;
}

.movimiento-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.movimiento-motivo {
  font-weight: 500;
  color: #374151;
}

.movimiento-comentarios {
  font-size: 12px;
  color: #6b7280;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
}

/* Botones */
.actions {
  white-space: nowrap;
  text-align: center;
}

.btn-success, .btn-warning {
  border: none;
  padding: 6px 10px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
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

/* Estilos reutilizables de otros componentes */
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

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 90%;
  max-width: 600px;
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

.btn-secondary, .btn-primary, .btn-edit {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-info {
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

.btn-info:hover {
  background: #2563eb;
}
</style>