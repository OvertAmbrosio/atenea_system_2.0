import { Request, Response } from 'express';

import Empleado from '../models/Empleado';
import Session from '../models/Session';
import { ValidarAcceso, ValidarRegistro , ValidarSession } from '../validations';
import createToken from '../lib/crearToken';
import decifrarToken from '../lib/decifrarToken';
import reiniciarPassword from '../lib/reiniciarPassword';
import logger from '../lib/logger';

export const acceder = async (req: Request, res: Response): Promise<Response> => {
  
  const { errors, isValid, usuarioObjeto } = await ValidarAcceso(req.body);
  // Comprobar validaciones
  if (!isValid) return res.status(400).json(errors);

  if (usuarioObjeto) {
    const {estado, id} = await ValidarSession(req.body.email);
    if (estado) {
      logger.error(usuarioObjeto.usuario.email + ' - Inicio de sesión fallido.');
      return res.status(400).json({ title: 'Ya hay una sesión activa.', status: 'warning' });
    } else {
      const idSesion: string = id;
      const token: string = createToken(usuarioObjeto, idSesion);
      return res.status(201)
         .json({
            token: token,
            title: 'Acceso correcto.', 
            status: 'success',
          })
    }
  } else {
    logger.log({
      level:'error',
      message: 'Error obteniendo el usuario',
      service: 'Login'
    })
    return res.status(401).json({title: 'Error en el servidor', status: 'error'})
  }
};

export const session = async (req: Request, res: Response): Promise<Response> => {
  const token = req.headers.authorization || '';
  let respuesta = {title: '', status:'error', sesion: false};
  if (token?.length > 20) {
    const {usuarioDecoded} = decifrarToken(token);
    await Session.findOne({_id : usuarioDecoded.idSesion})
      .then((s) => {
        if (s) {
          respuesta = {title: 'Si hay sesión', status: 'success', sesion: true};
        } else {
          respuesta = {title: 'No hay sesión', status: 'error', sesion: false};
        }
    }).catch((error) => {
        logger.error({message: 'Error verificando la sesion - ' + error.message + '-' + error.code});
        respuesta = {title: error.message, status: 'warning', sesion: false};
    });
  };

  return res.send(respuesta)
};

export const cerrarSesion = async (req: Request, res: Response): Promise<Response> => {
  
  const token = req.headers.authorization;
  let respuesta = {title: '', status:''};
  if (token) {
    try {
      const {usuarioDecoded} = decifrarToken(token);
      await Session.deleteOne({ _id: usuarioDecoded.idSesion})
        .then((s) => {
          respuesta = ({title: 'Sesion cerrada correctamente', status: 'success'})
      }).catch((error) => {
          logger.error({message: 'Error cerrando sesión - ' + error.message});
          respuesta = ({title: error.message , status: 'error'})
      })
    } catch (error) {
      logger.error({message: 'Error cerrando sesión - ' + error.message});
      respuesta = ({title: error.message , status: 'error'})
    }
  } 

  return res.send(respuesta)
  
};

export const configuraciones = async (req: Request, res: Response): Promise<Response> => {
  let respuesta = {title: 'Error en el servidor', status:'error'};
  const todos = [1,2,3];
  const superior = [1,2];
  try {
    const {id, email} =  req.body
    const { usuario } = decifrarToken(req.headers.authorization);
    if (req.headers.metodo === 'reiniciarPassword') {
      if (todos.includes(usuario.tipo)) {
        const response = await reiniciarPassword(id);
        if (response) {
          respuesta = {title: 'Contraseña modificada correctamente.', status: 'success'}
        } else {
          respuesta.title= 'Error modificando la contraseña.';
        }
      } else {
        respuesta.title = 'No tienes permisos suficientes.'
      }
    } else if (req.headers.metodo === 'cerrarSesion') {
      if (superior.includes(usuario.tipo)) {
        await Session.findOneAndDelete({email: email})
        .then(() => respuesta = {title: 'Sesión cerrada correctamente.', status: 'success'})
        .catch((error) => {
          respuesta.title = 'Error cerrando sesión.'
          logger.error(error.message + ' - Error configuraciones (cerrar sesión)')
        })
      } else {
        respuesta.title = 'No tienes permisos suficientes.'
      }
    } else if (req.headers.metodo === 'desactivarCuenta') {
      if (superior.includes(usuario.tipo)) {
        await Empleado.findByIdAndUpdate({_id: id}, { $set: { 'usuario.estado': false }})
        .then(() => respuesta = {title: 'Usuario desactivado.', status: 'warning'})
        .catch((error) => {
          respuesta.title = 'Error modificando el usuario';
          logger.error({message: error.message, service: 'Modificando usuario en configuraciones'})
        })
      } else {
        respuesta.title = 'No tienes permisos suficientes.'
      }
    } else if (req.headers.metodo === 'actualizarPermisos') {
      const {id, permiso} = req.body.id
      if (superior.includes(usuario.tipo) && permiso !== 1) {
        await Empleado.findByIdAndUpdate({_id: id}, { $set: { 'usuario.tipo': permiso }})
        .then(() => respuesta = {title: 'Usuario actualizado.', status: 'success'})
        .catch((error) => {
          respuesta.title = 'Error modificando el usuario';
          logger.error({message: error.message, service: 'Modificando usuario en configuraciones(actualizar permisos)'})
        })
      } else {
        respuesta.title = 'No tienes permisos suficientes.'
      }
    } else {
      respuesta.title= 'Ningun metodo seleccionado.';
    }
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message,
      service: 'Configuraciones de usuarios'
    })
    return res.send(respuesta)
  };

  return res.send(respuesta)
}

