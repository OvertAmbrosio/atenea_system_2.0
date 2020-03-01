import { model, Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUsuario, Usuario } from './usuario'

export interface IEmpleado extends Document {
  usuario: IUsuario,
  nombre?: string,
  apellido?: string,
  fecha_nacimiento?: Date,
  cargo?: string,
  contrata?: {
    nombre?: string,
    slug?: string
  },
  documento_identidad?: {
    tipo?: boolean,
    numero?: string
  },
  area?: {
    nombre?: string,
    codigo?: string
  }
  carnet?: string,
  estado_empresa?: {
    fecha_ingreso?: Date,
    fecha_baja?: Date,
    activo?: boolean
  },
  nacionalidad?: string,
  obervacion?: string
}

const empleadoSchema = new Schema({
  usuario: Usuario,
  nombre: String,
  apellido: String,
  fecha_nacimiento: Date,
  cargo: {
    type: String,
    default: 'Cargo no definido.'
  },
  contrata: {
    nombre: String,
    slug: {
      type: String,
      default: null
    }
  },
  documento_identidad: {
    tipo: Boolean,
    numero: String
  },
  area: {
    nombre: String,
    codigo: {
      type: String,
      default: null
    }
  },
  carnet: {
    type: String,
    default: null
  },
  estado_empresa: {
    fecha_ingreso: Date,
    fecha_baja: Date,
    activo: Boolean
  },
  nacionalidad: {
    type: String,
    default: 'PERUANA'
  },
  observacion: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

empleadoSchema.pre<IEmpleado>('save', async function (next) {
  const empleado = this;
  if (!empleado.isModified('usuario.password')) return next();

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(empleado.usuario.password, salt);
  empleado.usuario.password = hash;
  next()
});

empleadoSchema.methods.comparePassword = async function (password: String): Promise<boolean> {
  return await bcrypt.compare(password, this.usuario.password);
};

export default model<IEmpleado>('Empleado', empleadoSchema);