<template>
  <div class="gestion-problemas">
    <div class="header">
      <h1>🔍 Gestión de Problemas</h1>
      <div class="header-actions">
        <button @click="ejecutarDeteccionAutomatica" class="btn-secondary">
          🎯 Detección Automática
        </button>
        <button @click="mostrarModalProblema" class="btn-primary">
          ➕ Nuevo Problema
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <div class="filtro-group">
        <label for="filtroEstado">Filtrar por estado:</label>
        <select id="filtroEstado" v-model="filtroEstado" @change="aplicarFiltros">
          <option value="">Todos los estados</option>
          <option v-for="estado in estadosProblema" :key="estado.idEstadoProblema" :value="estado.idEstadoProblema">
            {{ estado.nombre }}
          </option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label for="filtroPrioridad">Filtrar por prioridad:</label>
        <select id="filtroPrioridad" v-model="filtroPrioridad" @change="aplicarFiltros">
          <option value="">Todas las prioridades</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
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
        <div class="estadistica-numero">{{ problemasActivos.length }}</div>
        <div class="estadistica-label">Activos</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero investigacion">{{ problemasInvestigacion.length }}</div>
        <div class="estadistica-label">En Investigación</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero resueltos">{{ problemasResueltos.length }}</div>
        <div class="estadistica-label">Resueltos</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero">{{ problemasList.length }}</div>
        <div class="estadistica-label">Total Problemas</div>
      </div>
    </div>

    <!-- Resultados de detección automática -->
    <div v-if="deteccionResultados.mostrar" class="deteccion-resultados">
      <div class="deteccion-header">
        <h3>🎯 Resultados de Detección Automática</h3>
        <button @click="deteccionResultados.mostrar = false" class="btn-cerrar">×</button>
      </div>
      
      <div v-if="deteccionResultados.incidenciasRecurrentes.length > 0" class="deteccion-seccion">
        <h4>⚠️ Incidencias Recurrentes por Equipo</h4>
        <div v-for="item in deteccionResultados.incidenciasRecurrentes" :key="item.idEquipo" class="deteccion-item">
          <div class="deteccion-info">
            <strong>{{ item.equipo_nombre }}</strong> - {{ item.tipo_incidencia }}
            <span class="badge-cantidad">{{ item.total_incidencias }} incidencias</span>
          </div>
          <button @click="crearProblemaDesdeDeteccion(item)" class="btn-primary small">
            Crear Problema
          </button>
        </div>
      </div>

      <div v-if="deteccionResultados.patronesTipo.length > 0" class="deteccion-seccion">
        <h4>📊 Patrones por Tipo de Incidencia</h4>
        <div v-for="item in deteccionResultados.patronesTipo" :key="item.idTipoIncidencia" class="deteccion-item">
          <div class="deteccion-info">
            <strong>{{ item.tipo_incidencia }}</strong>
            <span class="badge-cantidad">{{ item.total_incidencias }} incidencias</span>
          </div>
          <button @click="crearProblemaDesdeDeteccion(item)" class="btn-primary small">
            Crear Problema
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla de Problemas -->
    <div v-if="cargando" class="loading">Cargando problemas...</div>
    <div v-else-if="problemasFiltrados.length === 0" class="no-data">
      <p>No hay problemas registrados</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Incidencias</th>
            <th>Técnico</th>
            <th>Fecha Reporte</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="problema in problemasFiltrados" :key="problema.idProblema"
              @click="verDetallesProblema(problema)"
              class="fila-clickeable">
            <td><strong>#{{ problema.idProblema }}</strong></td>
            <td class="titulo-problema">{{ problema.titulo }}</td>
            <td>
              <span class="badge-estado-problema" :class="getClaseEstado(problema.idEstadoProblema)">
                {{ problema.estado_nombre }}
              </span>
            </td>
            <td>
              <span class="badge-prioridad" :class="problema.prioridad">
                {{ getTextoPrioridad(problema.prioridad) }}
              </span>
            </td>
            <td>
              <span class="badge-cantidad-incidencias">
                {{ problema.total_incidencias || 0 }}
              </span>
            </td>
            <td>{{ problema.tecnico_asignado_nombre || 'No asignado' }}</td>
            <td>{{ formatFecha(problema.fecha_reporte) }}</td>
            <td class="actions" @click.stop>
              <button @click="verDetallesProblema(problema)" class="btn-info" title="Ver detalles">👁️</button>
              <button @click="editarProblema(problema)" class="btn-edit" title="Editar">✏️</button>
              <button @click="vincularIncidencias(problema)" class="btn-success" title="Vincular incidencias">🔗</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para Problema -->
    <ModalProblema 
      :mostrar="modalProblema.mostrar"
      :problema="modalProblema.problema"
      @cerrar="modalProblema.mostrar = false"
      @guardado="handleGuardado"
    />

    <!-- Modal para Vincular Incidencias -->
    <ModalVincularIncidencias 
      v-if="modalVincular.mostrar"
      :mostrar="modalVincular.mostrar"
      :problema="modalVincular.problema"
      @cerrar="modalVincular.mostrar = false"
      @guardado="handleGuardado"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { problemaService, type Problema, type EstadoProblema, type CategoriaProblema } from '../api/ProblemaAPI';
import ModalProblema from '../componentes/ModalProblema.vue';
import ModalVincularIncidencias from '../componentes/ModalVincularIncidencias.vue';

const cargando = ref(false);
const problemasList = ref<Problema[]>([]);
const estadosProblema = ref<EstadoProblema[]>([]);
const categoriasProblema = ref<CategoriaProblema[]>([]);

const filtroEstado = ref('');
const filtroPrioridad = ref('');
const terminoBusqueda = ref('');

const modalProblema = ref({
  mostrar: false,
  problema: null as Problema | null
});

const modalVincular = ref({
  mostrar: false,
  problema: null as Problema | null
});

const deteccionResultados = ref({
  mostrar: false,
  incidenciasRecurrentes: [] as any[],
  patronesTipo: [] as any[]
});

// Computed properties
const problemasActivos = computed(() => {
  return problemasList.value.filter(p => 
    p.idEstadoProblema !== 5 && p.idEstadoProblema !== 6 // No resueltos ni cerrados
  );
});

const problemasInvestigacion = computed(() => {
  return problemasList.value.filter(p => p.idEstadoProblema === 2);
});

const problemasResueltos = computed(() => {
  return problemasList.value.filter(p => p.idEstadoProblema === 5 || p.idEstadoProblema === 6);
});

const problemasFiltrados = computed(() => {
  let filtered = problemasList.value;

  if (filtroEstado.value) {
    filtered = filtered.filter(p => p.idEstadoProblema === parseInt(filtroEstado.value));
  }

  if (filtroPrioridad.value) {
    filtered = filtered.filter(p => p.prioridad === filtroPrioridad.value);
  }

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(p => 
      p.titulo.toLowerCase().includes(searchTerm) ||
      p.descripcion.toLowerCase().includes(searchTerm)
    );
  }

  return filtered.sort((a, b) => (b.idProblema || 0) - (a.idProblema || 0));
});

// Funciones helper
const getTextoPrioridad = (prioridad: string) => {
  const prioridadMap: { [key: string]: string } = {
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta',
    'critica': 'Crítica'
  };
  return prioridadMap[prioridad] || prioridad;
};

const getClaseEstado = (idEstado: number) => {
  const estadoMap: { [key: number]: string } = {
    1: 'nuevo',
    2: 'investigacion',
    3: 'solucion-propuesta',
    4: 'implementacion',
    5: 'resuelto',
    6: 'cerrado'
  };
  return estadoMap[idEstado] || 'nuevo';
};

const formatFecha = (fecha: string | undefined) => {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString('es-MX');
  } catch (error) {
    return 'Fecha inválida';
  }
};

// Cargar datos
const cargarDatos = async () => {
  cargando.value = true;
  try {
    const [problemasResponse, estadosResponse, categoriasResponse] = await Promise.all([
      problemaService.obtenerProblemas(),
      problemaService.obtenerEstadosProblema(),
      problemaService.obtenerCategoriasProblema()
    ]);

    problemasList.value = problemasResponse.data;
    estadosProblema.value = estadosResponse.data;
    categoriasProblema.value = categoriasResponse.data;
  } catch (error) {
    console.error('Error al cargar problemas:', error);
    alert('Error al cargar los problemas.');
  } finally {
    cargando.value = false;
  }
};

// Funciones de UI
const aplicarFiltros = () => {
  // Los filtros se aplican automáticamente mediante computed properties
};

const mostrarModalProblema = () => {
  modalProblema.value = {
    mostrar: true,
    problema: null
  };
};

const verDetallesProblema = (problema: Problema) => {
  // Aquí podrías navegar a una vista de detalles o abrir un modal
  console.log('Ver detalles del problema:', problema);
  // Por ahora, abrimos el modal de edición
  editarProblema(problema);
};

const editarProblema = (problema: Problema) => {
  modalProblema.value = {
    mostrar: true,
    problema: problema
  };
};

const vincularIncidencias = (problema: Problema) => {
  modalVincular.value = {
    mostrar: true,
    problema: problema
  };
};

const ejecutarDeteccionAutomatica = async () => {
  try {
    const response = await problemaService.deteccionAutomatica();
    deteccionResultados.value = {
      mostrar: true,
      incidenciasRecurrentes: response.data.incidenciasRecurrentes || [],
      patronesTipo: response.data.patronesTipo || []
    };
  } catch (error) {
    console.error('Error en detección automática:', error);
    alert('Error al ejecutar detección automática');
  }
};

const crearProblemaDesdeDeteccion = (item: any) => {
  let titulo = '';
  let descripcion = '';

  if (item.equipo_nombre) {
    // Es una detección por equipo
    titulo = `Problema recurrente en ${item.equipo_nombre}`;
    descripcion = `Se han detectado ${item.total_incidencias} incidencias de tipo "${item.tipo_incidencia}" en este equipo en los últimos 30 días. Incidencias: ${item.ids_incidencias}`;
  } else {
    // Es una detección por tipo
    titulo = `Patrón recurrente: ${item.tipo_incidencia}`;
    descripcion = `Se han detectado ${item.total_incidencias} incidencias de este tipo en los últimos 30 días. Equipos afectados: ${item.equipos_afectados}`;
  }

  modalProblema.value = {
    mostrar: true,
    problema: {
      titulo,
      descripcion,
      idEstadoProblema: 1, // Nuevo
      idUsuarioReporta: JSON.parse(localStorage.getItem('usuario') || '{}').idUsuario,
      prioridad: 'alta'
    } as Problema
  };

  deteccionResultados.value.mostrar = false;
};

const handleGuardado = () => {
  cargarDatos();
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.gestion-problemas {
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
  gap: 15px;
}

/* Resultados de detección */
.deteccion-resultados {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.deteccion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.deteccion-seccion {
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.deteccion-seccion:last-child {
  border-bottom: none;
}

.deteccion-seccion h4 {
  margin: 0 0 10px 0;
  color: #374151;
}

.deteccion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.deteccion-item:last-child {
  border-bottom: none;
}

.deteccion-info {
  flex: 1;
}

.badge-cantidad {
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 10px;
}

/* Badges de estado de problemas */
.badge-estado-problema {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-estado-problema.nuevo {
  background: #dbeafe;
  color: #1e40af;
}

.badge-estado-problema.investigacion {
  background: #fef3c7;
  color: #92400e;
}

.badge-estado-problema.solucion-propuesta {
  background: #d1fae5;
  color: #065f46;
}

.badge-estado-problema.implementacion {
  background: #f0f9ff;
  color: #0369a1;
}

.badge-estado-problema.resuelto {
  background: #ecfdf5;
  color: #047857;
}

.badge-estado-problema.cerrado {
  background: #f3f4f6;
  color: #6b7280;
}

/* Badge de cantidad de incidencias */
.badge-cantidad-incidencias {
  background: #6b7280;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.titulo-problema {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Estadísticas */
.estadistica-card .investigacion {
  color: #f59e0b;
}

.estadistica-card .resueltos {
  color: #10b981;
}

.btn-primary.small {
  padding: 6px 12px;
  font-size: 12px;
}

/* Reutilizar estilos existentes de otros componentes */
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

.actions {
  white-space: nowrap;
  text-align: center;
}

.btn-info, .btn-edit, .btn-success {
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

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

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
</style>