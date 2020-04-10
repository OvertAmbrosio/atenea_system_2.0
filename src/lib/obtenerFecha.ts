import moment from 'moment-timezone';

export default function obtenerFecha (){
  let fechaLocal = moment().tz("America/Lima").format('YYYY-MM-DD');
  let fechaActual = new Date();
  return {fechaActual, fechaLocal}
};
