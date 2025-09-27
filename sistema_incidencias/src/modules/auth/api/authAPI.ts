import axios from "axios";

const authAPI = axios.create({
  baseURL: "http://localhost:3001",
});

export const authService = {
  login: (email: string, password: string) => 
    authAPI.post('/auth/login', { email, password }),
  
  getPerfil: (usuarioId: number) =>
    authAPI.get(`/auth/perfil?usuarioId=${usuarioId}`)
};

export default authAPI;