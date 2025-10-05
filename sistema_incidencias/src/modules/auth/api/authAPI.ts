import axios, { type AxiosResponse } from "axios";

const authAPI = axios.create({
  baseURL: "http://localhost:3001",
});

export const authService = {
  login: (email: string, password: string) => 
    authAPI.post('/auth/login', { email, password }),
  
  getPerfil: (usuarioId: number) =>
    authAPI.get(`/auth/perfil?usuarioId=${usuarioId}`),

  cambiarPassword: (datos: { passwordActual: string; nuevaPassword: string }): Promise<AxiosResponse<any>> =>
    authAPI.put('/auth/cambiar-password', datos),
};

authAPI.interceptors.request.use((config) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario.idUsuario) {
    config.headers['usuario-id'] = usuario.idUsuario;
  }
  return config;
});

export default authAPI;