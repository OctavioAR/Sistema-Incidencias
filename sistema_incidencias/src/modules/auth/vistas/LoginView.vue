<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Sistema de Gestión de Incidencias</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Correo:</label>
          <input v-model="email" type="email" required placeholder="email">
        </div>
        
        <div class="form-group">
          <label>Contraseña:</label>
          <input v-model="password" type="password" required placeholder="••••••••">
        </div>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../api/authAPI';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const response = await authService.login(email.value, password.value);
    
    localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    localStorage.setItem('authToken', response.data.token);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const tipoUsuario = response.data.usuario.tipo_usuario_nombre.toLowerCase();
    
    switch (tipoUsuario) {
      case 'jefe de taller':
        router.push('/jefe/dashboard');
        break;
      case 'técnico':
        router.push('/tecnico/dashboard');
        break;
      case 'maestro':
        router.push('/maestro/dashboard');
        break;
      default:
        router.push('/configuracion');
    }
    
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #363636 0%, #363636 100%);
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #e53e3e;
  margin-top: 1rem;
  text-align: center;
}
</style>