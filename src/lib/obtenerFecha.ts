import moment from 'moment-timezone';

export default function obtenerFecha (){
  let fechaLocal = moment().tz("America/Lima").format('YYYY-MM-DD');
  let fechaHoraLocal = moment(fechaLocal).add(5, 'hours').format('YYYY-MM-DD hh:mm');
  let fechaActual = new Date();
  return {fechaActual, fechaLocal, fechaHoraLocal}
};
