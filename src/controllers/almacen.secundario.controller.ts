import { Request, Response } from 'express';

import { IEmpleado } from '../models/Empleado';
import Almacen from '../models/Almacen';
import Equipo from '../models/Equipo';
import logger from '../lib/logger';

const nivelAdmin = [1,3,5];
const nivelLogistica = [1,3,5,6,8];

export const listarAlmacen = async (req: Request, res: Response):Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;
  const metodo = req.headers.metodo;

  let respuesta = { title: 'Acceso denegado.', status: 'error', dato: '', data: {}};

  if (metodo === 'comprobarTecnico') {
    if (nivelAdmin.includes(nivelUsuario)) {
      try {
        const tecnico = String(req.headers.idtecnico);
        await Almacen.findOne({tecnico: tecnico}).then(async(data) => {
          if (data) {
            respuesta = {
              title: 'Busqueda correcta.',
              status: 'success',
              dato: data._id,
              data: {}
            };
          } else {
            const nuevoAlmacen = new Almacen({
              tipo: 'IMS',
              tecnico: tecnico
            });
            await nuevoAlmacen.save().then((data) => {
              respuesta = {
                title: 'Busqueda correcta.',
                status: 'success',
                dato: data._id,
                data: {}
              };
            }).catch((error) => {
              respuesta.title = 'Error creando el almacen.';
              logger.error({
                message: error.message,
                service: 'Crear nuevo almacen.'
              });
            })
          }
        }).catch((error) => {
          respuesta.title = 'Error buscando el almacen.';
          logger.error({
            message: error.message,
            service: 'Buscar almacen.'
          });
        })
      } catch (error) {
        respuesta.title = 'Error obteniendo datos del cliente.';
        logger.error({
          message: error.message,
          service: 'Buscar almacen (try/catch).'
        });
      }
    }
  } 

  return res.send(respuesta);
}