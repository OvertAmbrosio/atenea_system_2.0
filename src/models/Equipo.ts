import { model, Schema, Document } from 'mongoose';

export interface IEquipo extends Document {
  _id: string,
  material: string,
  estado?: string,
  almacen_salida?: string,
  almacen_entrada: string
};

const equipoSchema = new Schema({
  _id: {//serie
    type: String,
    required: true,
  },
  material: {
    type: Schema.Types.ObjectId,
    ref: 'Materiale'
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
