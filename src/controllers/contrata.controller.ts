import { Request, Response } from 'express';
import { IEmpleado } from '../models/Empleado';
import Contrata from '../models/Contrata';
import logger from '../lib/logger';

export const listarContratas = async (req: Request, res: Response ) => {
  const nivelUsuario: IEmpleado|any = req.user
  if (req.headers.metodo === 'todoContratas') {
    if (nivelUsuario.usuario.tipo <= 3) {
      await Contrata.find().sort('nombre')
        .then((contratas) => {
          return res.status(201).send(contratas)
      }).catch((error) => {
          logger.log({
            level: 'error',
            message: error.message,
            service: 'Error buscando contratas'
          });
          return res.status(404).send({title: 'Error buscando las contratas.', message: error.message});
      })
    } else {
      return res.status(404).send([])
    }
  } else if (req.headers.metodo === 'listaContratas') {
    await Contrata.find().sort('nombre').select({nombre: 1, _id: 0})
        .then((contratas) => {
          return res.status(201).send(contratas)
      }).catch((error) => {
          logger.log({
            level: 'error',
            message: error.message,
            service: 'Error buscando contratas'
          });
          return res.status(404).send({title: 'Error buscando las contratas.', message: error.message});
      })
  } else {
    return res.send('¿Estás Perdido?')
  }
  
}

export const crearContrata = async (req: Request, res: Response) => {
  const nivelUsuario: IEmpleado|any = req.user
  if (req.headers.metodo === 'crearContrata') {
    try {
      if(req.body.nombre === '') return res.send({title: 'Se necesita el nombre de la contrata.', status: 'error'});
      const nuevaContrata = new Contrata(req.body);
      await nuevaContrata.save()
        .then(() => {
          logger.log({level: 'info', message: 'Creó nueva contrata - ' + nivelUsuario.usuario.email})
          return res.send({title: 'Contrata creada correctamente.', status: 'success'});
      }).catch((error) => {
          logger.log({
            level: 'error',
            message: error.message,
            service: 'Error creando contrata (consulta)'
          });
          return res.send({title: 'Error creando contrata.', status: 'error'});
      })
    } catch (error) {
      logger.log({
        level: 'error',
        message: error.message,
        service: 'Error creando contrata (try/catch)'
      });
      return res.send({title: 'Error en el servidor.', status: 'error'});
    }
  }
}

export const actualizarContrata = async (req: Request, res: Response) => {
  const nivelUsuario: IEmpleado|any = req.user;
  if (req.headers.metodo === 'actualizarContrata') {
    try {
      if(req.body.nombre === '') return res.send({title: 'Se necesita el nombre de la contrata.', status: 'error'});
      const { id, nombre, ruc, descripcion, fecha_incorporacion } = req.body
      await Contrata.findByIdAndUpdate({_id: id} , {
          nombre, ruc, descripcion, fecha_incorporacion
        }).then(() => {
          logger.log({level: 'info', message: 'Contrata actualizada - ' + id + ' - '+ nivelUsuario.usuario.email})
          return res.send({title: 'Contrata actualizada correctamente.', status: 'success'});
        }).catch((error) => {
          logger.log({
            level: 'error',
            message: error.message,
            service: 'Error actualizando contrata (consulta)'
          });
          return res.send({title: 'Error actualizando contrata.', status: 'error'});
      });
    } catch (error) {
      logger.log({
        level: 'error',
        message: error.message,
        service: 'Error actualizando contrata (try/catch)'
      });
      return res.send({title: 'Error en el servidor.', status: 'error'});
    }
  }
}

export const borrarContrata = async (req: Request, res: Response) => {
  const nivelUsuario: IEmpleado|any = req.user;
  if (req.headers.metodo === 'borrarContrata') {
    try {
      if(!req.body.id) return res.send({title: 'Se necesita el id de la contrata.', status: 'error'});
      const { id } = req.body;
      await Contrata.findByIdAndDelete({_id: id})
        .then(() => {
          logger.log({level: 'info', message: 'Contrata eliminada - ' + id + ' - '+ nivelUsuario.usuario.email})
          return res.send({title: 'Contrata eliminada correctamente.', status: 'success'});
      }).catch((error) => {
          logger.log({
            level: 'error',
            message: error.message,
            service: 'Error eliminando contrata (consulta)'
          });
          return res.send({title: 'Error eliminando contrata.', status: 'error'});
      });
    } catch (error) {
      logger.log({
        level: 'error',
        message: error.message,
        service: 'Error borrando contrata (try/catch)'
      });
      return res.send({title: 'Error en el servidor.', status: 'error'});
    }
  }
}