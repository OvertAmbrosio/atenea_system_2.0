import { Schema } from 'mongoose';

export interface IUsuario extends Document {
  email: string,
  password: string,
  password2: string,
  imagen_perfil?: string,
  tipo?: string,
  estado?: boolean
}

const Usuario = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {//se cambia en el perfil del usuario
    type: String,
    required: true,
    trim: true
  },
  imagen_perfil: {//se cambia en el perfil del usuario
    type: String,
    default: 'https://res.cloudinary.com/ateneasystem/image/upload/v1583164290/avatar/mujer_3_pxlkpv.jpg'
  },
  tipo: {
    type: Number,
    min:1,
    max: 5,
    required: true,
    default: 5, 
    //nivel 1 es administrador
    //nivel 2 es lider de gestion
    //nivel 3 es jefe de contrata/ logistica
    //nivel 4 es gestor
    //Nivel 5 es técnico
  },
  estado: {//se cambia en el area de gestion de Administrador
    type: Boolean,
    default: true
  }
}, { 
  _id : false
});

export default Usuario;