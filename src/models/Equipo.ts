import { model, Schema, Document } from 'mongoose';
import { IMaterial } from './Material';
import { IAlmacen } from './Almacen';

export interface IOEquipo {
  _id: string,
  material: IMaterial,
  fecha_asignado?: Date,
  fecha_recibido?: Date,
  estado?: string,
  almacen_salida: IAlmacen,
  almacen_entrada: IAlmacen
}

export interface IEquipo extends Document {
  _id: string,
  material: string,
  fecha_asignado?: Date,
  fecha_recibido?: Date,
  estado?: string,
  almacen_salida?: string|any,
  almacen_entrada: string|any
};

const equipoSchema = new Schema({
  _id: {//serie
    type: String,
    trim: true,
    required: true,
  },
  material: {
    type: Schema.Types.ObjectId,
    ref: 'Materiale'
  },
  fecha_asignado: {//fecha de asignacion del equipo al tecnico
    type: Date,
    default: null
  },
  fecha_recibido: {//fecha de recepción del equipo
    type: Date,
    default: null
  },
  estado: {
    type: String,
    lowercase: true,
    trim: true,
    default: 'contable' //contable/traslado/liquidado *traslado los que aun no se acepten, una vez aceptados serán contables
  },//se sabe los que van a entrar al almacenPrimario porque la salida es del central, los que salen seran salida del primario
  almacen_salida: {// -        , Principal, Primario
    type: Schema.Types.ObjectId,
    ref: 'Almacene'
  },
  almacen_entrada: {//Principal, Primario, Secundario
    type: Schema.Types.ObjectId,
    ref: 'Almacene'
  }
}, {
  timestamps: true
});

export default model<IEquipo>('Equipo', equipoSchema);
