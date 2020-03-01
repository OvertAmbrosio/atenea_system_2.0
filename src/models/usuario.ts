import { Schema } from 'mongoose';

export interface IUsuario extends Document {
  email: string,
  password: string,
  imagen_perfil?: string,
  tipo?: string,
  estado?: boolean
}

export const Usuario = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowecase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  imagen_perfil: String,
  tipo: {
    type: String,
    required: true,
    default: 'tecnico',
  },
  estado: {
    type: Boolean,
    default: false
  }
}, { 
  _id : false
});