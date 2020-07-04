import { Document, Schema, model } from 'mongoose';
import { IMaterial } from './Material';

export interface IEquipoBaja extends Document {
  serie: string,
  material: string | IMaterial,
  estado: string,
  orden: string,
  tecnico: string,
  contrata: string,
  usuario_entrega: string,
  usuario_aprueba?: string,
  observacion_entrega?: string,
  observacion_aprueba?: string
};

const equipoBajaSchema = new Schema({
  serie: {
    type: String,
    required: true,
    uppercase: true
  },
  material: {
    type: Schema.Types.ObjectId,
    ref: 'Materiale'
  },
  estado: {
    type: String,
    required: true,
    lowercase: true,
    default: 'traslado'
  },
  orden: {
    type: String,
    uppercase: true,
  },
  tecnico: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado'
  },
  contrata: {
    type: Schema.Types.ObjectId,
    ref: 'Contrata'
  },
  usuario_entrega: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado'
  },
  usuario_aprueba: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado'
  },
  observacion_entrega: {
    type: String,
    lowercase: true,
  },
  observacion_aprueba: {
    type: String,
    lowercase: true,
  }
},
{
  timestamps: true
});

export default model<IEquipoBaja>('EquipoBaja', equipoBajaSchema);