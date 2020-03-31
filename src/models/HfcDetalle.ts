import { Schema } from 'mongoose';

export interface IHfcDetalle extends Document {
  codigo_orden?: string,
  codigo_cliente?: string,
  tipo_requerimiento?: string,
  codigo_motivo?: string,
  codigo_zonal?: string,
  detalle_trabajo?: string,
  codigo_nodo?: string,
  codigo_troba?: string,
  codigo_incidencia?: string,
  numero_reiterada?: string,
  tipo_tecnologia?: string,
  codigo_pai?: string,
  movistar_total?: boolean,
}

const HfcDetalle = new Schema({
  codigo_orden: {
    type: String,
    trim: true
  },
  codigo_cliente: {
    type: String,
    trim: true
  },
  tipo_requerimiento: {
    type: String,
    trim: true
  },
  codigo_motivo: {
    type: String,
    trim: true
  },
  codigo_zonal: {
    type: String,
    trim: true
  },
  detalle_trabajo: String,
  codigo_nodo: {
    type: String,
    trim: true
  },
  codigo_troba: {
    type: String,
    trim: true
  },
  codigo_incidencia: {
    type: String,
    trim: true
  },
  numero_reiterada: {
    type: String,
    trim: true
  },
  tipo_tecnologia: {
    type: String,
    trim: true
  },
  codigo_pai: {
    type: String,
    trim: true
  },
  movistar_total: {
    type: Boolean,
    trim: true
  }
}, { 
  _id : false
});

export default HfcDetalle;