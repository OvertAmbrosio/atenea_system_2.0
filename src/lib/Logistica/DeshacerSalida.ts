import Equipo from '../../models/Equipo';
import Almacen from '../../models/Almacen';
import { ILote } from '../../models/Albaran';
import logger from '../logger';
/**
 * @param {Array} lote - Lote de materiales
 * @param {string} almacenEntrada - Almacen a donde se dirigía el lote
 * @param {string} almacenSalida - Almacen de donde salía el lote
 */
export default async function DeshacerSalida(lote: Array<ILote>, almacenEntrada: string, almacenSalida: string): Promise<ILote[]> {
  let nuevoLote = lote;
  //funcion que regresa los equipos al almacen de salida
  const EquiposDeshacer = async (material:string, series:Array<string>):Promise<boolean> => {
    return await Equipo.updateMany({
      _id: { $in: series } }, {
      estado: 'contable', almacen_entrada: almacenSalida, almacen_salida: undefined
    }).then(() => {
      return true
    }).catch((error) => {
      logger.error({
        message: error.message,
        service: `EquiposDeshacer(deshacer salida) - ${material} - ${series.length}`
      })
      return false
    })
  }
  //funcion que retira la ferreteria del almacen de la contrata/tecnico
  const FerreteriaEntrada = async (material: string, cantidad: number): Promise<boolean> => {
    return await Almacen.updateOne({
      _id: almacenEntrada, 'ferreteria.material': material }, {
      $inc: { 
        'ferreteria.$.entrada': -cantidad
      }
    }).then(() => true).catch((error) => {
      logger.error({
        message: error.message,
        service: `DeshacerSalida(FerreteriaEntrada) ${material} - ${cantidad}`
      });
      return false
    });
  };
  //funcion que devuelve la cantidad al almacen de salida (central/contrata)
  const FerreteriaSalida = async (material: string, cantidad: number): Promise<boolean> => {
    return await Almacen.updateOne({
      _id: almacenSalida, 'ferreteria.material': material }, {
      $inc: { 
        'ferreteria.$.contable': cantidad, 
        'ferreteria.$.salida': -cantidad 
      } 
    }).then(() => true).catch((error) => {
      logger.error({
        message: error.message,
        service: `DeshacerSalida(FerreteriaSalida) ${material} - ${cantidad}`
      });
      return false
    })
  };

  return Promise.all(lote.map( async(item, i) => {
    if (item.status === true) {
      if (item.seriado === true && item.series) {
        await EquiposDeshacer(item.material, item.series)
          .then(e => {
            if (e == true) {
              nuevoLote[i].status = false;
              return true
            } else {
              nuevoLote[i].status = true;
              return false
            }
          }).catch((error) => error);
      } else {
        return Promise.all([
          FerreteriaEntrada(item.material, item.cantidad), 
          FerreteriaSalida(item.material, item.cantidad)
        ]).then((data) => {
          const errores = data.filter(e => e === false);
          if (errores.length > 0) {
            return true
          } else {
            nuevoLote[i].status = false;
          }
        }).catch(() => {
          return false
        })
      }
    } else {
      return true
    }
  })).then(() =>  nuevoLote)
}