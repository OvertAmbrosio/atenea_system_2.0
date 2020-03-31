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
    nombre_tecnico?: {
      id?: string,
      nombre?: string
    }
  },
  detalle_registro?: {
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
  }
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
    nombre_tecnico: {
      id: {
        type: String,
        trim: true,
        default: null
      },
      nombre: {
        type: String,
        trim: true,
        default: 'Sin asignar.'
      }
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
      default: null,
    },
    contrata: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    usuario: { //nombre + apellido
      type: String,
      required: true,
      default: null
    },
    tecnico: {//nombre del técnico
      type: String,
    },
    observacion: {
      type: String,
      default: null
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