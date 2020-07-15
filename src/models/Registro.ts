import { model, Schema, Document } from 'mongoose';

export interface IRegistro extends Document {
  tecnico: string,
  gestor: string,
  contrata: string,
  material_usado: {
    almacen_actual: string
    material_no_seriado: {
      material: string
      cantidad: number
    },
    material_seriado: {
      material: string,
      almacen_anterior: string,
      serie: string
    }
    material_baja: {
      material: string,
      serie: string
    }
  },
  imagenes?: [{
    titulo?: string,
    url?: string,
    public_id?: string
  }],
  observacion?: string
}

const registroSchema = new Schema({
  estado: {// pendiende, aprobado, recahzado
    type: String,
    default: 'pendiente'
  }, 
  codigo_requerimiento: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  tecnico: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado'
  },
  contrata: {
    type: Schema.Types.ObjectId,
    ref: 'Contrata'
  },
  gestor: {
    type: Schema.Types.ObjectId,
    ref: 'Empleado'
  },
  material_usado: {
    almacen_actual: {//almacen del tecnico
      type: Schema.Types.ObjectId,
      ref: 'Almacene'
    },
    material_no_seriado: [{
      material: {
        type: Schema.Types.ObjectId,
        ref: 'Materiale'
      },
      cantidad: {
        type: Number,
        default: 0
      },
    }],
    material_seriado: [{
      material: {
        type: Schema.Types.ObjectId,
        ref: 'Materiale'
      },
      almacen_anterior: {
        type: Schema.Types.ObjectId,
        ref: 'Almacene'
      },
      serie: String,
    }],
    material_baja: [{
      material: {
        type: Schema.Types.ObjectId,
        ref: 'Materiale'
      },
      serie: String,
    }],
  },
  imagenes: [{
    titulo: String,
    url: String,
    public_id: String
  }],
  observacion: {
    type: String,
    default: '-'
  },
},
{
  timestamps: true
});

export default model<IRegistro>('Registro', registroSchema);
