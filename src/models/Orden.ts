import { model, Schema, Document } from 'mongoose';
import HfcDetalle, { IHfcDetalle } from './HfcDetalle';
import CobreDetalle, { ICobreDetalle } from './CobreDetalle'

export interface IOrden extends Document {
  codigo_requerimiento: string,
  codigo_segmento?: string,
  detalle_motivo?: string,
  fecha_registro?: Date,
  direccion?: string,
  telefono?: string,
  distrito?: string,
  tipo?: string,
  hfc_detalle: IHfcDetalle,
  cobre_detalle: ICobreDetalle,
  estado_sistema?: {
    estado?: string,
    fecha_liquidada?: Date,
    observacion?: string
  },
  contrata_asignada?: {
    nombre_contrata?: string,
    estado?: string,
    tecnico_asignado?: {//1=asignado,2=pendiente,3=liquidado,4=rechazado
      id?: string,
      nombre_tecnico?: string,
      estado_orden?: number,
      observacion?: string,
      imagenes?: {
        titulo?: string,
        url?: string,
        public_id?: string
      },
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
    contrata?: string
    usuario?: string,
    tecnico?: string,
    observacion?: string,
    imagenes?: {
      titulo?: string,
      url?: string,
      public_id?: string
    }
  }]
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
    default: null
  },
  detalle_motivo: {
    type: String,
    trim: true,
    default: null
  },
  fecha_registro: {
    type: Date,
    default: new Date(1)
  },
  direccion: {
    type: String,
    default: null
  },
  telefono: {
    type: String,
    trim: true,
    default: null
  },
  distrito: {
    type: String,
    trim: true,
    uppercase: true,
    default: null
  },
  tipo: {
    type: String,
    trim: true,
    required: true,
    default: null
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
    nombre_contrata: {
      type: String,
      trim: true,
      default: null
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
      nombre_tecnico: String,
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
      fecha_finalizado: {
        type: Date,
        default: null
      },
      material_usado: {
        almacen_actual: {
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
      type: String,
      trim: true,
      uppercase: true,
      default: '-',
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
    }]
  }],
  asignado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default model<IOrden>('Ordene', ordenSchema);