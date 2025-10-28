import axios from "axios";
import type { AxiosResponse } from "axios";

export interface Incidencia {
  idIncidencia?: number;
  titulo: string;
  descripcion: string;
  idEstadoIncidencia: number;
  idTipoIncidencia: number;
  idUsuarioReporta: number;
  idEquipo?: number | null;
  idTecnicoAsignado?: number | null;
  idDepartamento?: number | null;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  comentarios_cierre?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_cierre?: string;
  
  // Campos relacionales
  estado_nombre?: string;
  tipo_incidencia_nombre?: string;
  usuario_reporta_nombre?: string;
  tecnico_asignado_nombre?: string;
  equipo_nombre?: string;
  departamento_nombre?: string;
}

export interface CrearIncidenciaRequest {
  titulo: string;
  descripcion: string;
  idTipoIncidencia: number;
  idEquipo?: number | null;
  idDepartamento?: number | null;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
}

export interface ActualizarIncidenciaRequest {
  titulo?: string;
  descripcion?: string;
  idEstadoIncidencia?: number;
  idTipoIncidencia?: number;
  idTecnicoAsignado?: number | null;
  prioridad?: 'baja' | 'media' | 'alta' | 'critica';
  comentarios_cierre?: string;
}

export interface HistorialIncidencia {
  idHistorial?: number;
  idIncidencia: number;
  idEstadoAnterior: number;
  idEstadoNuevo: number;
  idUsuarioCambio: number;
  fecha_cambio: string;
  comentario?: string;
  
  // Campos relacionales
  estado_anterior_nombre?: string;
  estado_nuevo_nombre?: string;
  usuario_cambio_nombre?: string;
}

const incidenciasAPI = axios.create({
  baseURL: "http://localhost:3001",
});

incidenciasAPI.interceptors.request.use((config) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario.idUsuario) {
    config.headers['usuario-id'] = usuario.idUsuario;
  }
  return config;
});

export const incidenciasService = {
  // Obtener todas las incidencias
  obtenerIncidencias: (): Promise<AxiosResponse<Incidencia[]>> =>
    incidenciasAPI.get<Incidencia[]>('/incidencias'),

  // Obtener incidencias por usuario
  obtenerIncidenciasPorUsuario: (idUsuario: number): Promise<AxiosResponse<Incidencia[]>> =>
    incidenciasAPI.get<Incidencia[]>(`/usuarios/${idUsuario}/incidencias`),

  // Obtener incidencia por ID
  obtenerIncidencia: (idIncidencia: number): Promise<AxiosResponse<Incidencia>> =>
    incidenciasAPI.get<Incidencia>(`/incidencias/${idIncidencia}`),

  // Crear nueva incidencia
  crearIncidencia: (incidencia: CrearIncidenciaRequest): Promise<AxiosResponse<any>> =>
    incidenciasAPI.post('/incidencias', incidencia),

  // Actualizar incidencia
  actualizarIncidencia: (idIncidencia: number, incidencia: ActualizarIncidenciaRequest): Promise<AxiosResponse<any>> =>
    incidenciasAPI.put(`/incidencias/${idIncidencia}`, incidencia),

  // Obtener historial de incidencia
  obtenerHistorial: (idIncidencia: number): Promise<AxiosResponse<HistorialIncidencia[]>> =>
    incidenciasAPI.get<HistorialIncidencia[]>(`/incidencias/${idIncidencia}/historial`),

  // Agregar entrada al historial
  agregarHistorial: (idIncidencia: number, datos: { idEstadoNuevo: number; comentario?: string }): Promise<AxiosResponse<any>> =>
    incidenciasAPI.post(`/incidencias/${idIncidencia}/historial`, datos),

  // Obtener incidencias asignadas a un técnico
  obtenerIncidenciasPorTecnico: (idTecnico: number): Promise<AxiosResponse<Incidencia[]>> =>
    incidenciasAPI.get<Incidencia[]>(`/tecnicos/${idTecnico}/incidencias`),

  // Obtener técnicos recomendados para una incidencia
  obtenerTecnicosRecomendados: (idIncidencia: number): Promise<AxiosResponse<any>> =>
    incidenciasAPI.get(`/incidencias/${idIncidencia}/tecnicos-recomendados`),
};

// Servicio para especialidades
export const especialidadesService = {
  obtenerEspecialidades: (): Promise<AxiosResponse<any>> =>
    incidenciasAPI.get('/especialidades'),
    
  obtenerTecnicosDetallados: (): Promise<AxiosResponse<any>> =>
    incidenciasAPI.get('/tecnicos/detallados'),
};

export default incidenciasAPI;