import { Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import Empleado, { IEmpleado } from '../models/Empleado';

import { ValidarRegistro } from '../validations';
import logger from '../lib/logger';
import Almacen from '../models/Almacen';
import { getDataRedis, setDataRedis, delDataRedis } from '../services/clienteRedis';
import { keys } from '../services/keys';

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
      await Empleado.find({"usuario.tipo": { $gt: tipoUsuario}, "contrata": nivelUsuario.contrata._id}).select('usuario nombre apellidos').sort({"usuario.tipo": -1})
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
    await Empleado.findById({_id: nivelUsuario._id}).populate('contrata')
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
      }).sort({'usuario.tipo' : 'descending', 'contrata': 'descending'
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
          "contrata": nivelUsuario.contrata._id
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
    await getDataRedis(keys.tecnicos).then(async(data) => {
      if (data) {
        return res.send(data);
      } else {
        await Empleado.find({contrata: nivelUsuario.contrata._id,'usuario.tipo': 9, 'estado_empresa.activo': true})
          .select({
            nombre: 1, apellidos: 1
        }).sort({
          apellidos: 1
        }).then((empleados) => {
            setDataRedis(keys.tecnicosGlobal, empleados);
            return res.status(201).json(empleados);
        }).catch((error) => {
            logger.error({
              message: error.message,
              service: 'Listar técnicos de la contrata.'
            })
            return res.status(400).send('Error obteniendo la lista de tecnicos');
        })
      }
    }).catch(error => {
      logger.error({
        message: error.message,
        service: 'listarTecnicos(redis)'
      });
      return res.status(401).send([])
    })
  } else if (req.headers.metodo === 'listarTecnicosGlobal') {
    await getDataRedis(keys.tecnicosGlobal).then(async(data) => {
      if (data) {
        return res.send(data);
      } else {
        await Empleado.find({'usuario.tipo': 9, 'estado_empresa.activo': true
        }).populate({path: 'contrata', select: 'nombre'
        }).select({ nombre: 1, apellidos: 1, contrata: 1
        }).sort({'contrata.apellidos': 1}).then((tecnicos) => {
          let contratas = [] as Array<string>;
          let contratasID = [] as Array<string>;
          let dataTecnicos = [] as Array<any>;
          if (tecnicos.length > 0) {
            //llenar la lista de contratas
            tecnicos.forEach((tecnico:any) => {
              if (!contratas.includes(tecnico.contrata.nombre)) {
                contratas.push(tecnico.contrata.nombre);
                contratasID.push(tecnico.contrata._id);
              }
            });
            //recorrer contratas para llenar el children
            contratas.forEach((contrata, index) => {
              dataTecnicos.push({
                value: contratasID[index],
                label: contratas[index],
                children: (tecnicos.filter((tecnico:any) => tecnico.contrata.nombre === contrata)).map(tecnico => {
                  return {
                    value: tecnico._id,
                    label: tecnico.nombre + ' ' + tecnico.apellidos
                  };
                })
              })
            })
          };
          setDataRedis(keys.tecnicosGlobal, dataTecnicos);
          return res.send(dataTecnicos);
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'listarTecnicosGlobal'
          })
          return res.send([])
        })
      }
    }).catch(error => {
      logger.error({
        message: error.message,
        service: 'listarTecnicosGlobal(redis)'
      });
      return res.status(401).send([])
    })
  } else if (req.headers.metodo === 'obtenerPerfil') {
    await Empleado.findById({_id: nivelUsuario._id}).select({
      nombre:1,
      apellidos:1, 
      documento_identidad:1,
      fecha_nacimiento:1,
      nacionalidad:1,
      observacion: 1
    }).then((usuario) => {
      res.send({
        usuario,
        status: 'success',
      })
    }).catch((error) => {
      res.send({
        title: error.message,
        status: 'danger'
      })
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
          //borrar datos de redis
          delDataRedis(keys.tecnicosGlobal);
          delDataRedis(keys.tecnicos);
          //enviar respuesta
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
  } else {
    return res.send(respuesta);
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
      status = 200;
      const {
        nombre, apellidos, email, contrata_nombre, tipo_documento, numero_documento,area , carnet, nacionalidad, observacion
      } = req.body.row;
      if (Number(tipoUser) < 5) {
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
        }).then(async() => {
          await Almacen.findOneAndUpdate({tecnico: req.body.key}, {contrata: contrata_nombre}).catch(error => logger.error({
            message: error.message,
            service: 'actualizarEmpleado(almacen)'
          }))
          logger.log({
            level: 'info',
            message: `Empleado ${email} actualizado por ${nivelUsuario.usuario.email}`,
            service: 'Actualizar Empleado'
          })
          //borrar datos de redis
          delDataRedis(keys.tecnicosGlobal);
          delDataRedis(keys.tecnicos);
          //enviar respuesta
          respuesta = {title: 'Empleado actualizado correctamente.', status: 'success'}
        }).catch((error:any) => {
          logger.error({
            message: error.message,
            service: 'Actualizar Empleado'
          });
          respuesta = {title: 'Error actualizando el empleado.', status: 'error'}
        })
      } else if(Number(tipoUser) === 6){
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
        status = 200
      }
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'actualizarEmpleado(try/catch)'
      })
      return res.send(respuesta);
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
    var objForUpdate = {} as any;

    if(req.body.nombre) objForUpdate.nombre = req.body.nombre;
    if(req.body.apellidos) objForUpdate.apellidos = req.body.apellidos;
    if(req.body.email) objForUpdate['usuario.email'] = req.body.email;
    if(req.body.fecha_nacimiento) objForUpdate.fecha_nacimiento = req.body.fecha_nacimiento;
    if(req.body.carnet) objForUpdate.carnet = req.body.carnet;
    if(req.body.documento_identidad) objForUpdate.documento_identidad = req.body.documento_identidad;
    if(req.body.nacionalidad) objForUpdate.nacionalidad = req.body.nacionalidad;
    if(req.body.imagen_perfil) objForUpdate['usuario.imagen_perfil'] = req.body.imagen_perfil;

    await Empleado.findByIdAndUpdate({_id: nivelUsuario._id}, { $set: objForUpdate}).then(() => {
        status = 201;
        if (req.body.nombre) {
          //borrar datos de redis
          delDataRedis(keys.tecnicosGlobal);
          delDataRedis(keys.tecnicos);
          //enviar respuesta
        }
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