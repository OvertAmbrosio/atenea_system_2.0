import { Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import Empleado, { IEmpleado } from '../models/Empleado';

import { ValidarRegistro } from '../validations';
import logger from '../lib/logger';

const nivelJefes = [2,3,4];
const nivelAdministrativo = [1,2,3,4];

export const listarEmpleados = async (req: Request, res: Response ) => {
  const nivelUsuario: IEmpleado|any = req.user;
  const tipoUsuario: Number|any = nivelUsuario.usuario.tipo;
  if (req.headers.metodo === 'listarUsuarios') {
    if (tipoUsuario === 1) {
      await Empleado.find().select('usuario nombre apellidos').sort({"usuario.tipo": -1})
        .then((usuarios) => {
          return res.status(201).json(usuarios);
      }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'Lista usuarios'
          })
          return res.status(400).send('Error obteniendo la lista de usuario');
      })
    } else if (nivelJefes.includes(tipoUsuario)){
      await Empleado.find({"usuario.tipo": { $gt: tipoUsuario}}).select('usuario nombre apellidos').sort({"usuario.tipo": -1})
        .then((usuarios) => {
          return res.status(201).json(usuarios);
      }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'Lista usuarios'
          })
          return res.status(400).send('Error obteniendo la lista de usuario');
      })
    } else if (tipoUsuario === 6) {
      await Empleado.find({"usuario.tipo": { $gt: tipoUsuario}, "contrata.nombre": nivelUsuario.contrata.nombre}).select('usuario nombre apellidos').sort({"usuario.tipo": -1})
        .then((usuarios) => {
          return res.status(201).json(usuarios);
      }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'Lista usuarios'
          })
          return res.status(400).send('Error obteniendo la lista de usuario');
      })
    } else {
      return res.status(401).send("Usuario sin permisos");
    }
  } else if (req.headers.metodo === 'listarUsuario') {
    await Empleado.findById({_id: nivelUsuario._id})
      .then((usuario) => {
        return res.status(201).json(usuario);
      }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'Buscar Usuario para el perfil'
        })
        return res.status(400).send('Error obteniendo usuario');
      })
  } else if (req.headers.metodo === 'listarEmpleados'){
    if (nivelAdministrativo.includes(tipoUsuario)) {
      await Empleado.find({'usuario.tipo': {$gt: tipoUsuario === 1 ? 0 : tipoUsuario}
      }).populate({
        path: 'contrata',
        select: {nombre: 1}
      }).sort({'usuario.tipo' : 'descending'
      }).select({
          'usuario.password': 0, 
          'usuario.imagen_perfil': 0,
          'usuario.estado': 0,
          createdAt: 0,
      }).then((usuarios) => {
          let dataUsuarios = usuarios.map((usuario:any, i) => ({
            ...usuario._doc,
            email: usuario.usuario.email,
            tipo_documento: usuario.documento_identidad.tipo,
            numero_documento: usuario.documento_identidad.numero,
            contrata_nombre: usuario.contrata.nombre,
            contrata_id: usuario.contrata._id
          }));
          return res.status(201).json(dataUsuarios);
      }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'Lista empleados'
        })
        return res.status(400).send('Error obteniendo la lista de usuario');
      })
    } else if (tipoUsuario === 6){
      await Empleado.find({
          'usuario.tipo': {$gt: tipoUsuario}, 
          "contrata.nombre": nivelUsuario.contrata.nombre
        }).sort({'usuario.tipo' : 'descending'
        }).select({
            'usuario.password': 0, 
            'usuario.imagen_perfil': 0,
            'usuario.estado': 0,
            createdAt: 0,
        }).then((usuarios) => {
            let dataUsuarios = usuarios.map((usuario:any, i) => ({
              ...usuario._doc,
              email: usuario.usuario.email,
              tipo_documento: usuario.documento_identidad.tipo,
              numero_documento: usuario.documento_identidad.numero,
              contrata_nombre: usuario.contrata.nombre,
              contrata_id: usuario.contrata._id
            }));
            return res.status(201).json(dataUsuarios);
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'Lista empleados'
          })
          return res.status(400).send('Error obteniendo la lista de usuario');
        })
    } else {
      return res.status(401).send("Usuario sin permisos");
    }
  } else if (req.headers.metodo === 'listarTecnicos') {
    await Empleado.find({contrata: nivelUsuario.contrata._id,'usuario.tipo': 9, 'estado_empresa.activo': true})
      .select({
        nombre: 1, apellidos: 1
    }).sort({
      apellidos: 1
    }).then((empleados) => {
        return res.status(201).json(empleados);
    }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'Listar técnicos de la contrata.'
        })
        return res.status(400).send('Error obteniendo la lista de tecnicos');
    })
  } else {
    return res.send('¿Estás Perdido?')
  }
  
}

export const crearEmpleado = async (req: Request, res: Response): Promise<Response> => {
  let status = 0;
  let respuesta = {title: '', status: ''}

  if (req.headers.metodo === 'crearEmpleado') {
    const nivelUsuario: IEmpleado|any = req.user;

    if (nivelAdministrativo.includes(nivelUsuario.usuario.tipo)) {
      const { errors, isValid } = await ValidarRegistro(req.body);
      if (!isValid) return res.status(400).json(errors);

      const nuevoUsuario = new Empleado({
        usuario: {
          email: req.body.usuario.email,
          tipo: req.body.usuario.tipo,
          password: '12345678'
        },
        nombre: req.body.nombre,
        apellidos: req.body.apellidos,
        fecha_nacimiento: req.body.fecha_nacimiento,
        cargo: req.body.cargo,
        contrata: req.body.contrata,
        documento_identidad: req.body.documento_identidad,
        area: req.body.area,
        carnet: req.body.carnet,
        estado_empresa: req.body.estado_empresa,
        nacionalidad: req.body.nacionalidad,
        obervacion: req.body.observacion
      })      
      await nuevoUsuario.save()
        .then((u) => {
          respuesta = {title: `Usuario '${u.usuario.email} creado correctamente.`, status: 'success'};
          status = 201;
      }).catch((error) => {
          logger.log({
            level: 'error',
            message: error.message,
            service: 'Registro de usuario'
          });
          respuesta = {title: 'Error creando usuario.', status: 'error'}
          status = 401
      })
    } else {
      respuesta = {title: 'Usuario sin permisos', status: 'error'}
    }
  }

  return res.status(status).send(respuesta);
}

export const actualizarEmpleado = async (req: Request, res: Response): Promise<Response> => {
  let status = 404;
  let respuesta = {title: '', status: ''}
  const nivelUsuario: IEmpleado|any = req.user;
  const tipoUser: Number|any = nivelUsuario.usuario.tipo
  if (req.headers.metodo === 'actualizarEmpleado') {
    try {
      const {
        nombre, apellidos, email, contrata_nombre, tipo_documento, numero_documento,area , carnet, nacionalidad, observacion
      } = req.body.row;
      if (tipoUser < 5) {
        await Empleado.findByIdAndUpdate({_id: req.body.key}, {
          nombre,
          apellidos,
          'usuario.email': email,
          contrata: Types.ObjectId(contrata_nombre),
          documento_identidad: {
            tipo: tipo_documento,
            numero: numero_documento
          },
          area,
          carnet,
          nacionalidad,
          observacion
        }).then(() => {
          logger.log({
            level: 'info',
            message: `Empleado ${email} actualizado por ${nivelUsuario.usuario.email}`,
            service: 'Actualizar Empleado'
          })
          respuesta = {title: 'Empleado actualizado correctamente.', status: 'success'}
          status = 200
        }).catch((error:any) => {
          logger.error({
            message: error.message,
            service: 'Actualizar Empleado'
          });
          respuesta = {title: 'Error actualizando el empleado.', status: 'error'}
          status = 400
        })
      } else if(nivelUsuario.usuario.tipo === 6){
        await Empleado.findByIdAndUpdate({_id: req.body.key}, {
          nombre,
          apellidos,
          'usuario.email': email,
          documento_identidad: {
            tipo: tipo_documento,
            numero: numero_documento
          },
          area,
          carnet,
          nacionalidad,
          observacion
        }).then(() => {
          logger.log({
            level: 'info',
            message: `Empleado ${email} actualizado por ${nivelUsuario.usuario.email}`,
            service: 'Actualizar Empleado'
          })
          respuesta = {title: 'Empleado actualizado correctamente.', status: 'success'}
          status = 200
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'Actualizar Empleado'
          });
          respuesta = {title: 'Error actualizando el empleado.', status: 'error'}
          status = 400
        })
      } else {
        respuesta = {title: 'Usuario sin permisos', status: 'error'}
        status = 404
      }
    } catch (error) {
      console.log(error);
    }
  } else if(req.headers.metodo === 'actualizarFechas'){
    if (nivelUsuario.usuario.tipo < 5) {
      if (req.body.activo === true) {
        const {fecha_nacimiento, fecha_ingreso, activo} = req.body
        await Empleado.findByIdAndUpdate({_id: req.body.id}, {
          fecha_nacimiento,
          'estado_empresa.fecha_ingreso': fecha_ingreso,
          'estado_empresa.activo': activo,
          'estado_empresa.fecha_baja': null
        }, {new: true}).then((empleado) => {
          logger.log({
            level: 'info',
            message: `Empleado ${empleado?.usuario.email} actualizado por ${nivelUsuario.usuario.email}`,
            service: 'Actualizar Empleado'
          })
          respuesta = {title: 'Empleado actualizado correctamente.', status: 'success'}
          status = 200
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'Actualizar Empleado'
          });
          respuesta = {title: 'Error actualizando el empleado.', status: 'error'}
          status = 400
        })
      } else {
        const {fecha_nacimiento, fecha_ingreso, activo, fecha_baja} = req.body
        await Empleado.findByIdAndUpdate({_id: req.body.id}, {
          fecha_nacimiento,
          'estado_empresa.fecha_ingreso': fecha_ingreso,
          'estado_empresa.activo': activo,
          'estado_empresa.fecha_baja': fecha_baja,
          'usuario.estado': activo
        }, {new: true}).then((empleado) => {
          logger.log({
            level: 'info',
            message: `Empleado ${empleado?.usuario.email} actualizado por ${nivelUsuario.usuario.email}`,
            service: 'Actualizar Empleado'
          })
          respuesta = {title: 'Empleado actualizado correctamente.', status: 'success'}
          status = 200
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'Actualizar Empleado'
          });
          respuesta = {title: 'Error actualizando el empleado.', status: 'error'}
          status = 400
        })
      }
    } else {
      respuesta = {title: 'No tienes los permisos para realizar esa acción.', status: 'warning'}
      status = 200
    }    
  } else if(req.headers.metodo === 'editarPerfil'){
    const { 
      nombre, apellidos, email, fecha_nacimiento, carnet, documento_identidad, nacionalidad, imagen_perfil
    } = req.body;
    await Empleado.findByIdAndUpdate({_id: nivelUsuario._id}, {
        $set: {
          nombre, apellidos,
          'usuario.email': email,
          fecha_nacimiento, carnet, documento_identidad, nacionalidad,
          'usuario.imagen_perfil': imagen_perfil
        }
      }).then(() => {
        status = 201
        respuesta = {title: 'Usuario actualizado correctamente.', status: 'success'}
      }).catch((error) => {
        logger.error({message: error.message, service: 'Editando perfil.'});
        respuesta = {title: 'Error actualizando el usuario.', status: 'error'};
      })
  } else {
    respuesta = {title: 'Metodo incorrecto', status: 'error'}
    status = 404
  }

  return res.status(status).send(respuesta);
}

export const cambiarPassword = async (req: Request, res: Response): Promise<Response> => {
  let status = 404;
  let respuesta = {title: 'Error en el servidor.', status: 'error'}
  const nivelUsuario: IEmpleado|any = req.user;
  if (req.headers.metodo === 'cambiarPassword') {
    try {
      const { password_actual, password_new, password_new2} = req.body
      const match = await nivelUsuario.comparePassword(password_actual);
      if (match) {
        if (password_new !== password_new2) {
          status = 301;
          respuesta.title = 'Las contraseñas no coinciden.';
        } else {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password_new, salt);
          let newPassword = hash;
          await Empleado.findByIdAndUpdate({_id: nivelUsuario._id}, {$set: {'usuario.password': newPassword }})
            .then(() => {
              status = 200
              respuesta = {title: 'Contraseña cambiada correctamente.', status: 'success'};
            }).catch((error) => {
              respuesta.title = 'Error actualizando contraseña.'
              logger.error({
                message: error.message,
                service: 'Cambiar Contraseña (findById)'
              });
            })
        }
      } else {
        status = 301
        respuesta.title = 'Contraseña incorrecta.'
      }
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'Cambiar Contraseña (try/catch)'
      });
    }
  }
  
  return res.status(status).send(respuesta)
}