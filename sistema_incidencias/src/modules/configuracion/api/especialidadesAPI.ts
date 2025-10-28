import axios from "axios";
import type { AxiosResponse } from "axios";

export interface Especialidad {
  idEspecialidad: number;
  nombre: string;
  descripcion: string;
}

export interface TecnicoEspecialidad {
  idTecnicoEspecialidad?: number;
  idUsuario: number;
  idEspecialidad: number;
  nivel_expertise: 'basico' | 'intermedio' | 'avanzado';
  nombre?: string;
  descripcion?: string;
}

const especialidadesAPI = axios.create({
  baseURL: "http://localhost:3001",
});

especialidadesAPI.interceptors.request.use((config) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario.idUsuario) {
    config.headers['usuario-id'] = usuario.idUsuario;
  }
  return config;
});

export const especialidadesService = {
  // Obtener todas las especialidades
  obtenerEspecialidades: (): Promise<AxiosResponse<Especialidad[]>> =>
    especialidadesAPI.get<Especialidad[]>('/especialidades'),

  // Obtener especialidades de un usuario específico
  obtenerEspecialidadesPorUsuario: (idUsuario: number): Promise<AxiosResponse<TecnicoEspecialidad[]>> =>
    especialidadesAPI.get<TecnicoEspecialidad[]>(`/usuarios/${idUsuario}/especialidades`),

  // Agregar especialidades a un usuario
  agregarEspecialidadesUsuario: (idUsuario: number, especialidades: { idEspecialidad: number; nivel_expertise: string }[]): Promise<AxiosResponse<any>> =>
    especialidadesAPI.post(`/usuarios/${idUsuario}/especialidades`, { especialidades }),

  // Actualizar especialidades de un usuario
  actualizarEspecialidadesUsuario: (idUsuario: number, especialidades: { idEspecialidad: number; nivel_expertise: string }[]): Promise<AxiosResponse<any>> =>
    especialidadesAPI.put(`/usuarios/${idUsuario}/especialidades`, { especialidades }),

  // Eliminar especialidad de un usuario
  eliminarEspecialidadUsuario: (idUsuario: number, idEspecialidad: number): Promise<AxiosResponse<any>> =>
    especialidadesAPI.delete(`/usuarios/${idUsuario}/especialidades/${idEspecialidad}`),
};

export default especialidadesAPI;