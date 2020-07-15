import { Schema, model, Document } from 'mongoose';
import { IAlmacen } from './Almacen';
import { IMaterial } from './Material';

export interface IOMovimiento {
  tipo: string,
  almacen: IAlmacen,
  material: IMaterial,
  cantidad: number
}

interface IMovimiento extends Document {
  tipo: string,
  almacen: string,
  material: string,
  cantidad: number
};

const movimientoSchema = new Schema({
  tipo: {//si es entrada, salida o liquidación (liquidaciones tambien son salidas)
    type: String,
    required: true,
    lowercase: true,
  },
  almacen: {
    type: Schema.Types.ObjectId,
    ref: 'Almacene'
  },
  material: {
    type: Schema.Types.ObjectId,
    ref: 'Materiale'
  },
  cantidad: {
    type: Number,
    required: true
  }
},{
  timestamps: true
});

export default model<IMovimiento>('Movimiento', movimientoSchema)