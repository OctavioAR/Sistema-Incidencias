export interface Usuario {
  idUsuario?: number;
  nombre: string;
  apellidoPat: string;
  apellidoMat?: string;
  email: string;
  idDepartamento?: number;
  idTipoUsuario: number;
  tipo_usuario_nombre: string;
  activo: boolean;
  fecha_creacion?: string;
}

export interface LoginResponse {
  message: string;
  usuario: Usuario;
  token: string;
}