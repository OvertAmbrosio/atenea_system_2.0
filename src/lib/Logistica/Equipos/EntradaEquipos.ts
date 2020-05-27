import Equipo from '../../../models/Equipo';
import logger from '../../logger';

interface IMaterialData {
  material: string,//objeto id
  nombre: string,
  cantidad: number, 
  seriado: boolean,
  series: Array<string>
};
//Al ser entradas todas las series son nuevas
export default async function EntradaEquipos(entrada:IMaterialData, almacen: string): Promise<boolean> {

  let nuevoEquipo:Array<any> = [];

  return Promise.all((entrada.series).map((item) => {
    let objeto = {
      _id: item,
      material: entrada.material,
      almacen_entrada: almacen
    };
    return nuevoEquipo.push(objeto);
  })).then(async() => {
    return await Equipo.insertMany(nuevoEquipo)
      .then(() => Promise.resolve(true))
      .catch((error) => {
        logger.error({
          message: error.message,
          service: 'Entrada de equipos (InsertMany)'
        })
        return Promise.resolve(false);
      })
  }).catch((error) => {
    logger.error({
      message: error.message,
      service: 'Entrada de equipos (Promise.all)'
    })
    return Promise.resolve(false);
  })
}