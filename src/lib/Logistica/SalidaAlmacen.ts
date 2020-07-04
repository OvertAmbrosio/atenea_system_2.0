import SalidaFerreteria from './Ferreteria/SalidaFerreteria';
import SalidaEquipos from './Equipos/SalidaEquipos';
import { ILote } from '../../models/Albaran';
import logger from '../logger';

interface IMaterialData {
  material: string,//objeto id
  nombre: string,//nombre del objeto
  cantidad: number, //centidad de ferreteria, length de series
  seriado: boolean, // falso ferreteria, true equipos
  series: Array<string> //series para equipos
}
/**
 * @param {Array} data - data de materiales a guardar
 * @param {string} almacen_entrada - codigo del almacen central
 * @param {string} almacen_salida - codigo del almacen de que recibe 
*/
export default function SalidaAlmacen(data: Array<IMaterialData>, almacen_salida: string, almacen_entrada: string): Promise<Array<ILote>> {
  return new Promise(async(resolve, reject) => {
    if (data.length === 0 || !almacen_entrada || !almacen_salida) {//comprobar si hay datos y si se manda el codigo de almacen
      return reject({message: 'Error obteniendo la data o el codigo de almacen.'});
    } else {
      Promise.all(data.map(async(item) => {//promesa que recorre la data de materiales
        if (item.seriado && (item.series).length > 0) {//si el material es seriado y tiene series ejecutar la funcion de quipos
          return await SalidaEquipos(item, almacen_salida, almacen_entrada).then((respuesta):ILote => {
            return {
              material: item.material, 
              seriado: item.seriado, 
              cantidad:item.cantidad, 
              series: item.series, 
              status: respuesta};//devolver el id del material y el estado
          }).catch((error) => {
            logger.error({
              message: error.message,
              service: `Error ejecutando la funcion SalidaEquipos - ${item.material}`
            })
            return {
              material: item.material, 
              seriado: item.seriado, 
              cantidad:item.cantidad, 
              series: item.series, 
              status: false};//devolver el id y el estado
          })
        } else {//si no es seriado es ferreteria 
          return await SalidaFerreteria(item, almacen_salida, almacen_entrada ).then((respuesta) => {
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
              service: `Error ejecutando la funcion SalidaFerreteria - ${item.material}`
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
  });
}