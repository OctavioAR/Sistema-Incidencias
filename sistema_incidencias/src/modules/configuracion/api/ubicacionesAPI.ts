import axios from "axios";
import type { Usuario } from "../../auth/api/tipos";

const ubicacionesAPI = axios.create({
  baseURL: "http://localhost:3001",
});

ubicacionesAPI.interceptors.request.use((config) => {
  const usuarioStr = localStorage.getItem('usuario');
  if (usuarioStr) {
    const usuario: Usuario = JSON.parse(usuarioStr);
    config.headers['usuario-id'] = usuario.idUsuario;
  }
  return config;
});

export interface Edificio {
  idEdificio?: number;
  codigo: string;
  nombre: string;
  fecha_creacion?: string;
}

export interface Aula {
  idAula?: number;
  codigo: string;
  nombre: string;
  idEdificio?: number;
  edificio_nombre?: string;
  fecha_creacion?: string;
}

export interface Departamento {
  idDepartamento?: number;
  nombre: string;
  idEdificio?: number;
  idAula?: number;
  edificio_nombre?: string;
  aula_nombre?: string;
  fecha_creacion?: string;
}

export const ubicacionesService = {
  // Edificios
  obtenerEdificios: () => ubicacionesAPI.get<Edificio[]>('/edificios'),
  crearEdificio: (edificio: Omit<Edificio, 'idEdificio' | 'fecha_creacion'>) =>
    ubicacionesAPI.post('/edificios', edificio),
  actualizarEdificio: (id: number, edificio: Omit<Edificio, 'idEdificio' | 'fecha_creacion'>) =>
    ubicacionesAPI.put(`/edificios/${id}`, edificio),
  eliminarEdificio: (id: number) => ubicacionesAPI.delete(`/edificios/${id}`),

  // Aulas
  obtenerAulas: () => ubicacionesAPI.get<Aula[]>('/aulas'),
  crearAula: (aula: Omit<Aula, 'idAula' | 'fecha_creacion' | 'edificio_nombre'>) =>
    ubicacionesAPI.post('/aulas', aula),
  actualizarAula: (id: number, aula: Omit<Aula, 'idAula' | 'fecha_creacion' | 'edificio_nombre'>) =>
    ubicacionesAPI.put(`/aulas/${id}`, aula),
  eliminarAula: (id: number) => ubicacionesAPI.delete(`/aulas/${id}`),

  // Departamentos
  obtenerDepartamentos: () => ubicacionesAPI.get<Departamento[]>('/departamentos'),
  crearDepartamento: (departamento: Omit<Departamento, 'idDepartamento' | 'fecha_creacion' | 'edificio_nombre' | 'aula_nombre'>) =>
    ubicacionesAPI.post('/departamentos', departamento),
  actualizarDepartamento: (id: number, departamento: Omit<Departamento, 'idDepartamento' | 'fecha_creacion' | 'edificio_nombre' | 'aula_nombre'>) =>
    ubicacionesAPI.put(`/departamentos/${id}`, departamento),
  eliminarDepartamento: (id: number) => ubicacionesAPI.delete(`/departamentos/${id}`),
};

export default ubicacionesAPI;