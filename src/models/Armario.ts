import { Schema, model, Document } from 'mongoose';

export interface IArmario extends Document {
  mdf: string,
  codigo_armario: string,
  direccion: string,
  cap?: string,
  ali?: string,
  dis?: string,
  a_lib?: string,
  d_lib?: string,
};

const armarioSchema = new Schema({
  mdf: {
    type: String,
    required: true,
  },
  codigo_armario: {
    type: String,
    required: true,
  },
  direccion: {
    type: String,
    required: true,
  },
  cap: {
    type: String,
    default: null
  },
  ali: {
    type: String,
    default: null
  },
  dis: {
    type: String,
    default: null
  },
  a_lib: {
    type: String,
    default: null
  },
  d_lib: {
    type: String,
    default: null
  }
});

export default model<IArmario>('Armario', armarioSchema);