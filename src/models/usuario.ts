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
    max: 9,
    required: true,
    default: 9, 
    //nivel 1 es administrador -> todo
    //nivel 2 es Jefe de Operaciones -> Todo Operaciones / usuario
    //nivel 3 es Jefe de Logística -> Todo logística / Usuarios

    //nivel 4 es Lider de Gestión -> Todo Operaciones / parte de usuario
    
    //nivel 5 es Asistente de Logística -> Actualizar almacen, asignar material contrata / tecnico liteyca
    
    //nivel 6 es jefe de contrata/ (encargado de la logistica en la contrata)
    //nivel 7 es gestor
    //nivel 8 es almacenero
    //Nivel 9 es técnico
  },
  estado: {//se cambia en el area de gestion de Administrador
    type: Boolean,
    default: true
  }
}, { 
  _id : false
});

export default Usuario;