import axios from "axios";
import type { Usuario } from "../../auth/api/tipos";

const usuariosAPI = axios.create({
  baseURL: "http://localhost:3001",
});

usuariosAPI.interceptors.request.use((config) => {
  const usuarioStr = localStorage.getItem('usuario');
  if (usuarioStr) {
    const usuario: Usuario = JSON.parse(usuarioStr);
    config.headers['usuario-id'] = usuario.idUsuario;
  }
  return config;
});

export interface UsuarioCompleto {
  idUsuario?: number;
  nombre: string;
  apellidoPat: string;
  apellidoMat?: string;
  email: string;
  idTipoUsuario: number;
  idDepartamento?: number;
  activo: boolean;
  fecha_creacion?: string;
  tipo_usuario_nombre?: string;
  departamento_nombre?: string;
}

export interface CrearUsuarioRequest {
  nombre: string;
  apellidoPat: string;
  apellidoMat?: string;
  email: string;
  password: string;
  idTipoUsuario: number;
  idDepartamento?: number;
}

export interface ActualizarUsuarioRequest {
  nombre: string;
  apellidoPat: string;
  apellidoMat?: string;
  email: string;
  idTipoUsuario: number;
  idDepartamento?: number;
  activo: boolean;
}

export const usuariosService = {
  // Obtener todos los usuarios
  obtenerUsuarios: () => usuariosAPI.get<UsuarioCompleto[]>('/usuarios'),
  
  // Crear nuevo usuario
  crearUsuario: (usuario: CrearUsuarioRequest) =>
    usuariosAPI.post('/usuarios', usuario),
  
  // Actualizar usuario
  actualizarUsuario: (id: number, usuario: ActualizarUsuarioRequest) =>
    usuariosAPI.put(`/usuarios/${id}`, usuario),
  
  // Cambiar contraseña
  cambiarPassword: (id: number, password: string) =>
    usuariosAPI.put(`/usuarios/${id}/password`, { password }),
  
  // Cambiar estado (activar/desactivar)
  cambiarEstado: (id: number, activo: boolean) =>
    usuariosAPI.put(`/usuarios/${id}/estado`, { activo })
};

export default usuariosAPI;