import axios from "axios";
import type { AxiosResponse } from "axios";

export interface ContratoMantenimiento {
  idContrato?: number;
  idEquipo: number;
  proveedor: string;
  numeroContrato: string;
  contactoProveedor?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  fechaInicio: string;
  fechaFin: string;
  costo: number;
  cobertura?: string;
  estado?: 'Vigente' | 'Vencido' | 'Cancelado' | 'Pendiente';
  fecha_creacion?: string;

  equipo_nombre?: string;
  equipo_codigo?: string;
  tipo_equipo_nombre?: string;
}

export interface CrearContratoRequest {
  idEquipo: number;
  proveedor: string;
  numeroContrato: string;
  contactoProveedor?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  fechaInicio: string;
  fechaFin: string;
  costo: number;
  cobertura?: string;
  estado?: string;
}

export interface ActualizarContratoRequest extends Partial<CrearContratoRequest> {}

const contratosAPI = axios.create({
  baseURL: "http://localhost:3001",
});

contratosAPI.interceptors.request.use((config) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario.idUsuario) {
    config.headers['usuario-id'] = usuario.idUsuario;
  }
  return config;
});

export const contratosService = {
  // Obtener todos los contratos
  obtenerContratos: (): Promise<AxiosResponse<ContratoMantenimiento[]>> => 
    contratosAPI.get<ContratoMantenimiento[]>('/contratos'),

  // Obtener contratos de un equipo específico
  obtenerContratosEquipo: (idEquipo: number): Promise<AxiosResponse<ContratoMantenimiento[]>> => 
    contratosAPI.get<ContratoMantenimiento[]>(`/equipos/${idEquipo}/contratos`),

  // Crear nuevo contrato
  crearContrato: (contrato: CrearContratoRequest): Promise<AxiosResponse<any>> => 
    contratosAPI.post('/contratos', contrato),

  // Actualizar contrato
  actualizarContrato: (idContrato: number, contrato: ActualizarContratoRequest): Promise<AxiosResponse<any>> => 
    contratosAPI.put(`/contratos/${idContrato}`, contrato),

  // Eliminar contrato
  eliminarContrato: (idContrato: number): Promise<AxiosResponse<any>> => 
    contratosAPI.delete(`/contratos/${idContrato}`)
};

export default contratosAPI;