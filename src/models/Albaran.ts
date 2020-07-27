import { Schema, model, Document } from 'mongoose';

export interface ILote {
  material: string | any,
  seriado: boolean,
  cantidad: number,
  series?: Array<string>,
  status: boolean
}

export interface IAlbaran extends Document {
  tipo: string,
  codigo: string,
  lote: ILote[],
  almacen_entrada: string,
  almacen_salida?: string | any,
  usuario_entrega: string,
  usuario_confirma?: string
  estado_registro: string,
  estado_operacion: string,
  observacion_entrada?: string,
  observacion_salida?: string,
  fecha_entrega?: Date,
  fecha_salida?: Date,
  fecha_confirmacion?: Date
};

const albaranSchema = new Schema({
  tipo: {//entrada, salida, devolucion, traslado
    type: String,
    lowercase: true,
    trim: true,
    default: 'entrada'
  },
  lote: [{
    _id: false,
    material: {
      type: Schema.Types.ObjectId,
      ref: 'Materiale'
    },
    seriado: {//true - equipos, false - ferreteria
      type: Boolean,
    },
    cantidad: {
      type: Number,
      min: 0,
      default: 0
    },
    series: Array,
    status: Boolean, //true - success, false - error
  }],
  almacen_entrada: {
    type: Schema.Types.ObjectId,
    ref: 'Almacene'
  },
  almacen_salida: {
    type: Schema.Types.ObjectId,
    ref: 'Almacene',
    default: null
  },
  usuario_entrega: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado'
  },
  usuario_confirma: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado',
    default: null
  },
  estado_registro: {//entrada, pendiente, aprobado, rechazado
    type: String,
    trim: true,
    uppercase: true,
    default: 'ENTRADA'
  },
  estado_operacion: {//success = todo bien, error = con errores, deshacer = accion deshecha
    type: String,
    trim: true,
    lowercase: true,
    default: 'success'
  },
  observacion_entrada: {
    type: String,
    trim: true,
    lowercase: true,
    default: '-'
  },
  observacion_salida: {
    type: String,
    trim: true,
    lowercase: true,
    default: '-'
  },
  fecha_entrega: {
    type: Date,
    default: null
  },
  fecha_salida: {
    type: Date,
    default: null
  },
  fecha_confirmacion: {
    type: Date,
    default: null
  }
},
{
  timestamps: true
});

export default model<IAlbaran>('Albarane', albaranSchema);