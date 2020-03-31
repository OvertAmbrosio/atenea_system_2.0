import { model, Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import Usuario, { IUsuario } from './Usuario'

export interface IEmpleado extends Document {
  usuario: IUsuario;
  nombre: string;
  apellidos: string;
  fecha_nacimiento?: Date;
  cargo?: string;
  contrata?: {
    nombre?: string,
    slug?: string
  };
  documento_identidad?: {
    tipo?: boolean,
    numero?: string
  };
  area?: {
    nombre?: string,
    codigo?: string
  };
  carnet?: string;
  estado_empresa?: {
    fecha_ingreso?: Date,
    fecha_baja?: Date,
    activo?: boolean
  };
  nacionalidad?: string;
  obervacion?: string;
  comparePassword: (password: string) => Promise<boolean>;
}

const empleadoSchema = new Schema({
  usuario: Usuario,
  nombre: {
    type: String,
    trim: true,
    uppercase: true
  },
  apellidos: {
    type: String,
    trim: true,
    uppercase: true
  },
  fecha_nacimiento: {
    type: Date,
    default: Date.now()
  },
  contrata: {
    nombre: {
      type: String,
      default: null
    },
    slug: {
      type: String,
      default: null
    }
  },
  documento_identidad: {
    tipo: {
      type: Boolean,
      default: true
    },
    numero: {
      type: String,
      default: null
    }
  },
  area: {
    type: String,
    trim: true,
    default: 'basicas'
  },
  carnet: {
    type: String,
    default: null
  },
  estado_empresa: {
    fecha_ingreso: Date,
    fecha_baja: Date,
    activo: {
      type: Boolean,
      default: true
    }
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