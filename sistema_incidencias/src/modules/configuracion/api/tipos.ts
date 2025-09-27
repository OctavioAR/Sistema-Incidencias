export interface Software {
  idSoftware?: number;
  nombre: string;
  version: string;
  fabricante: string;
  tipoLicencia: 'Libre' | 'Comercial' | 'Educativa' | 'Prueba';
  fechaExpiracionLicencia?: string;
  requiereActivacion: boolean;
  comentarios?: string;
}

export interface EquipoSoftware {
  idEquipoSoftware?: number;
  idEquipo: number;
  idSoftware: number;
  fechaInstalacion: string;
  licenciaKey?: string;
  usuarioInstalacion: string;
  comentarios?: string;
}

export interface ContratoMantenimiento {
  idContrato?: number;
  idEquipo: number;
  proveedor: string;
  numeroContrato: string;
  contactoProveedor: string;
  telefonoContacto: string;
  emailContacto: string;
  fechaInicio: string;
  fechaFin: string;
  costo: number;
  cobertura: string;
  estado: 'Vigente' | 'Vencido' | 'Cancelado' | 'Pendiente';
}

export interface TipoRelacion {
  idTipoRelacion?: number;
  nombre: string;
  descripcion?: string;
  inversa?: string;
}

export interface RelacionCI {
  idRelacion?: number;
  idCIOrigen: number;
  tipoCIOrigen: 'equipo' | 'software' | 'aula' | 'edificio' | 'usuario' | 'departamento';
  idCIDestino: number;
  tipoCIDestino: 'equipo' | 'software' | 'aula' | 'edificio' | 'usuario' | 'departamento';
  idTipoRelacion: number;
  usuarioCreacion: number;
  comentarios?: string;
  fechaCreacion?: string;
}

export interface ConfiguracionCompleta {
  equipo: any;
  software: EquipoSoftware[];
  contratos: ContratoMantenimiento[];
  relaciones: RelacionCI[];
}