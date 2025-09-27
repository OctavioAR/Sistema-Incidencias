import axios from "axios";
import type{ 
  Software, 
  EquipoSoftware, 
  ContratoMantenimiento, 
  TipoRelacion, 
  RelacionCI,
  ConfiguracionCompleta 
} from "./tipos";

const configuracionAPI = axios.create({
  baseURL: "http://localhost:3001",
});

export const configuracionService = {
  // Software
  obtenerSoftware: () => configuracionAPI.get<Software[]>('/software'),
  crearSoftware: (software: Software) => configuracionAPI.post('/software', software),

  // Equipo-Software
  obtenerSoftwareEquipo: (idEquipo: number) => 
    configuracionAPI.get<EquipoSoftware[]>(`/equipos/${idEquipo}/software`),
  instalarSoftware: (idEquipo: number, datos: Omit<EquipoSoftware, 'idEquipo'>) =>
    configuracionAPI.post(`/equipos/${idEquipo}/software`, datos),

  // Contratos
  obtenerContratosEquipo: (idEquipo: number) =>
    configuracionAPI.get<ContratoMantenimiento[]>(`/equipos/${idEquipo}/contratos`),
  crearContrato: (contrato: ContratoMantenimiento) =>
    configuracionAPI.post('/contratos', contrato),

  // Relaciones
  obtenerRelacionesCI: (tipo: string, id: number) =>
    configuracionAPI.get<RelacionCI[]>(`/ci/${tipo}/${id}/relaciones`),
  crearRelacion: (relacion: Omit<RelacionCI, 'idRelacion' | 'fechaCreacion'>) =>
    configuracionAPI.post('/relaciones', relacion),

  // Tipos de Relacion
  obtenerTiposRelacion: () =>
    configuracionAPI.get<TipoRelacion[]>('/tipos-relacion'),

  // Configuracion Completa
  obtenerConfiguracionCompleta: (idEquipo: number) =>
    configuracionAPI.get<ConfiguracionCompleta>(`/equipos/${idEquipo}/configuracion-completa`),

  // Auditoria
  obtenerAuditoria: () =>
    configuracionAPI.get<any[]>('/auditoria-configuracion'),

  // Estado de equipo
  actualizarEstadoEquipo: (idEquipo: number, datos: { estado: string, fechaUltimoMantenimiento?: string, fechaBaja?: string }) =>
    configuracionAPI.put(`/equipos/${idEquipo}/estado`, datos)
};

export default configuracionAPI;