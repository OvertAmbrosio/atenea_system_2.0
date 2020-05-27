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
export default async function EntradaFerreteria(entrada:IMaterialData, almacen: string): Promise<boolean> {
  //retorna la promesa comprobando si existe el material en el almacen
  return await Almacen.findOne({
    _id: almacen, 
    ferreteria: { 
      $elemMatch: {material: entrada.material}
    }
  }).then(async(data) => {
    if (!data) {//si no existe usar $push para incluirlo en la coleccion del almacen central
      //crear el objeto a guardar
      const entradaFerreteria = {//como es entrada al AlmcnCentral entonces todas son contables.
        material: entrada.material, 
        contable: entrada.cantidad, 
        entrada: 0,
        salida: 0
      };
      //actualizar el almacen con el objeto nuevo incluido
      return await Almacen.findByIdAndUpdate({
        _id: almacen }, { $push: { ferreteria: entradaFerreteria } 
      }).then(() => Promise.resolve(true)).catch((error) => {
        logger.error({
          message: error.message,
          service: `Error agregando material al almacen - ${entrada.material}`
        });
        return Promise.resolve(false)
      })
    } else {//si el material si existe del almacen, actualizar la ferreteria
      return await Almacen.updateOne({
          _id: almacen, 'ferreteria.material': entrada.material
        }, { 
          $inc: { 'ferreteria.$.contable': entrada.cantidad }
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
      service: `Error buscando el almacen (EntradaFerreteria) - ${entrada.material}`
    });
    return Promise.resolve(false);
  })
};
