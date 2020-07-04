import Orden from '../models/Orden';
import logger from '../lib/logger';

export default async function ValidarOrden (data:Array<any>): Promise<boolean> {
  return await Orden.find({
    _id: { $in: data }, 
    'contrata_asignada.tecnico_asignado.estado_orden': 2
  }).then((data) => {
    if (data.length !== 0) {//si el tamaño es diferente de 0 entonces si hay data por aprobar
      return false
    } else {//si el tamaño es ifual a 0 entonces no hay data pendiente y se puede continuar
      return true
    }
  }).catch((error) => {
    logger.error({
      message: error.message,
      service: 'ValidarOrden'
    })
    return false
  })
}