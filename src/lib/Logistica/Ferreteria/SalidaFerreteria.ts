import Almacen from '../../../models/Almacen';
import logger from '../../logger';

interface IMaterialData {
  material: string,//objeto id
  nombre: string,
  cantidad: number, 
  seriado: boolean,
  series: Array<string>
}
//Funcion que actualiza el almacen de ferreteria
//retorna true para las operaciones correctas y false para los errores 
export default async function SalidaFerreteria(entrada:IMaterialData, almacen_salida: string, almacen_entrada: string): Promise<boolean> {
  //funcion que disminuye el stock del almacen central
  let AlmacenSalida = await Almacen.updateOne({
    _id: almacen_salida, 'ferreteria.material': entrada.material
  }, {
    $inc: { 
      'ferreteria.$.contable': -Number(entrada.cantidad), 
      'ferreteria.$.salida': Number(entrada.cantidad) 
    } 
  }).then(() => true).catch((error) => {
    logger.error({
      message: error.message,
      service: `IMC Update - ${entrada.nombre} - ${entrada.cantidad}`
    })
    return false;
  });
  //funcion que comprueba si existe el material en el almacen de entrada y lo actualiza
  let AlmacenEntrada = await Almacen.findOne({
    _id: almacen_entrada, 
    ferreteria: { 
      $elemMatch: {material: entrada.material}
    }
  }).then(async(data) => {
    if (!data) {//si no existe usar $push para incluirlo en la coleccion del almacen central
      //crear el objeto a guardar
      const entradaFerreteria = {//como es entrada al AlmacenPrimario entonces todas son entrada.
        material: entrada.material, 
        contable: 0, 
        entrada: entrada.cantidad,
        salida: 0
      };
      //actualizar el almacen con el objeto nuevo incluido
      return await Almacen.findByIdAndUpdate({
        _id: almacen_entrada }, { $push: { ferreteria: entradaFerreteria } 
      }).then(() => Promise.resolve(true)).catch((error) => {
        logger.error({
          message: error.message,
          service: `Error agregando material al almacen - ${entrada.material}`
        });
        return Promise.resolve(false)
      })
    } else {//si el material si existe del almacen, actualizar la ferreteria de la contrata/tecnico
      return await Almacen.updateOne({
          _id: almacen_entrada, 'ferreteria.material': entrada.material
        }, { 
          $inc: { 'ferreteria.$.entrada': entrada.cantidad }
      }).then(() => Promise.resolve(true)).catch((error) => {
        logger.error({
          message: error.message,
          service: `Error actualizando material al almacen - ${entrada.material}`
        });
        return Promise.resolve(false)
      })
    }
  }).catch((error) => {
    logger.error({
      message: error.message,
      service: `Error buscando el almacen (SalidaFerreteria) - ${entrada.material}`
    });
    return Promise.resolve(false);
  })
                          
  //retorna la promesa comprobando si existe el material en el almacen de salida
  return await Promise.all([AlmacenSalida, AlmacenEntrada]).then((respuesta) => {
    const error = respuesta.filter((i) => i === false);
    if (error.length !== 0) {
      return Promise.resolve(false);
    } else {
      return Promise.resolve(true);
    }
  }).catch(() => {
    return Promise.reject(false);
  })
};