<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h3>{{ item ? 'Editar Item de Almacén' : '➕ Nuevo Item de Almacén' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <div class="form-section">
          <h4>Datos del Item</h4>
          
          <div class="form-grid-2">
            
            <div class="form-group">
              <label for="codigo">Código *</label>
              <input 
                id="codigo"
                v-model="formulario.codigo" 
                type="text" 
                required 
                maxlength="50"
                placeholder="Ej: ALM-DIS-001"
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label for="nombre">Nombre *</label>
              <input 
                id="nombre"
                v-model="formulario.nombre" 
                type="text" 
                required 
                maxlength="100"
                placeholder="Ej: Disco SSD 256GB"
                class="form-input"
              >
            </div>
            
            <div class="form-group">
              <label for="categoria">Categoría *</label>
              <select 
                id="categoria"
                v-model="formulario.categoria" 
                required
                class="form-select"
              >
                <option value="">Seleccionar categoría...</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="consumibles">Consumibles</option>
                <option value="herramientas">Herramientas</option>
                <option value="repuestos">Repuestos</option>
              </select>
            </div>

            <div class="form-group">
              <label for="estado">Estado *</label>
              <select 
                id="estado"
                v-model="formulario.estado" 
                required
                class="form-select"
              >
                <option value="">Seleccionar estado...</option>
                <option value="disponible">Disponible</option>
                <option value="agotado">Agotado</option>
                <option value="baja">De Baja</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>

            <div class="form-group">
              <label for="stock_actual">Stock Inicial *</label>
              <input 
                id="stock_actual"
                v-model.number="formulario.stock_actual" 
                type="number" 
                required
                min="0"
                class="form-input"
                :disabled="!!item"
              >
              <small v-if="!!item" class="text-muted">El stock se ajusta con movimientos.</small>
            </div>
            
            <div class="form-group">
              <label for="stock_minimo">Stock Mínimo *</label>
              <input 
                id="stock_minimo"
                v-model.number="formulario.stock_minimo" 
                type="number" 
                required
                min="0"
                class="form-input"
              >
            </div>

          </div>
          
          <div class="form-group full-width">
            <label for="descripcion">Descripción</label>
            <textarea 
              id="descripcion"
              v-model="formulario.descripcion" 
              rows="3"
              class="form-input"
            ></textarea>
          </div>
          
        </div>
        
        <div class="form-section">
          <h4>Datos Adicionales</h4>
          <div class="form-grid-3">
            <div class="form-group">
              <label for="ubicacion">Ubicación</label>
              <input 
                id="ubicacion"
                v-model="formulario.ubicacion" 
                type="text"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="proveedor">Proveedor</label>
              <input 
                id="proveedor"
                v-model="formulario.proveedor" 
                type="text"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="costo_unitario">Costo Unitario</label>
              <input 
                id="costo_unitario"
                v-model.number="formulario.costo_unitario" 
                type="number"
                step="0.01"
                class="form-input"
              >
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="guardando">
            {{ item ? 'Actualizar' : 'Crear' }} Item
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { almacenService, type AlmacenItem } from '../api/almacenAPI'; // Asume que la ruta es correcta

// --- Props y Emits ---
const props = defineProps<{
  mostrar: boolean;
  item: AlmacenItem | null; // El item a editar (null para crear)
}>();

const emit = defineEmits(['cerrar', 'guardado']);

// --- Estado del Componente ---
const formulario = reactive<Partial<AlmacenItem>>({
  codigo: '',
  nombre: '',
  categoria: 'hardware',
  stock_actual: 0,
  stock_minimo: 0,
  ubicacion: '',
  proveedor: '',
  costo_unitario: 0,
  estado: 'disponible',
  descripcion: '',
});

const guardando = ref(false);

watch([() => props.mostrar, () => props.item], () => {
  if (props.mostrar) {
    if (props.item) {
      // Modo Edición: Cargar datos del item
      Object.assign(formulario, props.item);
    } else {
      // Modo Creación: Resetear formulario (excepto stock_actual en edición)
      Object.assign(formulario, {
        codigo: '',
        nombre: '',
        categoria: 'hardware',
        stock_actual: 0,
        stock_minimo: 0,
        ubicacion: '',
        proveedor: '',
        costo_unitario: 0,
        estado: 'disponible',
        descripcion: '',
      });
    }
  }
}, { immediate: true });


const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  guardando.value = true;
  try {
    // Validar campos obligatorios
    if (!formulario.codigo || !formulario.nombre || !formulario.categoria) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    // Preparar datos con tipos correctos
    const datosParaEnviar: Omit<AlmacenItem, 'idAlmacen'> = {
      codigo: formulario.codigo!, // Usamos ! porque ya validamos que no es undefined
      nombre: formulario.nombre!,
      categoria: formulario.categoria!,
      stock_actual: Number(formulario.stock_actual) || 0,
      stock_minimo: Number(formulario.stock_minimo) || 0,
      estado: formulario.estado || 'disponible',
      // Campos opcionales
      descripcion: formulario.descripcion || undefined,
      ubicacion: formulario.ubicacion || undefined,
      proveedor: formulario.proveedor || undefined,
      costo_unitario: formulario.costo_unitario ? Number(formulario.costo_unitario) : undefined,
      fecha_adquisicion: undefined // Por ahora undefined
    };

    console.log('Enviando datos al servidor:', datosParaEnviar);

    if (formulario.idAlmacen) {
      // Actualizar Item
      await almacenService.actualizarItemAlmacen(formulario.idAlmacen, datosParaEnviar);
      alert('Item de almacén actualizado con éxito!');
    } else {
      // Crear Nuevo Item
      await almacenService.crearItemAlmacen(datosParaEnviar);
      alert('Nuevo item de almacén creado con éxito!');
    }
    
    emit('guardado');
    cerrar();
  } catch (error: any) {
    console.error('Error al guardar item de almacén:', error);
    
    const mensajeError = error.response?.data?.error || 'Error al guardar el item';
    alert(`${mensajeError}`);
  } finally {
    guardando.value = false;
  }
};
</script>

<style scoped>
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
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.form-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
}

.form-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #374151;
  border-bottom: 1px dashed #e5e7eb;
  padding-bottom: 5px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #374151;
}

.form-input, .form-select {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.full-width {
  grid-column: 1 / -1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary, .btn-primary {
  padding: 10px 20px;
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

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.text-muted {
  font-size: 12px;
  color: #6b7280;
  margin-top: 3px;
}
</style>