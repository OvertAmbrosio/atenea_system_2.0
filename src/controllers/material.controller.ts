import { Request, Response } from 'express';

import { IEmpleado } from '../models/Empleado';
import Material, { IMaterial } from '../models/Material';
import logger from '../lib/logger';
import { Error } from 'mongoose';

const nivelAdmin = [1,3];

export const listarMateriales = async (req: Request, res: Response): Promise<Response> => {

  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;

  let respuesta = {title: 'Acceso incorrecto.', status: 'error', data: [] as Array<IMaterial>}

  if (nivelAdmin.includes(nivelUsuario)) {
    await Material.find().sort({seriado:1, tipo: 1}).then((data) => {
      respuesta = {title: 'Busqueda Correcta.', status: 'success', data}
    }).catch((error:Error) => {
      logger.error({
        message: error.message,
        service: 'Error buscando materiales'
      });
      respuesta = {title: 'Error buscando materiales.', status: 'error', data: []}
    });
  } 

  return res.send(respuesta);

};

export const crearMaterial = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;

  let respuesta = {title: 'Acceso incorrecto.', status: 'error'};

  if (nivelAdmin.includes(nivelUsuario)) {
    try {
      const { nombre, tipo, medida, seriado } = req.body;
      const nuevoMaterial = new Material({nombre, tipo, medida, seriado})

      await nuevoMaterial.save().then(() => {
        respuesta = { title: 'Articulo creado correctamente.', status: 'success'};
      }).catch((error: Error) => {
        logger.error({
          message: error.message,
          servide: 'Crear Material.'
        });
        respuesta.title = 'Error creando nuevo material.';
      })
    } catch (error) {
      logger.error({
        message: error.message,
        servide: 'Crear Material.'
      });
      respuesta.title = 'Error obteniendo valores.';
    };
  };

  return res.send(respuesta);
};

export const editarMaterial = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;

  let respuesta = {title: 'Acceso incorrecto.', status: 'error'};

  if (nivelAdmin.includes(nivelUsuario)) {
    try {
      const { idArticulo, nombre, tipo, medida, seriado } = req.body;
      
      await Material.findByIdAndUpdate({_id: idArticulo}, {
        nombre, tipo, medida, seriado
      }).then(() => {
        respuesta = { title: 'Articulo actualizado correctamente.', status: 'success'};
      }).catch((error: Error) => {
        logger.error({
          message: error.message,
          service: 'Editar Material.'
        });
        respuesta.title = 'Error actualizando articulo.'
      })
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'Editar Material (try/catch).'
      });
      respuesta.title = 'Error obteniendo datos del articulo.'
    }
  }

  return res.send(respuesta);
};

export const eliminarMaterial = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;

  let respuesta = {title: 'Acceso incorrecto.', status: 'error'};

  if (nivelAdmin.includes(nivelUsuario)) {
    try {
      const id = req.headers.articulo;

      await Material.findByIdAndDelete({_id: id}).then(() => {
        respuesta = { title: 'Articulo eliminado correctamente.', status: 'success'};
      }).catch((error: Error) => {
        logger.error({
          message: error.message,
          service: 'Eliminar Material.'
        });
        respuesta.title = 'Error eliminando articulo.'
      })
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'Eliminar Material (try/catch).'
      });
      respuesta.title = 'Error obteniendo id del articulo.'
    }
  };

  return res.send(respuesta);
}