<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ tipo === 'entrada' ? '📥 Entrada' : '📤 Salida' }} - {{ item?.codigo }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="form-section">
          <div class="info-item">
            <p><strong>Item:</strong> {{ item?.nombre }}</p>
            <p><strong>Stock actual:</strong> {{ item?.stock_actual }}</p>
            <p><strong>Stock mínimo:</strong> {{ item?.stock_minimo }}</p>
          </div>

          <div class="form-group">
            <label for="cantidad">Cantidad *</label>
            <input 
              id="cantidad"
              v-model.number="formulario.cantidad" 
              type="number" 
              required
              :min="tipo === 'salida' ? 1 : 0"
              :max="tipo === 'salida' && item ? item.stock_actual : undefined"
              class="form-input"
            >
            <small v-if="tipo === 'salida' && item">
              Máximo disponible: {{ item.stock_actual }}
            </small>
            <small v-else-if="tipo === 'entrada'">
              Ingrese la cantidad a agregar
            </small>
          </div>

          <div class="form-group">
            <label for="motivo">Motivo *</label>
            <select 
              id="motivo"
              v-model="formulario.motivo" 
              required
              class="form-select"
            >
              <option value="">Seleccionar motivo...</option>
              <option v-if="tipo === 'entrada'" value="compra">Compra</option>
              <option v-if="tipo === 'entrada'" value="devolucion">Devolución</option>
              <option v-if="tipo === 'entrada'" value="ajuste_inventario">Ajuste de inventario</option>
              <option v-if="tipo === 'entrada'" value="donacion">Donación</option>
              <option v-if="tipo === 'salida'" value="uso_incidencia">Uso en incidencia</option>
              <option v-if="tipo === 'salida'" value="uso_rfc">Uso en RFC</option>
              <option v-if="tipo === 'salida'" value="prestamo">Préstamo</option>
              <option v-if="tipo === 'salida'" value="baja">Baja técnica</option>
              <option v-if="tipo === 'salida'" value="ajuste_inventario">Ajuste de inventario</option>
            </select>
          </div>

          <!-- Campo para ID RFC -->
          <div v-if="tipo === 'salida'" class="form-group">
            <label for="idRFC">ID del RFC (Opcional)</label>
            <input 
              id="idRFC"
              v-model.number="formulario.idRFC" 
              type="number"
              min="1"
              placeholder="ID del RFC relacionado"
              class="form-input"
            >
            <small>Si este movimiento está relacionado con un RFC, ingresa su ID</small>
          </div>

          <!-- Campo para ID Incidencia -->
          <div v-if="tipo === 'salida' && formulario.motivo === 'uso_incidencia'" class="form-group">
            <label for="idIncidencia">ID de Incidencia</label>
            <input 
              id="idIncidencia"
              v-model.number="formulario.idIncidencia" 
              type="number"
              min="1"
              placeholder="ID de la incidencia relacionada"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="comentarios">Comentarios (Opcional)</label>
            <textarea 
              id="comentarios"
              v-model="formulario.comentarios" 
              rows="3"
              placeholder="Agregar comentarios adicionales..."
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.comentarios?.length || 0 }}/500 caracteres</small>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando || !formularioValido" class="btn-primary">
            {{ cargando ? 'Registrando...' : (tipo === 'entrada' ? '📥 Registrar Entrada' : '📤 Registrar Salida') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { almacenService, type AlmacenItem } from '../api/almacenAPI';

interface Props {
  mostrar: boolean;
  item: AlmacenItem | null;
  tipo: 'entrada' | 'salida';
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cargando = ref(false);
const usuarioActual = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

const formulario = ref({
  cantidad: 0,
  motivo: '',
  comentarios: '',
  idIncidencia: undefined as number | undefined,
  idRFC: undefined as number | undefined
});

const formularioValido = computed(() => {
  const baseValido = formulario.value.cantidad > 0 && formulario.value.motivo.trim();
  
  if (props.tipo === 'salida' && props.item) {
    return baseValido && formulario.value.cantidad <= props.item.stock_actual;
  }
  
  return baseValido;
});

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor) {
    resetearFormulario();
  }
});

const resetearFormulario = () => {
  formulario.value = {
    cantidad: 0,
    motivo: '',
    comentarios: '',
    idIncidencia: undefined,
    idRFC: undefined
  };
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formularioValido.value || !props.item?.idAlmacen) return;

  // Verificar que el usuario esté autenticado
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (!usuario || !usuario.idUsuario) {
    alert('Error: Usuario no autenticado. Por favor, inicie sesión nuevamente.');
    return;
  }

  cargando.value = true;
  try {
    const datosMovimiento = {
      idAlmacen: props.item.idAlmacen,
      tipo_movimiento: props.tipo,
      cantidad: formulario.value.cantidad,
      motivo: formulario.value.motivo,
      idUsuario: usuario.idUsuario,
      idIncidencia: formulario.value.idIncidencia || undefined,
      idRFC: formulario.value.idRFC || undefined,
      comentarios: formulario.value.comentarios || undefined
    };

    await almacenService.registrarMovimiento(datosMovimiento);

    const mensaje = props.tipo === 'entrada' 
      ? `Entrada de ${formulario.value.cantidad} unidades registrada correctamente`
      : `Salida de ${formulario.value.cantidad} unidades registrada correctamente`;
    
    alert(mensaje);
    emit('guardado');
    cerrar();
  } catch (error: any) {
    const mensajeError = error.response?.data?.error || 'Error al registrar el movimiento';
    alert('' + mensajeError);
    console.error('Error al registrar movimiento:', error);
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
.info-item {
  background: #f8fafc;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.info-item p {
  margin: 5px 0;
  color: #374151;
}

/* Estilos reutilizables de formulario */
.form-section {
  margin-bottom: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input, .form-select, .form-textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-group small {
  margin-top: 5px;
  color: #6b7280;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary, .btn-primary {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}
</style>