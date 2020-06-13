import Almacen from '../../../models/Almacen';
import logger from '../../logger';

interface IMaterial {
  material: string,
  cantidad: number
}

//funcion que liquida el material de ferreteria
//retorna true para las operaciones correctas y false para los errores 
export default async function LiquidarFerreteria(data: Array<IMaterial>, almacen: string, tipo: string):Promise<boolean> {
  if (data.length === 0) {
    return true;
  } else {
    return Promise.all(data.map(async(item) => {
      if (tipo === 'pendiente') {
        return await Almacen.updateOne({
          _id: almacen, 'ferreteria.material': item.material
        }, {
          $inc: { 
            'ferreteria.$.contable': -Number(item.cantidad), 
            'ferreteria.$.salida': Number(item.cantidad) 
          } 
        }).then(() => true).catch((error) => {
          logger.error({
            message: error.message,
            service: `Error liquidando ferreteria(pendiente) - ${item.material} - ${item.cantidad}`
          })
          return false;
        });
      } else if (tipo === 'rechazado') {
        return await Almacen.updateOne({
          _id: almacen, 'ferreteria.material': item.material
        }, {
          $inc: { 
            'ferreteria.$.contable': Number(item.cantidad), 
            'ferreteria.$.salida': -Number(item.cantidad) 
          } 
        }).then(() => true).catch((error) => {
          logger.error({
            message: error.message,
            service: `Error liquidando ferreteria(rechazado) - ${item.material} - ${item.cantidad}`
          })
          return false;
        });
      } else {
        return await Almacen.updateOne({
          _id: almacen, 'ferreteria.material': item.material
        }, {
          $inc: { 
            'ferreteria.$.salida': -Number(item.cantidad) 
          } 
        }).then(() => true).catch((error) => {
          logger.error({
            message: error.message,
            service: `Error liquidando ferreteria(aceptado) - ${item.material} - ${item.cantidad}`
          })
          return false;
        });
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