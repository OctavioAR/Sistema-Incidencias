import axios from "axios";
import type { AxiosResponse } from "axios";

export interface Software {
  idSoftware?: number;
  nombre: string;
  version?: string;
  fabricante?: string;
  tipoLicencia?: 'Libre' | 'Comercial' | 'Educativa' | 'Prueba';
  fechaExpiracionLicencia?: string;
  requiereActivacion?: number;
  comentarios?: string;
  fecha_creacion?: string;
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

export interface EquipoConSoftware {
  idEquipo: number;
  codigo: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  idTipoEquipo: number;
  tipo_equipo_nombre?: string;
  ubicacion?: string;
  responsable_nombre?: string;
  estado?: string;
  fechaInstalacion: string;
  licenciaKey?: string;
  usuarioInstalacion: string;
  comentarios?: string;
}

const softwareAPI = axios.create({
  baseURL: "http://localhost:3001",
});

softwareAPI.interceptors.request.use((config) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario.idUsuario) {
    config.headers['usuario-id'] = usuario.idUsuario;
  }
  return config;
});

export const softwareService = {
  // Obtener todo el software
  obtenerSoftware: (): Promise<AxiosResponse<Software[]>> => 
    softwareAPI.get<Software[]>('/software'),

  // Crear nuevo software
  crearSoftware: (software: Omit<Software, 'idSoftware' | 'fecha_creacion'>): Promise<AxiosResponse<any>> => 
    softwareAPI.post('/software', software),

  // Actualizar software
  actualizarSoftware: (idSoftware: number, software: Partial<Software>): Promise<AxiosResponse<any>> => 
    softwareAPI.put(`/software/${idSoftware}`, software),

  // Eliminar software
  eliminarSoftware: (idSoftware: number): Promise<AxiosResponse<any>> => 
    softwareAPI.delete(`/software/${idSoftware}`),

  // Obtener software instalado en un equipo
  obtenerSoftwareEquipo: (idEquipo: number): Promise<AxiosResponse<EquipoSoftware[]>> => 
    softwareAPI.get<EquipoSoftware[]>(`/equipos/${idEquipo}/software`),

  // Obtener equipos que tienen instalado un software especifico
  obtenerEquiposConSoftware: (idSoftware: number): Promise<AxiosResponse<EquipoConSoftware[]>> => 
    softwareAPI.get<EquipoConSoftware[]>(`/software/${idSoftware}/equipos`),

  // Instalar software en equipo
  instalarSoftware: (idEquipo: number, datos: Omit<EquipoSoftware, 'idEquipoSoftware' | 'idEquipo'>): Promise<AxiosResponse<any>> => 
    softwareAPI.post(`/equipos/${idEquipo}/software`, { ...datos, idEquipo }),

  // Desinstalar software de equipo
  desinstalarSoftware: (idEquipoSoftware: number): Promise<AxiosResponse<any>> => 
    softwareAPI.delete(`/equipo-software/${idEquipoSoftware}`)
};

export default softwareAPI;