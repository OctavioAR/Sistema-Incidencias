<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h3>🔗 Vincular Incidencias - {{ problema?.titulo }}</h3>
        <button @click="cerrar" class="btn-cerrar">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Búsqueda de incidencias -->
        <div class="form-section">
          <h4>Buscar Incidencias para Vincular</h4>
          <div class="busqueda-incidencias">
            <input 
              type="text" 
              v-model="terminoBusqueda" 
              placeholder="Buscar por título, equipo o descripción..."
              @input="buscarIncidencias"
              class="busqueda-input"
            >
            <button @click="buscarIncidencias" class="btn-secondary">🔍 Buscar</button>
          </div>
        </div>

        <!-- Incidencias encontradas -->
        <div class="form-section" v-if="incidenciasEncontradas.length > 0">
          <h4>Incidencias Encontradas ({{ incidenciasEncontradas.length }})</h4>
          <div class="incidencias-list">
            <div v-for="incidencia in incidenciasEncontradas" :key="incidencia.idIncidencia" 
                 class="incidencia-item" :class="{ 'vinculada': estaVinculada(incidencia.idIncidencia) }">
              <div class="incidencia-info">
                <div class="incidencia-header">
                  <strong>#{{ incidencia.idIncidencia }} - {{ incidencia.titulo }}</strong>
                  <span class="incidencia-fecha">{{ formatFecha(incidencia.fecha_creacion) }}</span>
                </div>
                <div class="incidencia-detalles">
                  <span class="incidencia-equipo" v-if="incidencia.equipo_nombre">
                    🖥️ {{ incidencia.equipo_nombre }}
                  </span>
                  <span class="incidencia-estado" :class="incidencia.estado_nombre?.toLowerCase()">
                    {{ incidencia.estado_nombre }}
                  </span>
                  <span class="incidencia-tipo">
                    {{ incidencia.tipo_incidencia_nombre }}
                  </span>
                </div>
                <p class="incidencia-descripcion">{{ incidencia.descripcion }}</p>
              </div>
              <div class="incidencia-actions">
                <button v-if="!estaVinculada(incidencia.idIncidencia)" 
                        @click="vincularIncidencia(incidencia)" 
                        class="btn-success">
                  ➕ Vincular
                </button>
                <button v-else 
                        @click="desvincularIncidencia(incidencia.idIncidencia)" 
                        class="btn-warning">
                  ❌ Quitar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Incidencias ya vinculadas -->
        <div class="form-section" v-if="incidenciasVinculadas.length > 0">
          <h4>Incidencias Vinculadas ({{ incidenciasVinculadas.length }})</h4>
          <div class="incidencias-list">
            <div v-for="vinculo in incidenciasVinculadas" :key="vinculo.idProblemaIncidencia" 
                 class="incidencia-item vinculada">
              <div class="incidencia-info">
                <div class="incidencia-header">
                  <strong>#{{ vinculo.incidencia_titulo }}</strong>
                  <span class="incidencia-fecha">{{ formatFecha(vinculo.fecha_vinculacion) }}</span>
                </div>
                <div class="vinculo-comentarios" v-if="vinculo.comentarios">
                  <strong>Comentarios:</strong> {{ vinculo.comentarios }}
                </div>
              </div>
              <div class="incidencia-actions">
                <button @click="desvincularIncidencia(vinculo.idIncidencia)" 
                        class="btn-warning">
                  ❌ Quitar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="incidenciasEncontradas.length === 0 && !buscando" class="no-data">
          <p>No se encontraron incidencias</p>
        </div>

        <div v-if="buscando" class="loading">
          <p>Buscando incidencias...</p>
        </div>
      </div>

      <div class="form-actions">
        <button @click="cerrar" class="btn-secondary">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { problemaService, type Problema, type ProblemaIncidencia } from '../api/ProblemaAPI';

interface Props {
  mostrar: boolean;
  problema: Problema | null;
}

interface Emits {
  (e: 'cerrar'): void;
  (e: 'guardado'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const buscando = ref(false);
const terminoBusqueda = ref('');
const incidenciasEncontradas = ref<any[]>([]);
const incidenciasVinculadas = ref<ProblemaIncidencia[]>([]);

// Cargar incidencias vinculadas cuando se abre el modal
watch(() => props.mostrar, async (nuevoValor) => {
  if (nuevoValor && props.problema?.idProblema) {
    await cargarIncidenciasVinculadas();
  } else {
    incidenciasEncontradas.value = [];
    incidenciasVinculadas.value = [];
    terminoBusqueda.value = '';
  }
});

const cargarIncidenciasVinculadas = async () => {
  if (!props.problema?.idProblema) return;
  
  try {
    const response = await problemaService.obtenerIncidenciasProblema(props.problema.idProblema);
    incidenciasVinculadas.value = response.data;
  } catch (error) {
    console.error('Error al cargar incidencias vinculadas:', error);
  }
};

const buscarIncidencias = async () => {
  if (!terminoBusqueda.value.trim()) {
    incidenciasEncontradas.value = [];
    return;
  }

  buscando.value = true;
  try {
    const response = await fetch(`http://localhost:3001/incidencias?busqueda=${encodeURIComponent(terminoBusqueda.value)}`);
    const data = await response.json();
    incidenciasEncontradas.value = data;
  } catch (error) {
    console.error('Error al buscar incidencias:', error);
    alert('Error al buscar incidencias');
  } finally {
    buscando.value = false;
  }
};

const estaVinculada = (idIncidencia: number): boolean => {
  return incidenciasVinculadas.value.some(vinculo => vinculo.idIncidencia === idIncidencia);
};

const vincularIncidencia = async (incidencia: any) => {
  if (!props.problema?.idProblema) return;

  try {
    await problemaService.vincularIncidencia(
      props.problema.idProblema, 
      incidencia.idIncidencia,
      `Vincular automáticamente desde gestión de problemas`
    );
    
    // Recargar la lista de vinculadas
    await cargarIncidenciasVinculadas();
    
    // Remover de encontradas si está ahí
    incidenciasEncontradas.value = incidenciasEncontradas.value.filter(
      i => i.idIncidencia !== incidencia.idIncidencia
    );

    alert('✅ Incidencia vinculada correctamente');
  } catch (error) {
    console.error('Error al vincular incidencia:', error);
    alert('Error al vincular incidencia');
  }
};

const desvincularIncidencia = async (idIncidencia: number) => {
  // Encontrar el ID del vínculo
  const vinculo = incidenciasVinculadas.value.find(v => v.idIncidencia === idIncidencia);
  if (!vinculo?.idProblemaIncidencia) return;

  try {
    await problemaService.desvincularIncidencia(vinculo.idProblemaIncidencia);
    
    // Recargar la lista de vinculadas
    await cargarIncidenciasVinculadas();
    
    alert('✅ Incidencia desvinculada correctamente');
  } catch (error) {
    console.error('Error al desvincular incidencia:', error);
    alert('Error al desvincular incidencia');
  }
};

const formatFecha = (fecha: string | undefined) => {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString('es-MX');
  } catch (error) {
    return 'Fecha inválida';
  }
};

const cerrar = () => {
  emit('cerrar');
  emit('guardado'); // Notificar que se hicieron cambios
};
</script>

<style scoped>
.busqueda-incidencias {
  display: flex;
  gap: 10px;
  align-items: center;
}

.busqueda-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.incidencias-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.incidencia-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.2s;
}

.incidencia-item.vinculada {
  background: #f0f9ff;
  border-color: #3b82f6;
}

.incidencia-info {
  flex: 1;
}

.incidencia-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.incidencia-header strong {
  color: #374151;
  font-size: 14px;
}

.incidencia-fecha {
  font-size: 12px;
  color: #6b7280;
}

.incidencia-detalles {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.incidencia-equipo,
.incidencia-estado,
.incidencia-tipo {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.incidencia-equipo {
  background: #dbeafe;
  color: #1e40af;
}

.incidencia-estado {
  background: #fef3c7;
  color: #92400e;
}

.incidencia-estado.cerrado {
  background: #d1fae5;
  color: #065f46;
}

.incidencia-tipo {
  background: #f3f4f6;
  color: #6b7280;
}

.incidencia-descripcion {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.vinculo-comentarios {
  font-size: 12px;
  color: #374151;
  margin-top: 5px;
  padding: 5px;
  background: #f1f5f9;
  border-radius: 4px;
}

.incidencia-actions {
  display: flex;
  gap: 5px;
}

.btn-success, .btn-warning {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

/* Reutilizar estilos existentes */
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

.loading, .no-data {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: #4b5563;
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