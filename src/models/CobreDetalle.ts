import { Schema } from 'mongoose';

export interface ICobreDetalle extends Document {
  numero_inscripcion?: string,
  codigo_mdf?: string,
  codigo_armario?: string,
  cable_primario?: string,
  par_primario?: string,
  cable_secundario?: string,
  par_secundario?: string,
  codigo_terminal?: string,
  codigo_borne?: string,
  detalle_segmento?: string,
  nombre_cliente?: string,
  codigo_area?: string,
  codigo_cabecera?: string,
  cuenta_ubilic?: string,
  ubilic?: string,
  carnet?: string,
  codigo_jefatura?: string,
  nombre_contacto?: string,
  codigo_lic?: string,
  codigo_estacion?: string,
  descripcion_segmento?: string,
  dslam?: string,
  cable_adsl?: string,
  par_adsl?: string,
  codigo_posicion?: string,
}

const CobreDetalle = new Schema({
  numero_inscripcion: {
    type: String,
    trim: true,
    default: '-'
  },
  codigo_mdf: {
    type: String,
    trim: true,
    default: '-'
  },
  codigo_armario: {
    type: String,
    trim: true,
    default: '-'
  },
  cable_primario: {
    type: String,
    trim: true,
    default: '-'
  },
  par_primario: {
    type: String,
    trim: true,
    default: '-'
  },
  cable_secundario: {
    type: String,
    trim: true,
    default: '-'
  },
  par_secundario: {
    type: String,
    trim: true,
    default: '-'
  },
  codigo_terminal: {
    type: String,
    trim: true,
    default: '-'
  },
  codigo_borne: {
    type: String,
    trim: true,
    default: '-'
  },
  detalle_segmento: {
    type: String,
    trim: true,
    default: '-'
  },
  nombre_cliente: {
    type: String,
    trim: true,
    default: '-'
  },
  //DETALLES DE BASICAS
  codigo_area: {
    type: String,
    trim: true,
    default: '-'
  },
  codigo_cabecera: {
    type: String,
    trim: true,
    default: '-'
  },
  cuenta_ubilic: {
    type: String,
    trim: true,
    default: '-'
  },
  ubilic: {
    type: String,
    trim: true,
    default: '-'
  },
  carnet: {
    type: String,
    trim: true,
    default: '-'
  },
  codigo_jefatura: {
    type: String,
    trim: true,
    default: '-'
  },
  nombre_contacto: {
    type: String,
    trim: true,
    default: '-'
  },
  codigo_lic: {
    type: String,
    trim: true,
    default: '-'
  },
  //DETALLES DE SPEEDY
  codigo_estacion: {
    type: String,
    trim: true,
    default: '-'
  },
  descripcion_segmento: {
    type: String,
    trim: true,
    default: '-'
  },
  dslam: {
    type: String,
    trim: true,
    default: '-'
  },
  cable_adsl: {
    type: String,
    trim: true,
    default: '-'
  },
  par_adsl: {
    type: String,
    trim: true,
    default: '-'
  },
  codigo_posicion: {
    type: String,
    trim: true,
    default: '-'
  },
}, { 
  _id : false
});

export default CobreDetalle;