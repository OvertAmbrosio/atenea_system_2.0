import { model, Schema, Document } from 'mongoose';
import { IMaterial } from './Material';
import { IContrata } from './Contrata';
import { IEmpleado } from './Empleado';

export interface IFerreteriaAlmacen {
  material: string | IMaterial,
  contable: number,
  entrada: number,
  salida: number
}

export interface IAlmacen extends Document {
  tipo: string,
  ferreteria?: Array<IFerreteriaAlmacen>,
  contrata?: IContrata | string,
  tecnico?: IEmpleado | string
};

const almacenSchema = new Schema({
  tipo: {//IMC, IMP, IMS
    type: String,
    uppercase: true,
    trim: true,
    required: true
  },
  ferreteria: [{//array de elementos de la ferreteria
    //los elementos contables son el stock que hay
    //los elementos entrada son los que aun estan pendientes por aceptar
    //los elementos salida son los que se han trasladado a otros almacen
    _id: false,
    material: {
      type: Schema.Types.ObjectId,
      ref: 'Materiale'
    },
    contable: {
      type: Number,
      min: 0,
      default: 0
    },
    entrada: {
      type: Number,
      min: 0,
      default: 0
    },
    salida: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  contrata: {
    type: Schema.Types.ObjectId,
    ref: 'Contrata',
    default: null
  },
  tecnico: {
    type: Schema. Types.ObjectId,
    ref: 'Empleado',
    default: null
  }
},
{
  timestamps: true
});

export default model<IAlmacen>('Almacene', almacenSchema);