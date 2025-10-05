import axios from "axios";
import type { AxiosResponse } from "axios";

export interface Equipo {
  idEquipo?: number;
  codigo: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  noSerie?: string;
  idTipoEquipo: number;
  sistemaOperativo?: string;
  procesador?: string;
  ram_gb?: number;
  almacenamiento_gb?: number;
  direccion_ip?: string;
  direccion_mac?: string;
  fechaCompra?: string;
  expiracionGarantia?: string;
  idDepartamento?: number;
  idAula?: number;
  idResponsable?: number;
  estado?: 'activo' | 'mantenimiento' | 'baja' | 'obsoleto' | 'en_stock';
  fechaUltimoMantenimiento?: string;
  fechaBaja?: string;
  activo?: number;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  
  departamento_nombre?: string;
  aula_nombre?: string;
  edificio_nombre?: string;
  tipo_equipo_nombre?: string;
  responsable_nombre?: string;
}

export interface CrearEquipoRequest {
  codigo: string;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  noSerie?: string | null;
  idTipoEquipo: number;
  sistemaOperativo?: string | null;
  procesador?: string | null;
  ram_gb?: number | null;
  almacenamiento_gb?: number | null;
  direccion_ip?: string | null;
  direccion_mac?: string | null;
  fechaCompra?: string | null;
  expiracionGarantia?: string | null;
  idDepartamento?: number | null;
  idAula?: number | null;
  idResponsable?: number | null;
  estado?: string;
}

export interface ActualizarEquipoRequest extends Partial<CrearEquipoRequest> {
  fechaUltimoMantenimiento?: string | null;
  fechaBaja?: string | null;
}

export interface EquipoSoftware {
  idEquipoSoftware?: number;
  idEquipo: number;
  idSoftware: number;
  fechaInstalacion: string;
  licenciaKey?: string;
  usuarioInstalacion: string;
  comentarios?: string;
  nombre?: string;
  version?: string;
  fabricante?: string;
  tipoLicencia?: string;
}

export interface ConfiguracionCompletaEquipo {
  equipo: Equipo;
  software: EquipoSoftware[];
  contratos: any[];
  relaciones: any[];
}

const equiposAPI = axios.create({
  baseURL: "http://localhost:3001",
});

equiposAPI.interceptors.request.use((config) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario.idUsuario) {
    config.headers['usuario-id'] = usuario.idUsuario;
  }
  return config;
});

export const equiposService = {
  // Obtener todos los equipos
  obtenerEquipos: (): Promise<AxiosResponse<Equipo[]>> => 
    equiposAPI.get<Equipo[]>('/equipos'),

  // Crear nuevo equipo
  crearEquipo: (equipo: CrearEquipoRequest): Promise<AxiosResponse<any>> => 
    equiposAPI.post('/equipos', equipo),

  // Actualizar equipo
  actualizarEquipo: (idEquipo: number, equipo: ActualizarEquipoRequest): Promise<AxiosResponse<any>> => 
    equiposAPI.put(`/equipos/${idEquipo}`, equipo),

  // Eliminar equipo
  eliminarEquipo: (idEquipo: number): Promise<AxiosResponse<any>> => 
    equiposAPI.delete(`/equipos/${idEquipo}`),

  // Obtener software instalado en equipo
  obtenerSoftwareEquipo: (idEquipo: number): Promise<AxiosResponse<EquipoSoftware[]>> => 
    equiposAPI.get<EquipoSoftware[]>(`/equipos/${idEquipo}/software`),

  // Obtener configuración completa del equipo
  obtenerConfiguracionCompleta: (idEquipo: number): Promise<AxiosResponse<ConfiguracionCompletaEquipo>> => 
    equiposAPI.get<ConfiguracionCompletaEquipo>(`/equipos/${idEquipo}/configuracion-completa`),

  // Actualizar estado del equipo
  actualizarEstadoEquipo: (idEquipo: number, datos: { estado: string, fechaUltimoMantenimiento?: string, fechaBaja?: string }): Promise<AxiosResponse<any>> => 
    equiposAPI.put(`/equipos/${idEquipo}/estado`, datos)
};

export default equiposAPI;