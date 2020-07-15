import { model, Schema, Document } from 'mongoose';
import HfcDetalle, { IHfcDetalle } from './HfcDetalle';
import CobreDetalle, { ICobreDetalle } from './CobreDetalle';

interface IImagen {
  titulo: string,
  url: string,
  public_id: string,
  id: string
};

export interface IOrden extends Document {
  codigo_requerimiento: string,
  codigo_segmento?: string,
  detalle_motivo?: string,
  fecha_registro?: Date,
  direccion?: string,
  telefono?: string,
  distrito?: string,
  reiterada?: string,
  tipo?: string,
  referencia?:string,
  imagen_referencia: {
    [key:string]: IImagen
  },
  hfc_detalle: IHfcDetalle,
  cobre_detalle: ICobreDetalle,
  estado_sistema?: {
    estado?: string,
    fecha_liquidada?: Date,
    observacion?: string
  },
  contrata_asignada?: {
    contrata?: string|any,
    estado?: string,
    tecnico_asignado?: {//1=asignado,2=pendiente,3=liquidado,4=rechazado
      id?: string,
      nombre_tecnico?: string,
      estado_orden?: number,
      observacion?: string,
      imagenes?: [{
        titulo?: string,
        url?: string,
        public_id?: string
      }],
      fecha_enviado?: Date,
      fecha_finalizado?: Date,
      material_usado?: {
        almacen_actual?: string,
        material_no_seriado?: {
          material?: string,
          cantidad?: number
        },
        material_seriado?: {
          material?: string,
          almacen_anterior?: string,
          serie?: string,
        },
        material_baja?: {
          material?: string,
          serie?: string,
        },
      }
    },
    observacion?: string
  },
  detalle_registro?: [{
    fecha_actualizado?: Date,
    estado?: string,
    contrata?: string|any,
    usuario?: string,
    tecnico?: string,
    observacion?: string,
    imagenes?: {
      titulo?: string,
      url?: string,
      public_id?: string
    },
    codigo_subido?: number
  }],
  asignado: boolean
};

const ordenSchema = new Schema({
  codigo_requerimiento: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase:true
  },
  codigo_segmento: {
    type: String,
    trim: true,
    default: '-'
  },
  detalle_motivo: {
    type: String,
    trim: true,
    default: '-'
  },
  fecha_registro: {
    type: Date,
    default: new Date(1)
  },
  direccion: {
    type: String,
    default: '-'
  },
  telefono: {
    type: String,
    trim: true,
    default: '-'
  },
  distrito: {
    type: String,
    trim: true,
    uppercase: true,
    default: '-'
  },
  reiterada: {
    type: String,
    trim: true,
    default: '-'
  },
  referencia: {
    type: String,
    trim: true,
    default: '-'
  },
  tipo: {
    type: String,
    trim: true,
    required: true,
    default: null
  },
  imagen_referencia: {
    titulo: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    },
    id: {
      type: String,
      default: null
    },
    public_id: {
      type: String,
      default: null
    },
  },
  hfc_detalle: HfcDetalle,
  cobre_detalle: CobreDetalle,
  estado_sistema: {
    estado: {
      type: String,
      uppercase: true,
      trim: true,
      default: 'PENDIENTE'
    },
    fecha_liquidada: {
      type: Date,
      default: null
    },
    observacion: {
      type: String,
      default: null,
    }
  },
  contrata_asignada: {
    contrata: {
      type: Schema.Types.ObjectId,
      ref: 'Contrata'
    },
    estado: {
      type: String,
      trim: true,
      default: 'Pendiente'
    },
    tecnico_asignado: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Empleado'
      },
      nombre_tecnico: {
        type: String,
        default: 'Sin asignar.'
      },
      estado_orden: {//1=asignado, 2=pendiente, 3=finalizado, 4=rechazado. saber las que estan por aprobar por que tienen numero 2
        type: Number,
        trim: true,
        default: null
      },
      observacion: {
        type: String,
        default: '-'
      },
      imagenes: [{
        titulo: String,
        url: String,
        public_id: String
      }],
      fecha_enviado: {
        type: Date,
        default: null
      },
      fecha_finalizado: {
        type: Date,
        default: null
      },
      material_usado: {
        almacen_actual: {//almacen del tecnico
          type: Schema.Types.ObjectId,
          ref: 'Almacene'
        },
        material_no_seriado: [{
          material: {
            type: Schema.Types.ObjectId,
            ref: 'Materiale'
          },
          cantidad: {
            type: Number,
            default: 0
          },
        }],
        material_seriado: [{
          material: {
            type: Schema.Types.ObjectId,
            ref: 'Materiale'
          },
          almacen_anterior: {
            type: Schema.Types.ObjectId,
            ref: 'Almacene'
          },
          serie: String,
        }],
        material_baja: [{
          material: {
            type: Schema.Types.ObjectId,
            ref: 'Materiale'
          },
          serie: String,
        }],
      }
    },
    observacion: {
      type: String,
      trim: true
    }
  },
  detalle_registro: [{
    fecha_actualizado: {
      type: Date,
      default: new Date()
    },
    estado: {
      type: String,
      trim: true,
      default: '-',
    },
    contrata: {
      type: Schema.Types.ObjectId,
      ref: 'Contrata'
    },
    usuario: { //email
      type: String,
      required: true,
      default: '-'
    },
    tecnico: {//nombre del técnico
      type: String,
      default: '-'
    },
    observacion: {
      type: String,
      default: '-'
    },
    imagenes: [{
      titulo: String,
      url: String,
      public_id: String
    }],
    codigo_subido: {
      type: Number,
      default: 0
    }
  }],
  asignado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default model<IOrden>('Ordene', ordenSchema);