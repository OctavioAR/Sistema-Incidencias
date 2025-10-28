import axios from "axios";
import type { AxiosResponse } from "axios";

export interface AlmacenItem {
  idAlmacen?: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;  // Permitir null
  categoria: 'hardware' | 'software' | 'consumibles' | 'herramientas' | 'repuestos';
  stock_actual: number;
  stock_minimo: number;
  ubicacion?: string | null;     // Permitir null
  proveedor?: string | null;     // Permitir null
  fecha_adquisicion?: string | null;  // Permitir null
  costo_unitario?: number | null;     // Permitir null
  estado: 'disponible' | 'agotado' | 'baja' | 'mantenimiento';
}

export interface MovimientoAlmacen {
  idMovimiento?: number;
  idAlmacen: number;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string;
  idUsuario: number;
  idIncidencia?: number;
  idRFC?: number;
  fecha_movimiento?: string;
  comentarios?: string;
}

const almacenAPI = axios.create({
  baseURL: "http://localhost:3001",
});

// Interceptor para autenticación
almacenAPI.interceptors.request.use(
  (config) => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (usuario && usuario.idUsuario) {
      config.headers['usuario-id'] = usuario.idUsuario;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const almacenService = {
  // Items de almacén
  obtenerItemsAlmacen: (): Promise<AxiosResponse<AlmacenItem[]>> =>
    almacenAPI.get<AlmacenItem[]>('/almacen'),
  
  obtenerItemAlmacen: (idAlmacen: number): Promise<AxiosResponse<AlmacenItem>> =>
    almacenAPI.get<AlmacenItem>(`/almacen/${idAlmacen}`),
  
  crearItemAlmacen: (item: Omit<AlmacenItem, 'idAlmacen'>): Promise<AxiosResponse<any>> =>
    almacenAPI.post('/almacen', item),
  
  actualizarItemAlmacen: (idAlmacen: number, item: Partial<AlmacenItem>): Promise<AxiosResponse<any>> =>
    almacenAPI.put(`/almacen/${idAlmacen}`, item),

  eliminarItemAlmacen: (idAlmacen: number): Promise<AxiosResponse<any>> =>
    almacenAPI.delete(`/almacen/${idAlmacen}`),

  // Movimientos
  registrarMovimiento: (movimiento: Omit<MovimientoAlmacen, 'idMovimiento'>): Promise<AxiosResponse<any>> =>
    almacenAPI.post('/almacen/movimientos', movimiento),
  
  obtenerMovimientos: (idAlmacen?: number): Promise<AxiosResponse<MovimientoAlmacen[]>> => {
    if (idAlmacen) {
      return almacenAPI.get<MovimientoAlmacen[]>(`/almacen/${idAlmacen}/movimientos`);
    } else {
      return almacenAPI.get<MovimientoAlmacen[]>('/almacen/movimientos');
    }
  },
};