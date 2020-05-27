import { model, Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  nombre: string,
  tipo?: string,
  medida?: string,
  seriado?: boolean
}

const materialSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  tipo: {
    type: String,
    uppercase: true,
    trim: true
  },
  medida: {
    type: String,
    uppercase: true,
    trim: true,
    default: 'UNIDAD'
  },
  seriado: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default model<IMaterial>('Materiale', materialSchema);