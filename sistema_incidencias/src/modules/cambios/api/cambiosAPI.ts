import axios from "axios";
import type { AxiosResponse } from "axios";

export interface RFC {
  idRFC?: number;
  titulo: string;
  descripcion: string;
  justificacion?: string;
  impacto?: string;
  idUsuarioSolicitante: number;
  idTipoCambio: 'emergencia' | 'normal' | 'estandar';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'completado' | 'cancelado';
  tiempo_estimado_minutos?: number;
  fecha_solicitud?: string;
  fecha_aprobacion?: string;
  fecha_implementacion?: string;
  fecha_cierre?: string;
  idUsuarioAprobador?: number;
  comentarios_aprobacion?: string;
  solicitante_nombre?: string;
  aprobador_nombre?: string;
}

export interface RFCItem {
  idRFCItem?: number;
  idRFC: number;
  tipo_item: 'hardware' | 'software' | 'consumible' | 'herramienta' | 'repuesto' | 'configuracion' | 'proceso';
  id_item: string;
  descripcion_cambio: string;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
}

export interface BitacoraCambio {
  idBitacora?: number;
  idRFC?: number;
  tipo_cambio: string;
  descripcion: string;
  idUsuario: number;
  fecha_cambio: string;
  detalles?: string;
  usuario_nombre?: string;
}

const cambiosAPI = axios.create({
  baseURL: "http://localhost:3001",
});

// Interceptor para autenticación
cambiosAPI.interceptors.request.use(
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

export const cambiosService = {
  // RFC
  obtenerRFC: (): Promise<AxiosResponse<RFC[]>> =>
    cambiosAPI.get<RFC[]>('/rfc'),
  
  crearRFC: (rfc: Omit<RFC, 'idRFC'>): Promise<AxiosResponse<any>> =>
    cambiosAPI.post('/rfc', rfc),
  
  actualizarRFC: (idRFC: number, rfc: Partial<RFC>): Promise<AxiosResponse<any>> =>
    cambiosAPI.put(`/rfc/${idRFC}`, rfc),
  
  actualizarEstadoRFC: (idRFC: number, estado: string): Promise<AxiosResponse<any>> =>
    cambiosAPI.put(`/rfc/${idRFC}/estado`, { estado }),
  
  aprobarRFC: (idRFC: number, comentarios: string): Promise<AxiosResponse<any>> =>
    cambiosAPI.put(`/rfc/${idRFC}/aprobar`, { comentarios }),
  
  rechazarRFC: (idRFC: number, comentarios: string): Promise<AxiosResponse<any>> =>
    cambiosAPI.put(`/rfc/${idRFC}/rechazar`, { comentarios }),

  // Items RFC
  obtenerItemsRFC: (idRFC: number): Promise<AxiosResponse<RFCItem[]>> =>
    cambiosAPI.get<RFCItem[]>(`/rfc/${idRFC}/items`),

  crearItemsRFC: (idRFC: number, items: Omit<RFCItem, 'idRFCItem' | 'idRFC'>[]): Promise<AxiosResponse<any>> =>
    cambiosAPI.post(`/rfc/${idRFC}/items`, { items }),

  actualizarItemsRFC: (idRFC: number, items: Omit<RFCItem, 'idRFCItem' | 'idRFC'>[]): Promise<AxiosResponse<any>> =>
    cambiosAPI.put(`/rfc/${idRFC}/items`, { items }),

  // Bitácora
  obtenerBitacoraRFC: (idRFC: number): Promise<AxiosResponse<BitacoraCambio[]>> =>
    cambiosAPI.get<BitacoraCambio[]>(`/rfc/${idRFC}/bitacora`),
};