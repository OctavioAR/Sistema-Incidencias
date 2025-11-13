import axios from "axios";
import type { AxiosResponse } from "axios";

export interface Problema {
  idProblema?: number;
  titulo: string;
  descripcion: string;
  causa_raiz?: string;
  solucion_permanente?: string;
  idEstadoProblema: number;
  idUsuarioReporta: number;
  idTecnicoAsignado?: number;
  idCategoriaProblema?: number;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  fecha_reporte?: string;
  fecha_cierre?: string;
  fecha_vencimiento?: string;
  impacto?: string;
  comentarios_cierre?: string;
  estado_nombre?: string;
  usuario_reporta_nombre?: string;
  tecnico_asignado_nombre?: string;
  categoria_nombre?: string;
  total_incidencias?: number;
}

export interface ProblemaIncidencia {
  idProblemaIncidencia?: number;
  idProblema: number;
  idIncidencia: number;
  fecha_vinculacion?: string;
  comentarios?: string;
  incidencia_titulo?: string;
  incidencia_fecha?: string;
}

export interface EstadoProblema {
  idEstadoProblema: number;
  nombre: string;
  descripcion: string;
}

export interface CategoriaProblema {
  idCategoriaProblema: number;
  nombre: string;
  descripcion: string;
}

const problemaAPI = axios.create({
  baseURL: "http://localhost:3001",
});

// Interceptor para autenticación
problemaAPI.interceptors.request.use(
  (config) => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (usuario && usuario.idUsuario) {
      config.headers['usuario-id'] = usuario.idUsuario;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const problemaService = {
  // Problemas
  obtenerProblemas: (): Promise<AxiosResponse<Problema[]>> =>
    problemaAPI.get<Problema[]>('/problemas'),
  
  obtenerProblema: (idProblema: number): Promise<AxiosResponse<Problema>> =>
    problemaAPI.get<Problema>(`/problemas/${idProblema}`),
  
  crearProblema: (problema: Omit<Problema, 'idProblema'>): Promise<AxiosResponse<any>> =>
    problemaAPI.post('/problemas', problema),
  
  actualizarProblema: (idProblema: number, problema: Partial<Problema>): Promise<AxiosResponse<any>> =>
    problemaAPI.put(`/problemas/${idProblema}`, problema),

  // Estados y Categorías
  obtenerEstadosProblema: (): Promise<AxiosResponse<EstadoProblema[]>> =>
    problemaAPI.get<EstadoProblema[]>('/problemas/estados'),
  
  obtenerCategoriasProblema: (): Promise<AxiosResponse<CategoriaProblema[]>> =>
    problemaAPI.get<CategoriaProblema[]>('/problemas/categorias'),

  // Incidencias vinculadas
  obtenerIncidenciasProblema: (idProblema: number): Promise<AxiosResponse<ProblemaIncidencia[]>> =>
    problemaAPI.get<ProblemaIncidencia[]>(`/problemas/${idProblema}/incidencias`),
  
  vincularIncidencia: (idProblema: number, idIncidencia: number, comentarios?: string): Promise<AxiosResponse<any>> =>
    problemaAPI.post(`/problemas/${idProblema}/incidencias`, { idIncidencia, comentarios }),

  desvincularIncidencia: (idProblemaIncidencia: number): Promise<AxiosResponse<any>> =>
    problemaAPI.delete(`/problemas/incidencias/${idProblemaIncidencia}`),

  // Detección automática
  deteccionAutomatica: (): Promise<AxiosResponse<any>> =>
    problemaAPI.get('/problemas/deteccion-automatica'),
};