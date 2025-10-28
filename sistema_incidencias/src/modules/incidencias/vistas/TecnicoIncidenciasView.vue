<template>
  <div class="tecnico-incidencias">
    <div class="header">
      <h1>Mis Incidencias Asignadas</h1>
      <p class="welcome-message">¡Hola, {{ usuarioActual.nombre }}! Aquí puedes gestionar las incidencias asignadas a ti.</p>
    </div>

    <!-- Filtros para técnico -->
    <div class="filtros">
      <div class="filtro-group">
        <label for="filtroEstado">Filtrar por estado:</label>
        <select id="filtroEstado" v-model="filtroEstado" @change="aplicarFiltros">
          <option value="">Todos los estados</option>
          <option v-for="estado in estadosTecnico" :key="estado.idEstadoIncidencia" :value="estado.idEstadoIncidencia">
            {{ estado.nombre }}
          </option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label for="filtroPrioridad">Filtrar por prioridad:</label>
        <select id="filtroPrioridad" v-model="filtroPrioridad" @change="aplicarFiltros">
          <option value="">Todas</option>
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
          placeholder="Buscar por título o descripción..."
          @input="aplicarFiltros"
          class="busqueda-input"
        >
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="estadisticas">
      <div class="estadistica-card">
        <div class="estadistica-numero">{{ incidenciasAsignadas.length }}</div>
        <div class="estadistica-label">Total Asignadas</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero en-proceso">{{ incidenciasEnProceso.length }}</div>
        <div class="estadistica-label">En Proceso</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero pendientes">{{ incidenciasPendientes.length }}</div>
        <div class="estadistica-label">Pendientes</div>
      </div>
      <div class="estadistica-card">
        <div class="estadistica-numero completadas">{{ incidenciasCompletadas.length }}</div>
        <div class="estadistica-label">Completadas</div>
      </div>
    </div>

    <!-- Tabla de incidencias asignadas -->
    <div v-if="cargando" class="loading">Cargando incidencias...</div>
    <div v-else-if="incidenciasFiltradas.length === 0" class="no-data">
      <p v-if="terminoBusqueda || filtroEstado || filtroPrioridad">
        No se encontraron incidencias que coincidan con los filtros
      </p>
      <p v-else>No tienes incidencias asignadas</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Tipo</th>
            <th>Reportado por</th>
            <th>Equipo</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="incidencia in incidenciasFiltradas" :key="incidencia.idIncidencia"
              @click="verDetallesIncidencia(incidencia)"
              class="fila-clickeable">
            <td><strong>#{{ incidencia.idIncidencia }}</strong></td>
            <td class="titulo-incidencia">{{ incidencia.titulo }}</td>
            <td>
              <span class="badge-estado" :class="getClaseEstado(incidencia.estado_nombre)">
                {{ incidencia.estado_nombre }}
              </span>
            </td>
            <td>
              <span class="badge-prioridad" :class="incidencia.prioridad">
                {{ getTextoPrioridad(incidencia.prioridad) }}
              </span>
            </td>
            <td>{{ incidencia.tipo_incidencia_nombre }}</td>
            <td>{{ incidencia.usuario_reporta_nombre }}</td>
            <td>{{ incidencia.equipo_nombre || 'N/A' }}</td>
            <td>{{ formatFecha(incidencia.fecha_creacion) }}</td>
            <td class="actions" @click.stop>
              <button @click="verDetallesIncidencia(incidencia)" class="btn-info" title="Ver detalles">👁️</button>
              <button @click="cambiarEstado(incidencia)" class="btn-estado" title="Cambiar estado">🔄</button>
              <button @click="agregarComentario(incidencia)" class="btn-comentario" title="Agregar comentario">💬</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de detalles (similar al del jefe pero simplificado) -->
    <div v-if="modalDetalles.mostrar" class="modal-overlay" @click.self="cerrarDetalles">
      <div class="modal-content detalles-modal">
        <div class="modal-header">
          <h3>Detalles de Incidencia #{{ modalDetalles.incidencia?.idIncidencia }}</h3>
          <button @click="cerrarDetalles" class="btn-cerrar">×</button>
        </div>
        
        <div class="modal-body" v-if="modalDetalles.incidencia">
          <!-- Información General -->
          <div class="seccion">
            <h4>Información General</h4>
            <div class="detalles-grid">
              <div class="detalle-item">
                <label>ID:</label>
                <span><strong>#{{ modalDetalles.incidencia.idIncidencia }}</strong></span>
              </div>
              <div class="detalle-item">
                <label>Título:</label>
                <span>{{ modalDetalles.incidencia.titulo }}</span>
              </div>
              <div class="detalle-item">
                <label>Estado:</label>
                <span class="badge-estado" :class="getClaseEstado(modalDetalles.incidencia.estado_nombre)">
                  {{ modalDetalles.incidencia.estado_nombre }}
                </span>
              </div>
              <div class="detalle-item">
                <label>Prioridad:</label>
                <span class="badge-prioridad" :class="modalDetalles.incidencia.prioridad">
                  {{ getTextoPrioridad(modalDetalles.incidencia.prioridad) }}
                </span>
              </div>
              <div class="detalle-item">
                <label>Tipo:</label>
                <span>{{ modalDetalles.incidencia.tipo_incidencia_nombre }}</span>
              </div>
              <div class="detalle-item">
                <label>Reportado por:</label>
                <span>{{ modalDetalles.incidencia.usuario_reporta_nombre }}</span>
              </div>
              <div class="detalle-item">
                <label>Equipo:</label>
                <span>{{ modalDetalles.incidencia.equipo_nombre || 'No especificado' }}</span>
              </div>
              <div class="detalle-item">
                <label>Departamento:</label>
                <span>{{ modalDetalles.incidencia.departamento_nombre || 'No especificado' }}</span>
              </div>
              <div class="detalle-item">
                <label>Fecha reporte:</label>
                <span>{{ formatFecha(modalDetalles.incidencia.fecha_creacion) }}</span>
              </div>
            </div>
          </div>

          <!-- Descripción -->
          <div class="seccion">
            <h4>Descripción</h4>
            <div class="descripcion-content">
              {{ modalDetalles.incidencia.descripcion }}
            </div>
          </div>

          <!-- Historial -->
            <div class="seccion" v-if="historialIncidencia.length > 0">
            <h4>Historial de Cambios ({{ historialIncidencia.length }})</h4>
            <div class="historial-list">
                <div v-for="item in historialIncidencia" :key="item.idHistorial" class="historial-item">
                <div class="historial-header">
                    <span class="historial-fecha">{{ formatFechaHora(item.fecha_cambio) }}</span>
                    <span class="historial-usuario">
                    {{ item.usuario_cambio_nombre }}
                    <!-- Remove tipo_usuario_cambio since it does not exist -->
                    <!-- If you want to show the user ID, use idUsuarioCambio -->
                    <span class="tipo-usuario">
                        (ID: {{ item.idUsuarioCambio }})
                    </span>
                    </span>
                </div>
                <div class="historial-cambio" v-if="item.estado_anterior_nombre && item.estado_nuevo_nombre">
                    <span class="estado-anterior">{{ item.estado_anterior_nombre }}</span>
                    <span class="flecha">→</span>
                    <span class="estado-nuevo">{{ item.estado_nuevo_nombre }}</span>
                </div>
                <div v-if="item.comentario" class="historial-comentario">
                    <strong>Ficha Técnica:</strong> {{ item.comentario }}
                </div>
                </div>
            </div>
            </div>
        </div>

        <div class="form-actions">
          <button @click="cerrarDetalles" class="btn-secondary">Cerrar</button>
          <button @click="cambiarEstado(modalDetalles.incidencia!)" class="btn-estado">🔄 Cambiar Estado</button>
          <button @click="agregarComentario(modalDetalles.incidencia!)" class="btn-comentario">💬 Agregar Comentario</button>
        </div>
      </div>
    </div>

    <!-- Modal para cambiar estado (similar al del jefe) -->
    <div v-if="modalCambiarEstado.mostrar" class="modal-overlay" @click.self="cerrarCambiarEstado">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Cambiar Estado - Incidencia #{{ modalCambiarEstado.incidencia?.idIncidencia }}</h3>
          <button @click="cerrarCambiarEstado" class="btn-cerrar">×</button>
        </div>
        
        <form @submit.prevent="confirmarCambioEstado" class="modal-body">
          <div class="form-section">
            <div class="info-incidencia">
              <p><strong>Título:</strong> {{ modalCambiarEstado.incidencia?.titulo }}</p>
              <p><strong>Estado actual:</strong> 
                <span class="badge-estado" :class="getClaseEstado(modalCambiarEstado.incidencia?.estado_nombre)">
                  {{ modalCambiarEstado.incidencia?.estado_nombre }}
                </span>
              </p>
            </div>

            <div class="form-group">
              <label for="nuevoEstado">Nuevo Estado *</label>
              <select 
                id="nuevoEstado"
                v-model="formularioCambioEstado.idEstadoNuevo" 
                required
                class="form-select"
              >
                <option value="">Seleccionar estado...</option>
                <option 
                  v-for="estado in estadosDisponibles" 
                  :key="estado.idEstadoIncidencia" 
                  :value="estado.idEstadoIncidencia"
                  :disabled="estado.idEstadoIncidencia === modalCambiarEstado.incidencia?.idEstadoIncidencia"
                >
                  {{ estado.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="comentarioEstado">Ficha Técnica:</label>
              <textarea 
                id="comentarioEstado"
                v-model="formularioCambioEstado.comentario" 
                rows="4"
                placeholder="Agregar comentario sobre el cambio de estado..."
                class="form-textarea"
              ></textarea>
              <small>{{ formularioCambioEstado.comentario?.length || 0 }}/500 caracteres</small>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="cerrarCambiarEstado" class="btn-secondary">Cancelar</button>
            <button type="submit" :disabled="cargandoCambioEstado || !formularioCambioEstado.idEstadoNuevo" class="btn-primary">
              {{ cargandoCambioEstado ? 'Cambiando...' : 'Cambiar Estado' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal para agregar comentario -->
    <div v-if="modalComentario.mostrar" class="modal-overlay" @click.self="cerrarComentario">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Agregar Comentario - Incidencia #{{ modalComentario.incidencia?.idIncidencia }}</h3>
          <button @click="cerrarComentario" class="btn-cerrar">×</button>
        </div>
        
        <form @submit.prevent="confirmarComentario" class="modal-body">
          <div class="form-section">
            <div class="info-incidencia">
              <p><strong>Título:</strong> {{ modalComentario.incidencia?.titulo }}</p>
              <p><strong>Estado actual:</strong> 
                <span class="badge-estado" :class="getClaseEstado(modalComentario.incidencia?.estado_nombre)">
                  {{ modalComentario.incidencia?.estado_nombre }}
                </span>
              </p>
            </div>

            <div class="form-group">
              <label for="comentarioTecnico">Ficha Técnica:</label>
              <textarea 
                id="comentarioTecnico"
                v-model="formularioComentario.comentario" 
                required
                rows="6"
                placeholder="Describe el progreso, soluciones aplicadas, observaciones..."
                class="form-textarea"
              ></textarea>
              <small>{{ formularioComentario.comentario.length }}/1000 caracteres</small>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="cerrarComentario" class="btn-secondary">Cancelar</button>
            <button type="submit" :disabled="cargandoComentario || !formularioComentario.comentario.trim()" class="btn-primary">
              {{ cargandoComentario ? 'Guardando...' : '💾 Guardar Comentario' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { incidenciasService, type Incidencia, type HistorialIncidencia, type ActualizarIncidenciaRequest } from '../api/incidenciasAPI';

const router = useRouter();
const cargando = ref(false);
const incidencias = ref<Incidencia[]>([]);
const historialIncidencia = ref<HistorialIncidencia[]>([]);
const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

const filtroEstado = ref('');
const filtroPrioridad = ref('');
const terminoBusqueda = ref('');

// Estados para los modales
const modalDetalles = ref({
  mostrar: false,
  incidencia: null as Incidencia | null
});

const modalCambiarEstado = ref({
  mostrar: false,
  incidencia: null as Incidencia | null
});

const modalComentario = ref({
  mostrar: false,
  incidencia: null as Incidencia | null
});

// Formularios
const formularioCambioEstado = ref({
  idEstadoNuevo: null as number | null,
  comentario: ''
});

const formularioComentario = ref({
  comentario: ''
});

const cargandoCambioEstado = ref(false);
const cargandoComentario = ref(false);

// Estados disponibles para técnicos (excluye algunos estados)
const estadosTecnico = ref([
  { idEstadoIncidencia: 4, nombre: 'Asignado' },
  { idEstadoIncidencia: 5, nombre: 'En Proceso' },
  { idEstadoIncidencia: 6, nombre: 'Liberado' },
  { idEstadoIncidencia: 7, nombre: 'Cerrado' }
]);

const estadosDisponibles = computed(() => {
  if (!modalCambiarEstado.value.incidencia) return estadosTecnico.value;
  
  return estadosTecnico.value.filter(estado => 
    estado.idEstadoIncidencia !== modalCambiarEstado.value.incidencia?.idEstadoIncidencia
  );
});

// Computed properties para estadísticas
const incidenciasAsignadas = computed(() => {
  return incidencias.value;
});

const incidenciasEnProceso = computed(() => {
  return incidencias.value.filter(i => i.idEstadoIncidencia === 5);
});

const incidenciasPendientes = computed(() => {
  return incidencias.value.filter(i => i.idEstadoIncidencia === 4);
});

const incidenciasCompletadas = computed(() => {
  return incidencias.value.filter(i => i.idEstadoIncidencia === 6 || i.idEstadoIncidencia === 7);
});

const incidenciasFiltradas = computed(() => {
  let filtered = incidencias.value;

  if (filtroEstado.value) {
    filtered = filtered.filter(i => i.idEstadoIncidencia === Number(filtroEstado.value));
  }

  if (filtroPrioridad.value) {
    filtered = filtered.filter(i => i.prioridad === filtroPrioridad.value);
  }

  if (terminoBusqueda.value) {
    const searchTerm = terminoBusqueda.value.toLowerCase();
    filtered = filtered.filter(i => 
      i.titulo.toLowerCase().includes(searchTerm) ||
      i.descripcion.toLowerCase().includes(searchTerm)
    );
  }

  return filtered.sort((a, b) => (a.idIncidencia || 0) - (b.idIncidencia || 0));
});

// Funciones helper
const getClaseEstado = (estado: string | undefined) => {
  const estadoMap: { [key: string]: string } = {
    'Asignado': 'estado-asignado',
    'En Proceso': 'estado-proceso',
    'Liberado': 'estado-liberado',
    'Cerrado': 'estado-cerrado'
  };
  return estadoMap[estado || ''] || 'estado-default';
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
    // Usar el nuevo endpoint para obtener incidencias asignadas al técnico
    const response = await incidenciasService.obtenerIncidenciasPorTecnico(usuarioActual.value.idUsuario);
    incidencias.value = response.data;
    
    console.log('Incidencias cargadas para técnico:', incidencias.value);
    console.log('ID del técnico:', usuarioActual.value.idUsuario);
  } catch (error) {
    console.error('Error al cargar incidencias:', error);
    alert('Error al cargar las incidencias. Verifica la conexión con el servidor.');
  } finally {
    cargando.value = false;
  }
};

const cargarHistorial = async (idIncidencia: number) => {
  try {
    const response = await incidenciasService.obtenerHistorial(idIncidencia);
    historialIncidencia.value = response.data;
  } catch (error) {
    console.error('Error al cargar historial:', error);
  }
};

// Funciones de los modales
const verDetallesIncidencia = async (incidencia: Incidencia) => {
  modalDetalles.value = {
    mostrar: true,
    incidencia: incidencia
  };
  await cargarHistorial(incidencia.idIncidencia!);
};

const cerrarDetalles = () => {
  modalDetalles.value.mostrar = false;
  historialIncidencia.value = [];
};

const cambiarEstado = (incidencia: Incidencia) => {
  modalCambiarEstado.value = {
    mostrar: true,
    incidencia: incidencia
  };
  formularioCambioEstado.value = {
    idEstadoNuevo: null,
    comentario: ''
  };
};

const cerrarCambiarEstado = () => {
  modalCambiarEstado.value.mostrar = false;
  formularioCambioEstado.value = {
    idEstadoNuevo: null,
    comentario: ''
  };
};

const agregarComentario = (incidencia: Incidencia) => {
  modalComentario.value = {
    mostrar: true,
    incidencia: incidencia
  };
  formularioComentario.value = {
    comentario: ''
  };
};

const cerrarComentario = () => {
  modalComentario.value.mostrar = false;
  formularioComentario.value = {
    comentario: ''
  };
};

// Funciones de negocio
const confirmarCambioEstado = async () => {
  if (!modalCambiarEstado.value.incidencia?.idIncidencia || !formularioCambioEstado.value.idEstadoNuevo) return;

  cargandoCambioEstado.value = true;
  try {
    const incidenciaId = modalCambiarEstado.value.incidencia.idIncidencia!;
    const nuevoEstadoId = formularioCambioEstado.value.idEstadoNuevo;

    // Actualizar el estado de la incidencia
    const datosActualizacion: ActualizarIncidenciaRequest = {
      idEstadoIncidencia: nuevoEstadoId
    };

    await incidenciasService.actualizarIncidencia(incidenciaId, datosActualizacion);

    // Agregar entrada al historial
    const estadoNuevo = estadosTecnico.value.find(e => e.idEstadoIncidencia === nuevoEstadoId);
    const estadoAnterior = modalCambiarEstado.value.incidencia.estado_nombre;
    
    const comentario = formularioCambioEstado.value.comentario || 
      `Estado cambiado de "${estadoAnterior}" a "${estadoNuevo?.nombre}"`;

    await incidenciasService.agregarHistorial(incidenciaId, {
      idEstadoNuevo: nuevoEstadoId,
      comentario: comentario
    });

    // Si el estado es "Cerrado", actualizar la fecha de cierre
    if (nuevoEstadoId === 7) { // ID 7 = Cerrado
      // Actualizar la incidencia con la fecha de cierre y todos los campos requeridos
      const incidenciaActual = modalCambiarEstado.value.incidencia;
      await incidenciasService.actualizarIncidencia(incidenciaId, {
        titulo: incidenciaActual.titulo,
        descripcion: incidenciaActual.descripcion,
        idEstadoIncidencia: nuevoEstadoId,
        idTipoIncidencia: incidenciaActual.idTipoIncidencia,
        idTecnicoAsignado: incidenciaActual.idTecnicoAsignado,
        prioridad: incidenciaActual.prioridad
      });
    }

    alert('Estado cambiado correctamente');
    cerrarCambiarEstado();
    cargarDatos();
  } catch (error: any) {
    console.error('Error al cambiar estado:', error);
    alert('Error al cambiar estado: ' + (error.response?.data?.error || error.message));
  } finally {
    cargandoCambioEstado.value = false;
  }
};

const confirmarComentario = async () => {
  if (!modalComentario.value.incidencia?.idIncidencia) return;

  cargandoComentario.value = true;
  try {
    const incidenciaId = modalComentario.value.incidencia.idIncidencia!;
    
    // Agregar comentario al historial sin cambiar estado
    await incidenciasService.agregarHistorial(incidenciaId, {
      idEstadoNuevo: modalComentario.value.incidencia.idEstadoIncidencia,
      comentario: formularioComentario.value.comentario
    });

    alert('✅ Comentario agregado correctamente');
    cerrarComentario();
    cargarDatos();
  } catch (error: any) {
    console.error('Error al agregar comentario:', error);
    alert('❌ Error al agregar comentario: ' + (error.response?.data?.error || error.message));
  } finally {
    cargandoComentario.value = false;
  }
};

const aplicarFiltros = () => {
  // Los filtros se aplican automáticamente mediante computed properties
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.tecnico-incidencias {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.welcome-message {
  color: #6b7280;
  font-size: 16px;
  margin-top: 10px;
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

.estadistica-card .en-proceso {
  color: #f59e0b;
}

.estadistica-card .pendientes {
  color: #ef4444;
}

.estadistica-card .completadas {
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

.btn-comentario, .btn-estado, .btn-info, .btn-secondary, .btn-primary {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 10px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-comentario:hover {
  background: #059669;
}

.btn-estado {
  background: #3b82f6;
}

.btn-estado:hover {
  background: #2563eb;
}

.btn-info {
  background: #6b7280;
}

.btn-info:hover {
  background: #4b5563;
}

.btn-secondary {
  background: #9ca3af;
}

.btn-secondary:hover {
  background: #6b7280;
}

.btn-primary {
  background: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
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

.data-table tbody tr:hover {
  background: #f8fafc;
  cursor: pointer;
}

.titulo-incidencia {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  white-space: nowrap;
  text-align: center;
}

/* Estilos para badges y modales (reutilizar los de GestionIncidenciasView) */
.badge-estado, .badge-prioridad {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.estado-asignado { background: #e0e7ff; color: #3730a3; }
.estado-proceso { background: #f0fdf4; color: #166534; }
.estado-liberado { background: #ecfdf5; color: #047857; }
.estado-cerrado { background: #f3f4f6; color: #6b7280; }

.badge-prioridad.baja { background: #f0fdf4; color: #166534; }
.badge-prioridad.media { background: #fefce8; color: #ca8a04; }
.badge-prioridad.alta { background: #fff7ed; color: #ea580c; }
.badge-prioridad.critica { background: #fef2f2; color: #dc2626; }

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

.historial-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.historial-item {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.historial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7280;
}

.historial-cambio {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.estado-anterior, .estado-nuevo {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.estado-anterior {
  background: #f3f4f6;
  color: #6b7280;
}

.estado-nuevo {
  background: #dbeafe;
  color: #1e40af;
}

.historial-comentario {
  background: #f8fafc;
  padding: 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #374151;
}

.form-section {
  margin-bottom: 25px;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}

.tipo-usuario {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 8px;
  margin-left: 5px;
}

.tipo-usuario.jefe de taller {
  background: #dbeafe;
  color: #1e40af;
}

.tipo-usuario.técnico {
  background: #f0fdf4;
  color: #166534;
}

.tipo-usuario.maestro {
  background: #fef3c7;
  color: #d97706;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input, .form-select, .form-textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-group small {
  margin-top: 5px;
  color: #6b7280;
  font-size: 12px;
}

.info-incidencia {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #bae6fd;    
    margin-bottom: 20px;
}
</style>