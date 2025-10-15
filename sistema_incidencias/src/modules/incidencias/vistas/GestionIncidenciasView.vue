<template>
  <div class="gestion-incidencias">
    <div class="header">
      <h1>Gestión de Incidencias</h1>
      <div class="header-actions">
        <button @click="mostrarModalReportar" class="btn-primary">
          {{ esJefeTaller ? '➕ Nueva Incidencia' : '➕Reportar Incidencia' }}
        </button>
      </div>
    </div>
    
    <!-- SOLO JEFE DE TALLER VE LA TABLA DE GESTIÓN -->
    <div v-if="esJefeTaller">
      <div class="filtros">
        <div class="filtro-group">
          <label for="filtroEstado">Filtrar por estado:</label>
          <select id="filtroEstado" v-model="filtroEstado" @change="aplicarFiltros">
            <option value="">Todos los estados</option>
            <option v-for="estado in estadosIncidencia" :key="estado.idEstadoIncidencia" :value="estado.idEstadoIncidencia">
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

      <!-- Tabla de incidencias (solo para Jefe de Taller) -->
      <div v-if="cargando" class="loading">Cargando incidencias...</div>
      <div v-else-if="incidenciasFiltradas.length === 0" class="no-data">
        <p v-if="terminoBusqueda || filtroEstado || filtroPrioridad">
          No se encontraron incidencias que coincidan con los filtros
        </p>
        <p v-else>No hay incidencias reportadas</p>
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
              <th>Técnico</th>
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
              <td>{{ incidencia.tecnico_asignado_nombre || 'No asignado' }}</td>
              <td>{{ formatFecha(incidencia.fecha_creacion) }}</td>
              <td class="actions" @click.stop>
                <button @click="verDetallesIncidencia(incidencia)" class="btn-info" title="Ver detalles">👁️</button>
                <button @click="editarIncidencia(incidencia)" class="btn-edit" title="Editar">✏️</button>
                <button @click="asignarTecnico(incidencia)" class="btn-asignar" title="Asignar técnico">👨‍💼</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL DETALLES DE INCIDENCIA -->
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
                  <label>Técnico asignado:</label>
                  <span v-if="modalDetalles.incidencia.tecnico_asignado_nombre" class="tecnico-asignado">
                    {{ modalDetalles.incidencia.tecnico_asignado_nombre }}
                  </span>
                  <span v-else class="sin-tecnico">No asignado</span>
                </div>
                <div class="detalle-item">
                  <label>Departamento:</label>
                  <span>{{ modalDetalles.incidencia.departamento_nombre || 'No especificado' }}</span>
                </div>
                <div class="detalle-item">
                  <label>Fecha reporte:</label>
                  <span>{{ formatFecha(modalDetalles.incidencia.fecha_creacion) }}</span>
                </div>
                <div class="detalle-item">
                  <label>Última actualización:</label>
                  <span>{{ formatFecha(modalDetalles.incidencia.fecha_actualizacion) }}</span>
                </div>
                <div class="detalle-item" v-if="modalDetalles.incidencia.fecha_cierre">
                  <label>Fecha cierre:</label>
                  <span>{{ formatFecha(modalDetalles.incidencia.fecha_cierre) }}</span>
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

            <!-- Equipo Afectado -->
            <div class="seccion" v-if="modalDetalles.incidencia.equipo_nombre">
              <h4>Equipo Afectado</h4>
              <div class="detalle-item">
                <label>Equipo:</label>
                <span>{{ modalDetalles.incidencia.equipo_nombre }}</span>
              </div>
            </div>

            <!-- Comentarios de Cierre -->
            <div class="seccion" v-if="modalDetalles.incidencia.comentarios_cierre">
              <h4>Comentarios de Cierre</h4>
              <div class="comentarios-cierre">
                {{ modalDetalles.incidencia.comentarios_cierre }}
              </div>
            </div>

            <!-- Historial -->
            <div class="seccion" v-if="historialIncidencia.length > 0">
              <h4>Historial de Cambios ({{ historialIncidencia.length }})</h4>
              <div class="historial-list">
                <div v-for="item in historialIncidencia" :key="item.idHistorial" class="historial-item">
                  <div class="historial-header">
                    <span class="historial-fecha">{{ formatFechaHora(item.fecha_cambio) }}</span>
                    <span class="historial-usuario">{{ item.usuario_cambio_nombre }}</span>
                  </div>
                  <div class="historial-cambio">
                    <span class="estado-anterior">{{ item.estado_anterior_nombre }}</span>
                    <span class="flecha">→</span>
                    <span class="estado-nuevo">{{ item.estado_nuevo_nombre }}</span>
                  </div>
                  <div v-if="item.comentario" class="historial-comentario">
                    {{ item.comentario }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="cerrarDetalles" class="btn-secondary">Cerrar</button>
            <button @click="editarIncidencia(modalDetalles.incidencia!)" class="btn-edit">✏️ Editar</button>
            <button @click="asignarTecnico(modalDetalles.incidencia!)" 
                    class="btn-asignar" 
                    v-if="!modalDetalles.incidencia?.fecha_cierre">
              👨‍💼 Asignar Técnico
            </button>
            <button @click="cambiarEstado(modalDetalles.incidencia!)" 
                    class="btn-estado" 
                    v-if="!modalDetalles.incidencia?.fecha_cierre">
              🔄 Cambiar Estado
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL ASIGNAR TÉCNICO -->
      <div v-if="modalAsignarTecnico.mostrar" class="modal-overlay" @click.self="cerrarAsignarTecnico">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Asignar Técnico a Incidencia #{{ modalAsignarTecnico.incidencia?.idIncidencia }}</h3>
            <button @click="cerrarAsignarTecnico" class="btn-cerrar">×</button>
          </div>
          
          <form @submit.prevent="confirmarAsignacion" class="modal-body">
            <div class="form-section">
              <div class="info-incidencia">
                <p><strong>Título:</strong> {{ modalAsignarTecnico.incidencia?.titulo }}</p>
                <p><strong>Reportado por:</strong> {{ modalAsignarTecnico.incidencia?.usuario_reporta_nombre }}</p>
              </div>

              <div class="form-group">
                <label for="idTecnico">Seleccionar Técnico *</label>
                <select 
                  id="idTecnico"
                  v-model="formularioAsignacion.idTecnico" 
                  required
                  class="form-select"
                >
                  <option value="">Seleccionar técnico...</option>
                  <option 
                    v-for="tecnico in tecnicosDisponibles" 
                    :key="tecnico.idUsuario" 
                    :value="tecnico.idUsuario"
                  >
                    {{ tecnico.nombre }} {{ tecnico.apellidoPat }} 
                    ({{ tecnico.incidenciasAsignadas }} incidencias)
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="comentarioAsignacion">Comentario (Opcional)</label>
                <textarea 
                  id="comentarioAsignacion"
                  v-model="formularioAsignacion.comentario" 
                  rows="3"
                  placeholder="Agregar comentario sobre la asignación..."
                  class="form-textarea"
                ></textarea>
                <small>{{ formularioAsignacion.comentario?.length || 0 }}/500 caracteres</small>
              </div>

              <!-- Información del técnico seleccionado -->
              <div v-if="tecnicoSeleccionado" class="tecnico-info">
                <h4>Información del Técnico Seleccionado</h4>
                <div class="detalles-grid">
                  <div class="detalle-item">
                    <label>Nombre:</label>
                    <span>{{ tecnicoSeleccionado.nombre }} {{ tecnicoSeleccionado.apellidoPat }}</span>
                  </div>
                  <div class="detalle-item">
                    <label>Email:</label>
                    <span>{{ tecnicoSeleccionado.email }}</span>
                  </div>
                  <div class="detalle-item">
                    <label>Departamento:</label>
                    <span>{{ tecnicoSeleccionado.departamento_nombre || 'No asignado' }}</span>
                  </div>
                  <div class="detalle-item">
                    <label>Incidencias activas:</label>
                    <span :class="getClaseCarga(tecnicoSeleccionado.incidenciasAsignadas)">
                      {{ tecnicoSeleccionado.incidenciasAsignadas }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="cerrarAsignarTecnico" class="btn-secondary">Cancelar</button>
              <button type="submit" :disabled="cargandoAsignacion || !formularioAsignacion.idTecnico" class="btn-primary">
                {{ cargandoAsignacion ? 'Asignando...' : 'Asignar Técnico' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL EDITAR INCIDENCIA -->
      <div v-if="modalEditar.mostrar" class="modal-overlay" @click.self="cerrarEditar">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Editar Incidencia #{{ modalEditar.incidencia?.idIncidencia }}</h3>
            <button @click="cerrarEditar" class="btn-cerrar">×</button>
          </div>
          
          <form @submit.prevent="confirmarEdicion" class="modal-body">
            <div class="form-section">
              <div class="form-group">
                <label for="tituloEditar">Título *</label>
                <input 
                  id="tituloEditar"
                  v-model="formularioEdicion.titulo" 
                  type="text" 
                  required 
                  maxlength="255"
                  class="form-input"
                >
              </div>
              
              <div class="form-group">
                <label for="descripcionEditar">Descripción *</label>
                <textarea 
                  id="descripcionEditar"
                  v-model="formularioEdicion.descripcion" 
                  required
                  rows="4"
                  maxlength="1000"
                  class="form-textarea"
                ></textarea>
                <small>{{ formularioEdicion.descripcion.length }}/1000 caracteres</small>
              </div>
              
              <div class="form-grid">
                <div class="form-group">
                  <label for="prioridadEditar">Prioridad *</label>
                  <select 
                    id="prioridadEditar"
                    v-model="formularioEdicion.prioridad" 
                    required
                    class="form-select"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="tipoEditar">Tipo de Incidencia *</label>
                  <select 
                    id="tipoEditar"
                    v-model="formularioEdicion.idTipoIncidencia" 
                    required
                    class="form-select"
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option 
                      v-for="tipo in tiposIncidencia" 
                      :key="tipo.idTipoIncidencia" 
                      :value="tipo.idTipoIncidencia"
                    >
                      {{ tipo.nombre }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="cerrarEditar" class="btn-secondary">Cancelar</button>
              <button type="submit" :disabled="cargandoEdicion" class="btn-primary">
                {{ cargandoEdicion ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- PARA USUARIOS NO JEFE DE TALLER: MOSTRAR SOLO EL FORMULARIO -->
    <div v-else class="solo-reportar">
      <div class="welcome-section">
        <div class="welcome-card">
          <h2>¡Hola, {{ usuarioActual.nombre }}!</h2>
          <p>Desde aquí puedes reportar incidencias técnicas que encuentres en los equipos.</p>
          
          <div class="tip-box">
            <h3>Tipos de incidencias que puedes reportar:</h3>
            <ul>
              <li><strong>Problemas de hardware</strong> - Equipos que no encienden, fallas en componentes</li>
              <li><strong>Problemas de software</strong> - Programas que no funcionan, errores del sistema</li>
              <li><strong>Problemas de red</strong> - Sin conexión a internet, red lenta</li>
              <li><strong>Equipos periféricos</strong> - Impresoras, proyectores, etc.</li>
              <li><strong>Otros problemas</strong> - Cualquier inconveniente técnico</li>
            </ul>
          </div>

          <button @click="mostrarModalReportar" class="btn-primary large-btn">
            Reportar Nueva Incidencia
          </button>
        </div>
      </div>

      <!-- Mis incidencias recientes (solo lectura) -->
      <div v-if="misIncidencias.length > 0" class="mis-incidencias">
        <h3>Mis Incidencias Reportadas</h3>
        <div class="incidencias-list">
          <div v-for="incidencia in misIncidencias" :key="incidencia.idIncidencia" 
               class="incidencia-card" :class="incidencia.prioridad">
            <div class="incidencia-header">
              <span class="incidencia-id">#{{ incidencia.idIncidencia }}</span>
              <span class="incidencia-estado" :class="getClaseEstado(incidencia.estado_nombre)">
                {{ incidencia.estado_nombre }}
              </span>
            </div>
            <h4 class="incidencia-titulo">{{ incidencia.titulo }}</h4>
            <p class="incidencia-descripcion">{{ incidencia.descripcion }}</p>
            <div class="incidencia-footer">
              <span class="incidencia-fecha">{{ formatFecha(incidencia.fecha_creacion) }}</span>
              <span class="incidencia-prioridad" :class="incidencia.prioridad">
                {{ getTextoPrioridad(incidencia.prioridad) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para reportar incidencia (compartido por todos) -->
    <ModalReportarIncidencia 
      :mostrar="modalReportar.mostrar"
      :equipos="equipos"
      :departamentos="departamentos"
      :tiposIncidencia="tiposIncidencia"
      @cerrar="modalReportar.mostrar = false"
      @guardado="handleGuardado"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { incidenciasService, type Incidencia, type HistorialIncidencia, type ActualizarIncidenciaRequest } from '../api/incidenciasAPI';
import { equiposService, type Equipo } from '../../configuracion/api/equiposAPI';
import { ubicacionesService, type Departamento } from '../../configuracion/api/ubicacionesAPI';
import { usuariosService, type UsuarioCompleto } from '../../configuracion/api/usuariosAPI';
import ModalReportarIncidencia from '../componentes/ModalReportarIncidencia.vue';

const router = useRouter();
const cargando = ref(false);
const incidencias = ref<Incidencia[]>([]);
const equipos = ref<Equipo[]>([]);
const departamentos = ref<Departamento[]>([]);
const tecnicos = ref<UsuarioCompleto[]>([]);
const historialIncidencia = ref<HistorialIncidencia[]>([]);
const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

const filtroEstado = ref('');
const filtroPrioridad = ref('');
const terminoBusqueda = ref('');

const modalReportar = ref({
  mostrar: false
});

// Estados para los nuevos modales
const modalDetalles = ref({
  mostrar: false,
  incidencia: null as Incidencia | null
});

const modalAsignarTecnico = ref({
  mostrar: false,
  incidencia: null as Incidencia | null
});

const modalEditar = ref({
  mostrar: false,
  incidencia: null as Incidencia | null
});

// Formularios
const formularioAsignacion = ref({
  idTecnico: null as number | null,
  comentario: ''
});

const formularioEdicion = ref({
  titulo: '',
  descripcion: '',
  prioridad: 'media' as 'baja' | 'media' | 'alta' | 'critica',
  idTipoIncidencia: 0
});

const cargandoAsignacion = ref(false);
const cargandoEdicion = ref(false);

// Computed para verificar si es Jefe de Taller
const esJefeTaller = computed(() => {
  return usuarioActual.value.tipo_usuario_nombre === 'Jefe de Taller';
});

// Computed para mostrar solo las incidencias del usuario actual (para no jefes)
const misIncidencias = computed(() => {
  if (esJefeTaller.value) return [];
  return incidencias.value.filter(incidencia => 
    incidencia.idUsuarioReporta === usuarioActual.value.idUsuario
  ).slice(0, 5); 
});

// Computed para técnicos disponibles
const tecnicosDisponibles = computed(() => {
  return tecnicos.value.map(tecnico => {
    const incidenciasAsignadas = incidencias.value.filter(
      incidencia => incidencia.idTecnicoAsignado === tecnico.idUsuario && 
                   !incidencia.fecha_cierre
    ).length;
    
    return {
      ...tecnico,
      incidenciasAsignadas
    };
  }).sort((a, b) => a.incidenciasAsignadas - b.incidenciasAsignadas);
});

const tecnicoSeleccionado = computed(() => {
  if (!formularioAsignacion.value.idTecnico) return null;
  return tecnicosDisponibles.value.find(t => t.idUsuario === formularioAsignacion.value.idTecnico) || null;
});

// Datos estáticos para tipos y estados (deberían venir de la API)
const tiposIncidencia = ref([
  { idTipoIncidencia: 1, nombre: 'Mantenimiento Correctivo' },
  { idTipoIncidencia: 2, nombre: 'Mantenimiento Preventivo' },
  { idTipoIncidencia: 3, nombre: 'Falla Hardware' },
  { idTipoIncidencia: 4, nombre: 'Falla Software' },
  { idTipoIncidencia: 5, nombre: 'Solicitud de Equipo' }
]);

const estadosIncidencia = ref([
  { idEstadoIncidencia: 1, nombre: 'Enviado' },
  { idEstadoIncidencia: 2, nombre: 'Revisión Jefe' },
  { idEstadoIncidencia: 3, nombre: 'Rechazado' },
  { idEstadoIncidencia: 4, nombre: 'Asignado' },
  { idEstadoIncidencia: 5, nombre: 'En Proceso' },
  { idEstadoIncidencia: 6, nombre: 'Liberado' },
  { idEstadoIncidencia: 7, nombre: 'Cerrado' }
]);

const incidenciasFiltradas = computed(() => {
  if (!esJefeTaller.value) return [];
  
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

  return filtered;
});

const getClaseEstado = (estado: string | undefined) => {
  const estadoMap: { [key: string]: string } = {
    'Enviado': 'estado-enviado',
    'Revisión Jefe': 'estado-revision',
    'Rechazado': 'estado-rechazado',
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

const getClaseCarga = (incidenciasAsignadas: number) => {
  if (incidenciasAsignadas === 0) return 'carga-baja';
  if (incidenciasAsignadas <= 2) return 'carga-media';
  return 'carga-alta';
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

const cargarDatos = async () => {
  cargando.value = true;
  try {
    const [resIncidencias, resEquipos, resDepartamentos, resTecnicos] = await Promise.all([
      incidenciasService.obtenerIncidencias(),
      equiposService.obtenerEquipos(),
      ubicacionesService.obtenerDepartamentos(),
      usuariosService.obtenerTecnicos() 
    ]);
    
    incidencias.value = resIncidencias.data;
    equipos.value = resEquipos.data;
    departamentos.value = resDepartamentos.data;
    tecnicos.value = resTecnicos.data;
    
    console.log('Técnicos cargados:', tecnicos.value); 
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

const mostrarModalReportar = () => {
  modalReportar.value.mostrar = true;
};

// Funciones para abrir/cerrar modales
const verDetallesIncidencia = async (incidencia: Incidencia) => {
  if (esJefeTaller.value) {
    modalDetalles.value = {
      mostrar: true,
      incidencia: incidencia
    };
    await cargarHistorial(incidencia.idIncidencia!);
  }
};

const cerrarDetalles = () => {
  modalDetalles.value.mostrar = false;
  historialIncidencia.value = [];
};

const asignarTecnico = (incidencia: Incidencia) => {
  modalAsignarTecnico.value = {
    mostrar: true,
    incidencia: incidencia
  };
  // Pre-seleccionar técnico si ya está asignado
  if (incidencia.idTecnicoAsignado) {
    formularioAsignacion.value.idTecnico = incidencia.idTecnicoAsignado;
  }
};

const cerrarAsignarTecnico = () => {
  modalAsignarTecnico.value.mostrar = false;
  formularioAsignacion.value = {
    idTecnico: null,
    comentario: ''
  };
};

const editarIncidencia = (incidencia: Incidencia) => {
  modalEditar.value = {
    mostrar: true,
    incidencia: incidencia
  };
  // Llenar formulario con datos actuales
  formularioEdicion.value = {
    titulo: incidencia.titulo,
    descripcion: incidencia.descripcion,
    prioridad: incidencia.prioridad,
    idTipoIncidencia: incidencia.idTipoIncidencia
  };
};

const cerrarEditar = () => {
  modalEditar.value.mostrar = false;
  formularioEdicion.value = {
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    idTipoIncidencia: 0
  };
};

const cambiarEstado = (incidencia: Incidencia) => {
  // Implementar cambio de estado
  console.log('Cambiar estado de:', incidencia);
  alert('Funcionalidad de cambio de estado en desarrollo');
};

// Funciones de negocio
const cargarHistorial = async (idIncidencia: number) => {
  try {
    const response = await incidenciasService.obtenerHistorial(idIncidencia);
    historialIncidencia.value = response.data;
  } catch (error) {
    console.error('Error al cargar historial:', error);
  }
};

const confirmarAsignacion = async () => {
  if (!modalAsignarTecnico.value.incidencia?.idIncidencia || !formularioAsignacion.value.idTecnico) return;

  cargandoAsignacion.value = true;
  try {
    const incidenciaActual = modalAsignarTecnico.value.incidencia;
    
    const datosActualizacion: ActualizarIncidenciaRequest = {
      titulo: incidenciaActual.titulo,
      descripcion: incidenciaActual.descripcion,
      idEstadoIncidencia: 4, 
      idTipoIncidencia: incidenciaActual.idTipoIncidencia,
      idTecnicoAsignado: formularioAsignacion.value.idTecnico,
      prioridad: incidenciaActual.prioridad
    };

    console.log('Enviando datos de actualización:', datosActualizacion);

    // Actualizar la incidencia con todos los campos requeridos
    await incidenciasService.actualizarIncidencia(
      modalAsignarTecnico.value.incidencia.idIncidencia!, 
      datosActualizacion
    );

    // Agregar al historial
    const tecnico = tecnicos.value.find(t => t.idUsuario === formularioAsignacion.value.idTecnico);
    const comentario = formularioAsignacion.value.comentario || 
      `Incidencia asignada al técnico ${tecnico?.nombre} ${tecnico?.apellidoPat}`;
    
    await incidenciasService.agregarHistorial(
      modalAsignarTecnico.value.incidencia.idIncidencia!, 
      {
        idEstadoNuevo: 4,
        comentario: comentario
      }
    );

    alert('Técnico asignado correctamente');
    cerrarAsignarTecnico();
    cargarDatos(); 
  } catch (error: any) {
    console.error('Error completo al asignar técnico:', error);
    console.error('Datos del error:', error.response?.data);
    alert('Error al asignar técnico: ' + (error.response?.data?.error || error.message));
  } finally {
    cargandoAsignacion.value = false;
  }
};

const confirmarEdicion = async () => {
  if (!modalEditar.value.incidencia?.idIncidencia) return;

  cargandoEdicion.value = true;
  try {
    const datosActualizacion: ActualizarIncidenciaRequest = {
      titulo: formularioEdicion.value.titulo,
      descripcion: formularioEdicion.value.descripcion,
      prioridad: formularioEdicion.value.prioridad,
      idTipoIncidencia: formularioEdicion.value.idTipoIncidencia
    };

    await incidenciasService.actualizarIncidencia(
      modalEditar.value.incidencia.idIncidencia!, 
      datosActualizacion
    );

    alert('Incidencia actualizada correctamente');
    cerrarEditar();
    cargarDatos(); 
  } catch (error: any) {
    alert('Error al actualizar incidencia: ' + (error.response?.data?.error || error.message));
  } finally {
    cargandoEdicion.value = false;
  }
};

// Manejar eventos de los modales
const handleGuardado = () => {
  cargarDatos();
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.gestion-incidencias {
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

.solo-reportar {
  max-width: 800px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 30px;
}

.welcome-card {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.welcome-card h2 {
  color: #1f2937;
  margin-bottom: 10px;
}

.welcome-card p {
  color: #6b7280;
  margin-bottom: 25px;
  font-size: 16px;
}

.tip-box {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 20px;
  margin: 25px 0;
  text-align: left;
}

.tip-box h3 {
  color: #0369a1;
  margin-bottom: 15px;
}

.tip-box ul {
  list-style: none;
  padding: 0;
}

.tip-box li {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.tip-box li:last-child {
  border-bottom: none;
}

.large-btn {
  padding: 12px 24px;
  font-size: 16px;
  margin-top: 15px;
}

.mis-incidencias {
  margin-top: 40px;
}

.mis-incidencias h3 {
  margin-bottom: 20px;
  color: #1f2937;
}

.incidencias-list {
  display: grid;
  gap: 15px;
}

.incidencia-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  border-left: 4px solid #e5e7eb;
}

.incidencia-card.alta {
  border-left-color: #f59e0b;
}

.incidencia-card.critica {
  border-left-color: #dc2626;
}

.incidencia-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.incidencia-id {
  font-weight: bold;
  color: #374151;
}

.incidencia-titulo {
  margin: 0 0 10px 0;
  color: #1f2937;
  font-size: 16px;
}

.incidencia-descripcion {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.4;
}

.incidencia-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
}

/* ESTILOS PARA JEFE DE TALLER */
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
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
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

.data-table th {
  background: #f8fafc;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e5e7eb;
}

.fila-clickeable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.fila-clickeable:hover {
  background: #f9fafb;
}

.titulo-incidencia {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  gap: 5px;
}

.btn-info, .btn-edit, .btn-asignar {
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.btn-info {
  background: #dbeafe;
  color: #1e40af;
}

.btn-info:hover {
  background: #bfdbfe;
}

.btn-edit {
  background: #fef3c7;
  color: #d97706;
}

.btn-edit:hover {
  background: #fde68a;
}

.btn-asignar {
  background: #e0e7ff;
  color: #3730a3;
}

.btn-asignar:hover {
  background: #c7d2fe;
}

/* MODALES (estilos consistentes) */
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
  max-width: 900px;
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

.btn-cerrar:hover {
  color: #374151;
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

.descripcion-content, .comentarios-cierre {
  background: #f8fafc;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  line-height: 1.6;
  white-space: pre-wrap;
}

.comentarios-cierre {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

/* Estilos para el historial */
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

/* Badges y estados */
.badge-estado, .badge-prioridad {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.estado-enviado { background: #dbeafe; color: #1e40af; }
.estado-revision { background: #fef3c7; color: #d97706; }
.estado-rechazado { background: #fee2e2; color: #dc2626; }
.estado-asignado { background: #e0e7ff; color: #3730a3; }
.estado-proceso { background: #f0fdf4; color: #166534; }
.estado-liberado { background: #ecfdf5; color: #047857; }
.estado-cerrado { background: #f3f4f6; color: #6b7280; }

.badge-prioridad.baja { background: #f0fdf4; color: #166534; }
.badge-prioridad.media { background: #fefce8; color: #ca8a04; }
.badge-prioridad.alta { background: #fff7ed; color: #ea580c; }
.badge-prioridad.critica { background: #fef2f2; color: #dc2626; }

.tecnico-asignado {
  color: #059669;
  font-weight: 500;
}

.sin-tecnico {
  color: #dc2626;
  font-style: italic;
}

.carga-baja { color: #059669; }
.carga-media { color: #d97706; }
.carga-alta { color: #dc2626; }

/* Botones especiales */
.btn-asignar {
  background: #8b5cf6;
  color: white;
}

.btn-asignar:hover {
  background: #7c3aed;
}

.btn-estado {
  background: #f59e0b;
  color: white;
}

.btn-estado:hover {
  background: #d97706;
}

/* Estilos de formulario consistentes */
.form-section {
  margin-bottom: 25px;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
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

.tecnico-info {
  background: #f8fafc;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-top: 20px;
}

.tecnico-info h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 14px;
}

/* Botones generales */
.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
}

/* Estados de carga y datos vacíos */
.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}

.no-data {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
</style>