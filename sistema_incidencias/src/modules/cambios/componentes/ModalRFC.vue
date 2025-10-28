<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3>{{ rfc ? 'Editar RFC' : 'Nueva Solicitud de Cambio (RFC)' }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <form @submit.prevent="guardar" class="modal-body">
        <!-- Información básica -->
        <div class="form-section">
          <h4>Información Básica</h4>
          <div class="form-group">
            <label for="titulo">Título del Cambio *</label>
            <input 
              id="titulo"
              v-model="formulario.titulo" 
              type="text" 
              required 
              maxlength="255"
              placeholder="Ej: Reemplazo de fuentes de poder en Laboratorio LP"
              class="form-input"
            >
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="idTipoCambio">Tipo de Cambio *</label>
              <select 
                id="idTipoCambio"
                v-model="formulario.idTipoCambio" 
                required
                class="form-select"
              >
                <option value="">Seleccionar tipo...</option>
                <option value="emergencia">🚨 Emergencia</option>
                <option value="normal">📋 Normal</option>
                <option value="estandar">⚙️ Estándar</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="prioridad">Prioridad *</label>
              <select 
                id="prioridad"
                v-model="formulario.prioridad" 
                required
                class="form-select"
              >
                <option value="baja">🟢 Baja</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🟠 Alta</option>
                <option value="critica">🔴 Crítica</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Descripción del cambio -->
        <div class="form-section">
          <h4>Descripción del Cambio</h4>
          <div class="form-group">
            <label for="descripcion">Descripción Detallada *</label>
            <textarea 
              id="descripcion"
              v-model="formulario.descripcion" 
              required
              rows="4"
              maxlength="2000"
              placeholder="Describe en detalle qué se va a cambiar, cómo se realizará el cambio, pasos específicos..."
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.descripcion.length }}/2000 caracteres</small>
          </div>
        </div>

        <!-- Justificación e impacto -->
        <div class="form-section">
          <h4>Justificación e Impacto</h4>
          <div class="form-group">
            <label for="justificacion">Justificación del Cambio *</label>
            <textarea 
              id="justificacion"
              v-model="formulario.justificacion" 
              required
              rows="3"
              maxlength="1000"
              placeholder="¿Por qué es necesario este cambio? ¿Qué problema resuelve?"
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.justificacion.length }}/1000 caracteres</small>
          </div>
          
          <div class="form-group">
            <label for="impacto">Impacto Esperado</label>
            <textarea 
              id="impacto"
              v-model="formulario.impacto" 
              rows="3"
              maxlength="1000"
              placeholder="¿Qué impacto tendrá este cambio? ¿A quiénes afectará?"
              class="form-textarea"
            ></textarea>
            <small>{{ formulario.impacto.length }}/1000 caracteres</small>
          </div>
        </div>

        <!-- Items a cambiar -->
        <div class="form-section">
          <h4>🎯 Items a Cambiar</h4>
          <p class="section-description">Especifica los elementos del almacén que serán utilizados</p>
          
          <div v-for="(item, index) in formulario.items" :key="index" class="item-cambio">
            <div class="item-header">
              <h5>Item {{ index + 1 }}</h5>
              <button type="button" @click="removerItem(index)" class="btn-eliminar" v-if="formulario.items.length > 1">🗑️</button>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label :for="`tipo_item_${index}`">Tipo de Item *</label>
                <select 
                  :id="`tipo_item_${index}`"
                  v-model="item.tipo_item" 
                  required
                  class="form-select"
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="hardware">🖥️ Hardware</option>
                  <option value="software">💾 Software</option>
                  <option value="consumible">🖨️ Consumible</option>
                  <option value="herramienta">🛠️ Herramienta</option>
                  <option value="repuesto">🔧 Repuesto</option>
                </select>
              </div>
              
              <div class="form-group">
                <label :for="`id_item_${index}`">Código del Item en Almacén *</label>
                <input 
                  :id="`id_item_${index}`"
                  v-model="item.id_item" 
                  type="text" 
                  required
                  placeholder="Ej: ALM-FUENTE-001"
                  class="form-input"
                >
                <small>Ingresa el código exacto del item en el almacén</small>
              </div>
            </div>
            
            <div class="form-group">
              <label :for="`descripcion_cambio_${index}`">Descripción del Cambio *</label>
              <textarea 
                :id="`descripcion_cambio_${index}`"
                v-model="item.descripcion_cambio" 
                required
                rows="2"
                maxlength="500"
                placeholder="Describe específicamente qué se cambiará y por qué"
                class="form-textarea"
              ></textarea>
              <small>{{ item.descripcion_cambio.length }}/500 caracteres</small>
            </div>
          </div>
          
          <button type="button" @click="agregarItem" class="btn-secondary">
            ➕ Agregar Otro Item
          </button>
        </div>

        <div class="form-actions">
          <button type="button" @click="cerrar" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="cargando || !formularioValido" class="btn-primary">
            {{ cargando ? 'Guardando...' : (rfc ? '💾 Actualizar RFC' : '📝 Crear RFC') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { cambiosService, type RFC, type RFCItem } from '../api/cambiosAPI';

interface Props {
  mostrar: boolean;
  rfc: RFC | null;
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
  titulo: '',
  descripcion: '',
  justificacion: '',
  impacto: '',
  idTipoCambio: '' as 'emergencia' | 'normal' | 'estandar',
  prioridad: 'media' as 'baja' | 'media' | 'alta' | 'critica',
  items: [
    {
      tipo_item: '' as 'hardware' | 'software' | 'consumible' | 'herramienta' | 'repuesto',
      id_item: '',
      descripcion_cambio: '',
      estado_anterior: null as string | null,
      estado_nuevo: null as string | null,
    }
  ] as Omit<RFCItem, 'idRFCItem' | 'idRFC'>[]
});

const formularioValido = computed(() => {
  return formulario.value.titulo.trim() &&
         formulario.value.descripcion.trim() &&
         formulario.value.justificacion.trim() &&
         formulario.value.idTipoCambio &&
         formulario.value.items.length > 0 &&
         formulario.value.items.every(item => 
           item.tipo_item && item.id_item.trim() && item.descripcion_cambio.trim()
         );
});

watch([() => props.mostrar, () => props.rfc], () => {
  if (props.mostrar) {
    if (props.rfc) {
      llenarFormularioEdicion();
    } else {
      resetearFormulario();
    }
  }
});

const llenarFormularioEdicion = async () => {
  if (!props.rfc) return;
  
  // Cargar items del RFC
  let items: Omit<RFCItem, 'idRFCItem' | 'idRFC'>[] = [];
  if (props.rfc.idRFC) {
    try {
      const response = await cambiosService.obtenerItemsRFC(props.rfc.idRFC);
      items = response.data.map(item => ({
        tipo_item: item.tipo_item,
        id_item: item.id_item.toString(),
        descripcion_cambio: item.descripcion_cambio,
        estado_anterior: item.estado_anterior || null,
        estado_nuevo: item.estado_nuevo || null
      }));
    } catch (error) {
      console.error('Error al cargar items RFC:', error);
      items = [{
        tipo_item: '' as any,
        id_item: '',
        descripcion_cambio: '',
        estado_anterior: null,
        estado_nuevo: null
      }];
    }
  }

  formulario.value = {
    titulo: props.rfc.titulo,
    descripcion: props.rfc.descripcion,
    justificacion: props.rfc.justificacion || '',
    impacto: props.rfc.impacto || '',
    idTipoCambio: props.rfc.idTipoCambio,
    prioridad: props.rfc.prioridad,
    items: items.length > 0 ? items : [{
      tipo_item: '' as any,
      id_item: '',
      descripcion_cambio: '',
      estado_anterior: null,
      estado_nuevo: null
    }]
  };
};

const resetearFormulario = () => {
  formulario.value = {
    titulo: '',
    descripcion: '',
    justificacion: '',
    impacto: '',
    idTipoCambio: '' as 'emergencia' | 'normal' | 'estandar',
    prioridad: 'media',
    items: [
      {
        tipo_item: '' as 'hardware' | 'software' | 'consumible' | 'herramienta' | 'repuesto',
        id_item: '',
        descripcion_cambio: '',
        estado_anterior: null,
        estado_nuevo: null
      }
    ]
  };
};

const agregarItem = () => {
  formulario.value.items.push({
    tipo_item: '' as 'hardware' | 'software' | 'consumible' | 'herramienta' | 'repuesto',
    id_item: '',
    descripcion_cambio: '',
    estado_anterior: null,
    estado_nuevo: null
  });
};

const removerItem = (index: number) => {
  formulario.value.items.splice(index, 1);
};

const cerrar = () => {
  emit('cerrar');
};

const guardar = async () => {
  if (!formularioValido.value) return;

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (!usuario || !usuario.idUsuario) {
    alert('❌ Error: Usuario no autenticado. Por favor, inicie sesión nuevamente.');
    return;
  }

  cargando.value = true;
  try {
    const datosRFC: Omit<RFC, 'idRFC'> = {
      titulo: formulario.value.titulo,
      descripcion: formulario.value.descripcion,
      justificacion: formulario.value.justificacion,
      impacto: formulario.value.impacto,
      idTipoCambio: formulario.value.idTipoCambio,
      prioridad: formulario.value.prioridad,
      estado: 'borrador' as const, // Especificar el tipo literal
      idUsuarioSolicitante: usuario.idUsuario
    };

    console.log('Enviando RFC:', datosRFC);
    console.log('Items a enviar:', formulario.value.items);

    if (props.rfc && props.rfc.idRFC) {
      // Actualizar RFC existente
      await cambiosService.actualizarRFC(props.rfc.idRFC, datosRFC);
      
      // Actualizar items del RFC
      await cambiosService.actualizarItemsRFC(props.rfc.idRFC, formulario.value.items);
      
      alert('RFC actualizado correctamente');
    } else {
      // Crear nuevo RFC
      const response = await cambiosService.crearRFC(datosRFC);
      const nuevoId = response.data.id;
      
      console.log('RFC creado con ID:', nuevoId);
      
      // Crear items del RFC
      if (nuevoId) {
        await cambiosService.crearItemsRFC(nuevoId, formulario.value.items);
        console.log('Items del RFC creados correctamente');
      }
      
      alert('RFC creado correctamente');
    }

    emit('guardado');
    cerrar();
  } catch (error: any) {
    console.error('Error al guardar RFC:', error);
    
    const mensajeError = error.response?.data?.error || 'Error al guardar el RFC';
    const detalleError = error.response?.data?.detalle || '';
    
    alert(`${mensajeError}${detalleError ? `\nDetalle: ${detalleError}` : ''}`);
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
.item-cambio {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: #fafafa;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.item-header h5 {
  margin: 0;
  color: #374151;
}

.btn-eliminar {
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-eliminar:hover {
  background: #dc2626;
}

.section-description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 15px;
}

/* Estilos reutilizables de formulario */
.form-section {
  margin-bottom: 25px;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}

.form-section h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
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