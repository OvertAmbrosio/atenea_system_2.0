import Equipo from '../../../models/Equipo';
import logger from '../../logger';

interface IMaterial {
  material: string,
  almacen_anterior: string,
  serie: string
}

//funcion que liquida el equipo
//retorna true para las operaciones correctas y false para los errores 
export default async function LiquidarFerreteria(data: Array<IMaterial>, almacen_tecnico: string, tipo: string):Promise<boolean> {
  if (data.length === 0) {
    return true;
  } else {
    return Promise.all(data.map(async(item) => {
      if (tipo === 'pendiente') {
        return await Equipo.findOneAndUpdate({_id: item.serie}, {
          estado: 'traslado',
          almacen_salida: almacen_tecnico,
          almacen_entrada: undefined
        }).then(() => true).catch((error) => {
          logger.error({
            message: error.message,
            service: `Error liquidando equipo(pendiente) - ${item.serie}`
          });
          return false;
        })
      } else if (tipo === 'rechazado') {
        return await Equipo.findOneAndUpdate({_id: item.serie}, {
          estado: 'traslado',
          almacen_salida: item.almacen_anterior,
          almacen_entrada: almacen_tecnico
        }).then(() => true).catch((error) => {
          logger.error({
            message: error.message,
            service: `Error liquidando equipo(rechazado) - ${item.serie}`
          });
          return false;
        })
      } else {
        return await Equipo.findOneAndUpdate({_id: item.serie}, {
          estado: 'liquidado',
          almacen_salida: almacen_tecnico,
          almacen_entrada: item.almacen_anterior
        }).then(() => true).catch((error) => {
          logger.error({
            message: error.message,
            service: `Error liquidando equipo(liquidado) - ${item.serie}`
          });
          return false;
        })
      }
    })).then((respuesta) => {
      const errores = respuesta.filter(item => item === false)
      if (errores.length === 0) {
        return true
      } else {
        return false
      }
    })
  }
}
 