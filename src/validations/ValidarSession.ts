import Session from '../models/Session';
import logger from '../lib/logger';

export default async function sessionActiva(email:string) {
  let estado: Boolean = false;
  let id: string = '' ;
  const sessionUsuario = new Session({ email });
  //buscar sesion
  await Session.findOne({ email }).then(async (session:any) => {
    //si existe devolver verdadero
    if (session) {
      estado = true
      return {estado, id};
    } else {
      //si no existe guardarlo
      await sessionUsuario.save().then((e:any) => {
        estado = false;
        id = e._id;
        return {estado, id};
      }).catch((error:any) => {
        logger.error('Error guardando la sesión.')
        logger.error(error.message);
      })
    }
  }).catch((error:any) => {
    logger.error('Error buscando session.');
    logger.error(error.message)
  })
  return {estado, id};
};
