import Equipo from '../../models/Equipo';
import Almacen from '../../models/Almacen';
import { ILote } from '../../models/Albaran';
import logger from '../logger';
import GuardarMovimiento from './GuardarMovimiento';
/**
 * @param {Array} lote - Lote de materiales
 * @param {string} almacenEntrada - Almacen a donde se dirigía el lote
 * @param {string} almacenSalida - Almacen de donde salía el lote
 */
export default async function AprobarRegistro(lote: Array<ILote>, almacenEntrada: string, almacenSalida: string, tecnico?:boolean): Promise<boolean> {
  let updateObject:any = {'estado': 'contable'};
  if(tecnico) {//true si es el tecnico quien acepta el registro
    updateObject.fecha_asignado = new Date();
  } else {
    updateObject.fecha_recibido = new Date();
  }
  //funcion que actualiza el equipo en contable
  const EquiposAprobar = async (material:string, series:Array<string>):Promise<boolean> => {
    return await Equipo.updateMany({
      _id: { $in: series } }, {
      $set: updateObject
    }).then(() => {
      return true
    }).catch((error) => {
      logger.error({
        message: error.message,
        service: `EquiposAprobar(aprobarRegistro) - ${material} - ${series.length}`
      })
      return false
    })
  }
  //funcion que actualiza(-entrada, +contable) la ferreteria del almacen de la contrata/tecnico
  const FerreteriaEntrada = async (material: string, cantidad: number): Promise<boolean> => {
    return await Almacen.updateOne({
      _id: almacenEntrada, 'ferreteria.material': material }, {
      $inc: { 
        'ferreteria.$.entrada': -cantidad,
        'ferreteria.$.contable': cantidad
      }
    }).then(async() => {
      return await GuardarMovimiento('entrada', almacenEntrada, material, cantidad);
    }).then(() => true).catch((error) => {
      logger.error({
        message: error.message,
        service: `AprobarRegistro(FerreteriaEntrada) ${material} - ${cantidad}`
      });
      return false
    });
  };
  //funcion que actualiza(-salida) la cantidad al almacen de salida (central/contrata)
  const FerreteriaSalida = async (material: string, cantidad: number): Promise<boolean> => {
    return await Almacen.updateOne({
      _id: almacenSalida, 'ferreteria.material': material }, {
      $inc: { 
        'ferreteria.$.salida': -cantidad 
      } 
    }).then(async() => {
      return await GuardarMovimiento('salida', almacenSalida, material, cantidad);
    }).then(() => true).catch((error) => {
      logger.error({
        message: error.message,
        service: `AprobarRegistro(FerreteriaSalida) ${material} - ${cantidad}`
      });
      return false
    })
  };

  return Promise.all(lote.map( async(item, i) => {
    if (item.status === true) {
      if (item.seriado === true && item.series) {
        await EquiposAprobar(item.material, item.series)
          .then(e => {
            if (e == true) {
              return true
            } else {
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
            return false
          }
        }).catch(() => {
          return false
        })
      }
    } else {
      return true
    }
  })).then(() => true)
}