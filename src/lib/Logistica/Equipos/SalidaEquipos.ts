import Equipo from '../../../models/Equipo';
import logger from '../../logger';

interface IMaterialData {
  material: string,//objeto id
  nombre: string,
  cantidad: number, 
  seriado: boolean,
  series: Array<string>
};
//Al ser salidas todas las series ya deben existir
export default async function SalidaEquipos(entrada:IMaterialData, almacen_salida: string, almacen_entrada: string): Promise<boolean> {
  return new Promise(async(resolve, reject) => {
    await Equipo.updateMany({_id: { $in: entrada.series}}, {
      estado: 'traslado',
      almacen_salida: almacen_salida,
      almacen_entrada: almacen_entrada
    }).then(() => resolve(true)).catch((error) => {
      console.log(error);
      logger.error({
        message: error.message,
        service: 'EntradaEquipo (findByIdAndUpdate)'
      });
      reject(false);
    })
  })
}