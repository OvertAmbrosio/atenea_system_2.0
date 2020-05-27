import EntradaFerreteria from './Ferreteria/EntradaFerreteria';
import EntradaEquipos from './Equipos/EntradaEquipos';
import { ILote } from '../../models/Albaran';
import logger from '../logger';

interface IMaterialData {
  material: string,//objeto id
  nombre: string,
  cantidad: number, 
  seriado: boolean,
  series: Array<string>
}
/**
 * @param {Array} data - data de materiales a guardar
 * @param {string} almacen - codigo del almacen central
*/
export default function EntradaAlmacen(data: Array<IMaterialData>, almacen: string): Promise<Array<ILote>> {
  return new Promise(async(resolve, reject) => {
    if (data.length === 0 || !almacen) {//comprobar si hay datos y si se manda el codigo de almacen
      return reject({message: 'Error obteniendo la data o el codigo de almacen.'});
    } else {
      Promise.all(data.map(async(item):Promise<ILote> => {//promesa que recorre la data de materiales
        if (item.seriado && (item.series).length > 0) {//si el material es seriado y tiene series ejecutar la funcion de quipos
          return await EntradaEquipos(item, almacen).then((respuesta):ILote => {
            return {
              material: item.material, 
              seriado: item.seriado, 
              cantidad:item.cantidad, 
              series: item.series, 
              status: respuesta};//devolver el id del material y el estado
          }).catch((error) => {
            logger.error({
              message: error.message,
              service: `Error ejecutando la funcion EntradaEquipos - ${item.material}`
            })
            return {
              material: item.material, 
              seriado: item.seriado, 
              cantidad:item.cantidad, 
              series: item.series, 
              status: false};//devolver el id y el estado
          })
        } else {//si no es seriado es ferreteria
          return await EntradaFerreteria(item, almacen).then((respuesta) => {
            return {//devolver el id del material y el estado
              material: item.material, 
              seriado: item.seriado, 
              cantidad:item.cantidad, 
              series: item.series, 
              status: respuesta
            };
          }).catch((error) => {
            logger.error({
              message: error.message,
              service: `Error ejecutando la funcion EntradaFerreteria - ${item.material}`
            })
            return {//devolver el id y el estado
              material: item.material, 
              seriado: item.seriado, 
              cantidad:item.cantidad, 
              series: item.series, 
              status: false
            };
          })
        }  
      })).then((data) => {
        return resolve(data);
      }).catch((error) => {
        return reject(error);
      })
    }  
  })
};