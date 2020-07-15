import Movimiento from "../../models/Movimiento";
import logger from "../logger";

export default async function GuardarMovimiento(tipo:string, almacen: string, material: string, cantidad: number):Promise<Boolean> {

  const nuevoMovimiento = new Movimiento({
    tipo, almacen, material, cantidad
  })

  return await nuevoMovimiento.save().then(() => true).catch(error => {
    logger.error({
      message: error.message,
      service: `GuardarMovimiento - ${tipo} - ${almacen} - ${material} - ${cantidad}`
    });
    return false;
  })

}