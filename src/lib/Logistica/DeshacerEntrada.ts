import { ILote } from '../../models/Albaran';
import Almacen from '../../models/Almacen';
import Equipo from '../../models/Equipo'

export default async function DeshacerEntrada(seriado: boolean, lote: ILote, almacen: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    if (seriado) {
      return await Equipo.deleteMany({_id: { $in: lote.series }
      }).then(() => {
        return resolve(true)
      }).catch((error) => {
        console.log(error);
        return reject(false);
      })
    } else {
      return await Almacen.updateOne({_id: almacen, 'ferreteria.material': lote.material._id},{ 
          $inc: { 'ferreteria.$.contable': -Number(lote.cantidad) }
      }).then(() => {
        return resolve(true)
      }).catch((error) => {
        console.log(error);
        return reject(false);
      })
    }
  })
}