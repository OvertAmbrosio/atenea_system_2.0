import { model, Schema, Document } from 'mongoose';

export interface IContrata extends Document {
  nombre: string;
  ruc?: string,
  descripcion?: string,
  fecha_incorporacion?: Date
}

const contrataSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  ruc: {
    type: String,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  fecha_incorporacion: {
    type: Date,
    trim: true
  }
},
{
  timestamps: true
});

export default model<IContrata>('Contrata', contrataSchema);
