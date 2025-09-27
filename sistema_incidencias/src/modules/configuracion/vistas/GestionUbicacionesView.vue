<template>
  <div class="gestion-ubicaciones">
    <h1>Gestión de Ubicaciones</h1>
    
    <div v-if="esJefeTaller" class="permisos-info">
      <p>✅ Tienes permisos de Jefe de Taller para gestionar ubicaciones</p>
    </div>
    <div v-else class="permisos-info no-permisos">
      <p>❌ Solo el Jefe de Taller puede gestionar ubicaciones</p>
    </div>

    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      <!-- EDIFICIOS -->
      <div v-if="activeTab === 'edificios'" class="tab-pane">
        <div class="header-actions">
          <h2>Edificios</h2>
          <button v-if="esJefeTaller" @click="mostrarModalEdificio" class="btn-primary">
            ➕ Nuevo Edificio
          </button>
        </div>
        
        <div v-if="cargando" class="loading">Cargando edificios...</div>
        <div v-else-if="edificios.length === 0" class="no-data">
          <p>No hay edificios registrados</p>
        </div>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Fecha Creación</th>
                <th v-if="esJefeTaller">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="edificio in edificios" :key="edificio.idEdificio">
                <td>{{ edificio.codigo }}</td>
                <td>{{ edificio.nombre }}</td>
                <td>{{ formatFecha(edificio.fecha_creacion) }}</td>
                <td v-if="esJefeTaller" class="actions">
                  <button @click="editarEdificio(edificio)" class="btn-edit" title="Editar">✏️</button>
                  <button @click="eliminarEdificio(edificio.idEdificio!)" class="btn-delete" title="Eliminar">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- AULAS -->
      <div v-if="activeTab === 'aulas'" class="tab-pane">
        <div class="header-actions">
          <h2>Aulas</h2>
          <button v-if="esJefeTaller" @click="mostrarModalAula" class="btn-primary">
            ➕ Nueva Aula
          </button>
        </div>
        
        <div v-if="cargando" class="loading">Cargando aulas...</div>
        <div v-else-if="aulas.length === 0" class="no-data">
          <p>No hay aulas registradas</p>
        </div>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Edificio</th>
                <th>Fecha Creación</th>
                <th v-if="esJefeTaller">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="aula in aulas" :key="aula.idAula">
                <td>{{ aula.codigo }}</td>
                <td>{{ aula.nombre }}</td>
                <td>{{ aula.edificio_nombre || 'Sin asignar' }}</td>
                <td>{{ formatFecha(aula.fecha_creacion) }}</td>
                <td v-if="esJefeTaller" class="actions">
                  <button @click="editarAula(aula)" class="btn-edit" title="Editar">✏️</button>
                  <button @click="eliminarAula(aula.idAula!)" class="btn-delete" title="Eliminar">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- DEPARTAMENTOS -->
      <div v-if="activeTab === 'departamentos'" class="tab-pane">
        <div class="header-actions">
          <h2>Departamentos</h2>
          <button v-if="esJefeTaller" @click="mostrarModalDepartamento" class="btn-primary">
            ➕ Nuevo Departamento
          </button>
        </div>
        
        <div v-if="cargando" class="loading">Cargando departamentos...</div>
        <div v-else-if="departamentos.length === 0" class="no-data">
          <p>No hay departamentos registrados</p>
        </div>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Edificio</th>
                <th>Aula</th>
                <th>Fecha Creación</th>
                <th v-if="esJefeTaller">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="depto in departamentos" :key="depto.idDepartamento">
                <td>{{ depto.nombre }}</td>
                <td>{{ depto.edificio_nombre || 'Sin asignar' }}</td>
                <td>{{ depto.aula_nombre || 'Sin asignar' }}</td>
                <td>{{ formatFecha(depto.fecha_creacion) }}</td>
                <td v-if="esJefeTaller" class="actions">
                  <button @click="editarDepartamento(depto)" class="btn-edit" title="Editar">✏️</button>
                  <button @click="eliminarDepartamento(depto.idDepartamento!)" class="btn-delete" title="Eliminar">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <ModalEdificio 
      :mostrar="modalEdificio.mostrar"
      :edificio="modalEdificio.edificio"
      @cerrar="modalEdificio.mostrar = false"
      @guardado="handleGuardado"
    />
    
    <ModalAula 
      :mostrar="modalAula.mostrar"
      :aula="modalAula.aula"
      @cerrar="modalAula.mostrar = false"
      @guardado="handleGuardado"
    />
    
    <ModalDepartamento 
      :mostrar="modalDepartamento.mostrar"
      :departamento="modalDepartamento.departamento"
      @cerrar="modalDepartamento.mostrar = false"
      @guardado="handleGuardado"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ubicacionesService, type Edificio, type Aula, type Departamento } from '../api/ubicacionesAPI';
import ModalEdificio from '../componentes/ModalEdificio.vue';
import ModalAula from '../componentes/ModalAula.vue';
import ModalDepartamento from '../componentes/ModalDepartamento.vue';

const activeTab = ref('edificios');
const cargando = ref(false);
const edificios = ref<Edificio[]>([]);
const aulas = ref<Aula[]>([]);
const departamentos = ref<Departamento[]>([]);


const modalEdificio = ref({
  mostrar: false,
  edificio: null as Edificio | null
});

const modalAula = ref({
  mostrar: false,
  aula: null as Aula | null
});

const modalDepartamento = ref({
  mostrar: false,
  departamento: null as Departamento | null
});


const tabs = [
  { id: 'edificios', label: '🏢 Edificios' },
  { id: 'aulas', label: '🚪 Aulas' },
  { id: 'departamentos', label: '📚 Departamentos' }
];


const esJefeTaller = computed(() => {
  const usuarioStr = localStorage.getItem('usuario');
  if (!usuarioStr) return false;
  const usuario = JSON.parse(usuarioStr);
  return usuario.tipo_usuario_nombre === 'Jefe de Taller';
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
    const [resEdificios, resAulas, resDeptos] = await Promise.all([
      ubicacionesService.obtenerEdificios(),
      ubicacionesService.obtenerAulas(),
      ubicacionesService.obtenerDepartamentos()
    ]);
    
    edificios.value = resEdificios.data;
    aulas.value = resAulas.data;
    departamentos.value = resDeptos.data;
  } catch (error) {
    console.error('Error al cargar datos:', error);
    alert('Error al cargar los datos. Verifica la conexión con el servidor.');
  } finally {
    cargando.value = false;
  }
};

const mostrarModalEdificio = () => {
  modalEdificio.value = {
    mostrar: true,
    edificio: null
  };
};

const editarEdificio = (edificio: Edificio) => {
  modalEdificio.value = {
    mostrar: true,
    edificio: edificio
  };
};

const eliminarEdificio = async (id: number) => {
  if (!confirm('¿Estás seguro de eliminar este edificio? Esta acción no se puede deshacer.')) return;
  
  try {
    await ubicacionesService.eliminarEdificio(id);
    await cargarDatos();
    alert('Edificio eliminado correctamente');
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al eliminar el edificio';
    alert('Error al eliminar: ' + mensajeError);
  }
};

const mostrarModalAula = () => {
  modalAula.value = {
    mostrar: true,
    aula: null
  };
};

const editarAula = (aula: Aula) => {
  modalAula.value = {
    mostrar: true,
    aula: aula
  };
};

const eliminarAula = async (id: number) => {
  if (!confirm('¿Estás seguro de eliminar esta aula? Esta acción no se puede deshacer.')) return;
  
  try {
    await ubicacionesService.eliminarAula(id);
    await cargarDatos();
    alert('Aula eliminada correctamente');
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al eliminar el aula';
    alert('Error al eliminar: ' + mensajeError);
  }
};

const mostrarModalDepartamento = () => {
  modalDepartamento.value = {
    mostrar: true,
    departamento: null
  };
};

const editarDepartamento = (departamento: Departamento) => {
  modalDepartamento.value = {
    mostrar: true,
    departamento: departamento
  };
};

const eliminarDepartamento = async (id: number) => {
  if (!confirm('¿Estás seguro de eliminar este departamento? Esta acción no se puede deshacer.')) return;
  
  try {
    await ubicacionesService.eliminarDepartamento(id);
    await cargarDatos();
    alert('Departamento eliminado correctamente');
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al eliminar el departamento';
    alert('Error al eliminar: ' + mensajeError);
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
.gestion-ubicaciones {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
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

.permisos-info p {
  margin: 0;
  font-weight: 500;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin: 25px 0;
  background: white;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.tab-button {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.tab-button:hover {
  background: #f8fafc;
}

.tab-button.active {
  border-bottom-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.tab-content {
  background: white;
  border-radius: 0 0 8px 8px;
  padding: 0;
}

.tab-pane {
  padding: 0;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.header-actions h2 {
  margin: 0;
  color: #374151;
  font-size: 1.5rem;
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

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-style: italic;
}

.table-container {
  overflow-x: auto;
  padding: 20px;
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
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.actions {
  white-space: nowrap;
  text-align: center;
}

.btn-edit, .btn-delete {
  border: none;
  padding: 6px 12px;
  margin: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-edit {
  background: #fbbf24;
  color: #000;
}

.btn-edit:hover {
  background: #f59e0b;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
  }
  
  .tab-button {
    width: 100%;
    text-align: left;
    border-bottom: none;
    border-left: 3px solid transparent;
  }
  
  .tab-button.active {
    border-left-color: #2563eb;
    border-bottom: none;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
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