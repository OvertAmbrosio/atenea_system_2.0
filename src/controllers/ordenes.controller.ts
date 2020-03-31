import { Request, Response } from 'express';
import Orden, { IOrden } from '../models/Orden';
import { IEmpleado } from '../models/Empleado';

import logger from '../lib/logger';

const nivelAdmin = [1,2];

export const guardarOrden = async (req: Request, res: Response): Promise<Response> => {
  const nivelUsuario: IEmpleado|any = req.user;
  let status = 404;
  let respuesta = {title: 'Error en el servidor', status: 'error'};
  if (req.headers.metodo === 'guardarOrdenes') {
    if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
      try {
        const ordenes = req.body;
        const detalle_registro = {
          estado: 'PENDIENTE',
          usuario: nivelUsuario.usuario.email,
          observacion: 'Se sube la orden desde el panel administrativo.'
        }
        const nuevasOrdenes = ordenes.map((orden:any) => {
          orden.detalle_registro = detalle_registro;
          return orden;
        });
        await Orden.insertMany(nuevasOrdenes, {ordered:false})
          .then((resp:Array<any>|any) => {
            respuesta = {title: `${resp.length} Ordenes guardadas correctamente.`, status: 'success'};
            status = 200;
        }).catch((error) => {
            if (error.result.nInserted > 0) {
              respuesta.title = `${error.result.nInserted} Ordenes guardada(s) correctamente.`
              respuesta.status = 'success'
            } else if ((error.writeErrors).length > 0 && error.result.nInserted === 0) {
              respuesta.title = `${(error.writeErrors).length} Ordenes duplicadas y 0 Ordenes nuevas.`
              respuesta.status = 'warning'
              status = 400
            } else {
              respuesta.title = 'Error en el servidor.'
              respuesta.status = 'error'
              status = 404
              logger.error({
                message: error.message,
                service: 'Guardar Ordenes'
              })
            }
        });
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        status = 400;
        logger.error({
          message: error.message,
          service: 'Guardar Ordenes (try/catch)'
        })
      }
    } else {
      respuesta = {title: 'No tienes permisos suficientes.', status: 'error'};
    }
  } else {
    respuesta = {title: 'Metodo incorrecto.', status: 'error'};
  }

  return res.status(status).send(respuesta);
}

export const actualizarOrden = async (req: Request, res: Response): Promise<Response> => {
  const nivelUsuario: IEmpleado|any = req.user;
  let status = 404;
  let respuesta = {title: 'Error en el servidor', status: 'error'};

  if (req.headers.metodo === 'actualizarOrdenes') {
    if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
      try {
        const ordenes = req.body;
        let actualizadas = 0;
        let errores = 0;
        const detalle_registro = {
          estado: 'LIQUIDADA',
          usuario: nivelUsuario.usuario.email,
          observacion: 'Se actualiza la orden a liquidado desde el panel administrativo.'
        };
        await ordenes.map(async function (orden: IOrden | any) {
          await Orden.updateOne({
            codigo_requerimiento: orden.codigo_requerimiento, 
            'estado_sistema.estado': { $ne: 'LIQUIDADA'}
          }, {
            $set: {
              'estado_sistema.estado': orden.estado, 
              'estado_sistema.fecha_liquidada': orden.fecha_liquidada, 
              'estado_sistema.observacion': orden.observacion,
              'asignado': true, 
            },
            $push: { detalle_registro },
            new: true
          }).then((o) => {
            if(o.nModified !== 0) ++actualizadas
          }).catch((error) => {
            ++errores
            logger.error({
              message: error.message,
              servide: `Actualizar Ordenes (${orden.codigo_requerimiento})`
            })
          })
        })
        status = 200
        respuesta.title = `${actualizadas} Ordenes actualizadas y ${errores} errores`;
        if (errores !== 0) {
          respuesta.status = 'warning'
        } else {
          respuesta.status = 'success';
        }
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        status = 400;
        logger.error({
          message: error.message,
          service: 'Guardar Ordenes (try/catch)'
        })
      };

    } else {
      respuesta = {title: 'No tienes permisos suficientes.', status: 'error'};
    }
  } else {
    respuesta = {title: 'Metodo incorrecto.', status: 'error'};
  }

  return res.status(status).send(respuesta);
}