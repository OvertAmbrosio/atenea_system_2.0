import { Request, Response } from 'express';
import moment from 'moment';
import Orden, { IOrden } from '../models/Orden';
import { IEmpleado } from '../models/Empleado';
import Registro from '../models/Registro';
import EquipoBaja from '../models/EquipoBaja';
import Armario, { IArmario } from '../models/Armario';

import obtenerFecha from '../lib/obtenerFecha'
import logger from '../lib/logger';
import obtenerFiltros from '../lib/obtenerFiltros';
import subirImagenes from '../lib/subirImagenes';
import { Error, Types } from 'mongoose';
import LiquidarFerreteria from '../lib/Logistica/Ferreteria/LiquidarFerreteria';
import LiquidarEquipo from '../lib/Logistica/Equipos/LiquidarEquipo';
import ValidarOrden from '../validations/ValidarOrden';

const nivelAdmin = [1,2,4];
const nivelOperativo = [1,2,4,6,7];
const tecAsignado = ['pendiente','agendada','iniciada'];
//nivel 1 es administrador -> todo
//nivel 2 es Jefe de Operaciones -> Todo Operaciones / usuario
//nivel 4 es Lider de Gestión -> Todo Operaciones / parte de usuario
//nivel 6 es jefe de contrata/ (encargado de la logistica en la contrata)
//nivel 7 es gestor
//Nivel 9 es técnico

export const listarOrden = async (req: Request, res: Response): Promise<Response> => {
  const nivelUsuario: IEmpleado|any = req.user;
  let status = 404;
  let respuesta = {title: 'Error en el servidor', status: 'error', ordenes: [] as Array<any>|any, filtros: {}};
  const fechas = obtenerFecha();
  if (req.headers.metodo === 'listarOrdenes') {
    if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
      try {
        const tipo: string|any = req.headers.tipo;      
        await Orden.find({
            tipo: tipo,
            $or: [
              {'estado_sistema.fecha_liquidada': {$gte: fechas.fechaHoraLocal} },
              {'estado_sistema.fecha_liquidada': null }
            ]
          }).populate({
            path: 'contrata_asignada.tecnico_asignado.material_usado.material_no_seriado.material',
          }).populate({
            path: 'contrata_asignada.tecnico_asignado.material_usado.material_seriado.material',
          }).populate({
            path: 'contrata_asignada.tecnico_asignado.material_usado.material_baja.material',
          }).populate('contrata_asignada.contrata').then(async(data: any) => {
            await obtenerFiltros(tipo, data)
              .then((filtros: Object|any) => {
                status = 200;
                respuesta = {
                  title: "Busqueda Correcta.",
                  status: 'success',
                  ordenes: data, 
                  filtros: filtros
                }
              });
          }).catch((error:Error) => {
            logger.error({
              message: error.message,
              service: 'Listar Ordenes'
            })
          })
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        status = 400;
        logger.error({
          message: error.message,
          service: 'Listar Ordenes (try/catch)'
        })
      }
    } else {
      respuesta.title = 'No tienes permisos suficientes.';
    }
  } else if (req.headers.metodo === 'listarOrdenesContrata') {
    if (nivelOperativo.includes(nivelUsuario.usuario.tipo)) {
      try {
        const tipo: string|any = req.headers.tipo;
        let query = {}
        if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
          query = {tipo: tipo,
            $or: [
              {'estado_sistema.fecha_liquidada': {$gte: fechas.fechaHoraLocal} },
              {'estado_sistema.fecha_liquidada': null }
            ]
          }
        } else {
          query = {tipo: tipo,
            'contrata_asignada.contrata': nivelUsuario.contrata._id, 
            $or: [
              {'estado_sistema.fecha_liquidada': {$gte: fechas.fechaHoraLocal} },
              {'estado_sistema.fecha_liquidada': null }
            ]
          }
        }
        await Orden.find(query).populate({
          path: 'contrata_asignada.tecnico_asignado.material_usado.material_no_seriado.material',
        }).populate({
          path: 'contrata_asignada.tecnico_asignado.material_usado.material_seriado.material',
        }).populate({
          path: 'contrata_asignada.tecnico_asignado.material_usado.material_baja.material',
        }).populate('contrata_asignada.contrata').then(async(data: any) => {
          await obtenerFiltros(tipo, data)
            .then((filtros: Object|any) => {
              status = 200;
              respuesta = {
                title: "Busqueda Correcta.",
                status: 'success',
                ordenes: data, 
                filtros: filtros
              }
            });
        }).catch((error:Error) => {
          logger.error({
            message: error.message,
            service: 'Listar Ordenes por contrata (metodo find)'
          })
        })
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        status = 400;
        logger.error({
          message: error.message,
          service: 'Listar Ordenes (try/catch)'
        })
      }
    } else {
      respuesta.title = 'No tienes permisos suficientes.';
    }
  } else if (req.headers.metodo === 'listarLiquidadas') {
    if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
      try {
        const tipo: string|any = req.headers.tipo;
        const fechaInicio: string|any = req.headers.fechainicio;
        const fechaFin: string|any = req.headers.fechafin;

        await Orden.find({
          tipo: tipo,
          'estado_sistema.fecha_liquidada':  {
            $gte: moment(fechaInicio).add(5, 'hours').format('YYYY-MM-DD hh:mm') , 
            $lt: moment(fechaFin).add(5, 'hours').format('YYYY-MM-DD hh:mm')
          }
        }).populate('contrata_asignada.contrata').then(async(data: any) => {
            status = 200;
            respuesta = {
              title: `Se encontraron ${data.length} ordenes.`,
              status: 'success',
              ordenes: data,
              filtros: {}
            }
        }).catch((error:any) => {
          logger.error({
            message: error.message,
            service: 'Listar Ordenes por contrata (try/catch)'
          })
        })
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        status = 400;
        logger.error({
          message: error.message,
          service: 'Listar Liquidadas (try/catch)'
        })
      }
    } else {
      respuesta.title = 'No tienes permisos suficientes.';
    }
  } else if (req.headers.metodo === 'listarOrden') {
    if (nivelOperativo.includes(nivelUsuario.usuario.tipo)) {
      try {
        const tipo:string|any = req.headers.tipo;
        const codigo: string|any = req.headers.codigo; 

        await Orden.find({
          tipo: tipo,
          $or: [
            {codigo_requerimiento: codigo },
            {telefono: codigo }
          ]
        }).populate('contrata_asignada.contrata').then((data: any) => {
            status = 200;
            respuesta = {
              title: `Se encontraron ${data.length} orden/es.`,
              status: 'success',
              ordenes: data, 
              filtros: []
            }
        }).catch((error:any) => {
            logger.error({
              message: error.message,
              service: 'Listar Ordene(metodo find)'
            })
        })
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        status = 400;
        logger.error({
          message: error.message,
          service: 'Listar Ordenes (try/catch)'
        })
      }
    } else {
      respuesta.title = 'No tienes permisos suficientes.';
    }
  } else if (req.headers.metodo === 'buscarOrden') {
    try {
      const codigo = String(req.headers.codigo);
      await Orden.findOne({codigo_requerimiento: codigo}).populate('contrata_asignada.contrata').select({
        tipo:1, codigo_requerimiento:1, fecha_registro:1, distrito:1, contrata_asignada:1
      }).then((data) => {
        status = 200;
        if (!data?.contrata_asignada?.contrata === nivelUsuario.contrata._id) {
          respuesta = {
            title: 'Esta orden no está asignada.',
            status: 'warning',
            ordenes: data,
            filtros: []
          };
        } else {
          respuesta = {
            title: 'Busqueda correcta.',
            status: 'success',
            ordenes: data,
            filtros: []
          };
        }
      }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'buscarOrden(metodo find)'
        })
      })
    } catch (error) {
      respuesta.title = 'Error obteniendo valores.';
      status = 200;
      logger.error({
        message: error.message,
        service: 'buscarOrden (try/catch)'
      })
    }
  } else if (req.headers.metodo === 'ordenesTecnico') {
    status = 200;
    await Orden.find({
      'contrata_asignada.tecnico_asignado.id': nivelUsuario._id,
      $or:[
        { 'contrata_asignada.tecnico_asignado.fecha_finalizado': null },
        { 'contrata_asignada.tecnico_asignado.fecha_finalizado': { $gte: fechas.fechaLocal }}
      ]
    }).populate('contrata_asignada.contrata').sort('contrata_asignada.tecnico_asignado.estado_orden').select({
      detalle_registro: 0,
      estado_sistema: 0,
      asignado: 0
    }).then((data) => {
      respuesta = {
        title: "Busqueda Correcta.",
        status: 'success',
        ordenes: data, 
        filtros: []
      }
    }).catch((error) => {
      respuesta = {
        title: error.message,
        status: 'error',
        ordenes: [], 
        filtros: []
      }
    })
  } else {
    respuesta.title = 'Metodo incorrecto.';
  }
  return res.status(status).send(respuesta);
}

export const ordenDetalle = async (req: Request, res: Response): Promise<Response> => {
  let respuesta = {title: 'Error en el servidor.', status: 'danger', dato: ''};
  const metodo = req.headers.metodo;
  if (metodo === 'obtenerDireccionSpeedy') {
    const mdf = String(req.headers.mdf);
    const armario = String(req.headers.armario);
    await Armario.findOne({mdf: mdf, codigo_armario: armario}).then((data) => {
      respuesta = {
        title: 'Busqueda correcta.',
        status: 'success',
        dato: data?.direccion ? data.direccion : '-'
      }
    }).catch((error) => {
      respuesta.title = error.message;
      logger.error({
        message: error.message,
        service: 'obtenerDireccionSpeedy(findOne)'
      })
    })
  }

  return res.send(respuesta);
}

export const guardarOrden = async (req: Request, res: Response): Promise<Response> => {
  const nivelUsuario: IEmpleado|any = req.user;
  let status = 404;
  let respuesta = {title: 'Error en el servidor', status: 'error'};
  if (req.headers.metodo === 'guardarOrdenes') {
    if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
      try {
        const ordenes = req.body;
        const detalle_registro = {
          codigo_subido: Date.now(),
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
  } else if (req.headers.metodo === 'guardarArmarios') {
    if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
      status = 200
      try {
        const armarios: IArmario[] = req.body;
        await Promise.all(armarios.map(async (armario) => {
          return await Armario.findOne({
            mdf: armario.mdf, 
            codigo_armario: armario.codigo_armario
          }).then(async (item) => {
            if (item) {
              return true;
            } else {
              const nuevoArmario = new Armario(armario);
              await nuevoArmario.save();
            }
          }).catch(error => {//error del findOne
            logger.error({
              message: error.message,
              service: 'guardarArmarios(findone)'
            });
          });
        })).then(() => respuesta = {title: 'Armarios guardados correctamente.', status: 'success'})
        .catch(() => {//error del Promise.All
          respuesta.title = 'Error guardando los armarios.'
        })
      } catch (error) {
        respuesta.title = error.message;
        logger.error({
          message: error.message,
          service: 'guardarArmarios(try/catch)'
        })
      }
    } else {
      status = 200;
      respuesta.title = 'No cuentas con los permisos necesarios.'
    }
  } else {
    respuesta = {title: 'Metodo incorrecto.', status: 'error'};
  }

  return res.status(status).send(respuesta);
}

export const actualizarOrden = async (req: Request, res: Response): Promise<Response> => {
  const nivelUsuario: IEmpleado|any = req.user;
  const metodo = req.headers.metodo;
  let status = 404;
  let respuesta = {title: 'Error en el servidor', status: 'error'};

  if (metodo === 'actualizarOrdenes') {
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
        await Promise.all(ordenes.map(async function (orden: IOrden | any) {
          return await Orden.updateOne({
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
              if(o.nModified !== 0) {
                ++actualizadas;
              }
              return o.nModified;
            }).catch((error) => {
              logger.error({
                message: error.message,
                servide: `Actualizar Ordenes (${orden.codigo_requerimiento})`
              })
              return ++errores
            })
          })
        ).then((a) => {
          status = 200
          respuesta.title = `${actualizadas} Ordenes actualizadas y ${errores} errores`;
          if (errores !== 0) {
            respuesta.status = 'warning'
          } else {
            respuesta.status = 'success';
          }
        }).catch((error) => {
          console.log(error);
        })
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        status = 400;
        logger.error({
          message: error.message,
          service: 'Actualizar Ordenes (try/catch)'
        })
      };
    } else {
      respuesta = {title: 'No tienes permisos suficientes.', status: 'error'};
    }
  } else if (metodo === 'actualizarContrata') {
    if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
      try {
        status= 200;
        const {ordenes, contrata} = req.body;
        const detalle_registro = {
          contrata: Types.ObjectId(contrata),
          usuario: nivelUsuario.usuario.email,
          estado: 'Pendiente',
          observacion: 'Se asigna la orden a la contrata desde el panel administrativo.'
        };
        await ValidarOrden(ordenes).then(async(validado) => {
          if (validado) {
            await Orden.updateMany({
              _id: { $in: ordenes }
            }, {
              $set: {
                'contrata_asignada.contrata': Types.ObjectId(contrata), 
                'contrata_asignada.tecnico_asignado.id': null,
                'contrata_asignada.tecnico_asignado.nombre_tecnico': 'Sin asignar.',
                'contrata_asignada.estado': 'Pendiente',
                'asignado': true}, 
              $push: { detalle_registro } 
            }).then(() => {
              respuesta = {title: 'Ordenes actualizadas correctamente.', status: 'success'};
            }).catch((error: Error) => {
              respuesta.title = 'Error actualizando ordenes.'
              logger.error({
                message: error.message,
                service: 'Error asignando las ordenes a la contrata.'
              })
            })
          } else {
            respuesta.title = 'Las ordenes seleccionadas necesitan ser aprobadas primero.'
            respuesta.status = 'info'
          }
        }).catch(() => respuesta = {title: 'Las ordenes seleccionadas necesitan ser aprobadas primero.', status: 'info'});
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        logger.error({
          message: error.message,
          service: 'Actualizar contrata por orden (try/catch)'
        })
      };
    } else {
      respuesta = {title: 'No tienes permisos suficientes.', status: 'error'};
    }
  } else if (metodo === 'actualizarEstado') {
    if (nivelOperativo.includes(nivelUsuario.usuario.tipo)) {
      try {
        status= 200;
        const {ordenes, estado, observacion } = req.body;
        //convertir el formdata(text) en array
        let arrayOrden = ordenes.split(",").map(String);
        const files: any = req.files;
        let estado_tecnico = 1;
        if (tecAsignado.includes(String(estado).toLowerCase())) {
          estado_tecnico = 1;
        } else {
          estado_tecnico = 3;
        }
        //funcion para subir imagenes a cloudinary, si no hay imagenes devolverá vacio
        await ValidarOrden(arrayOrden).then(async(validado) => {
          if (validado) {
            await subirImagenes(files)
              .then(async(imagenes) => {
                //asignar las imagenes al registro
                let detalle_registro = {
                  estado: estado,         
                  usuario: nivelUsuario.usuario.email,
                  contrata: nivelUsuario.contrata._id,
                  observacion: `${observacion} (actualizado a "${estado}")`,
                  imagenes: imagenes
                };
                //guardar los cambios en la base de datos
                await Orden.updateMany({
                  _id: { $in: arrayOrden}
                }, {
                  $set: {  
                    'contrata_asignada.estado' : estado, 
                    'contrata_asignada.observacion' :  observacion,
                    'contrata_asignada.tecnico_asignado.estado_orden': estado_tecnico
                  },
                  $push: { detalle_registro },
                }).then(() => {
                  if (ordenes.length > 1) {
                    status = 200;
                    respuesta = {title: 'Ordenes actualizadas correctamente.', status: 'success'};
                  } else {
                    status = 200;
                    respuesta = {title: 'Orden actualizada correctamente.', status: 'success'};
                  }
                }).catch((err:any) => {
                  logger.error({
                    message: err.message,
                    service: 'Actualizar estado de la orden'
                  });
                  respuesta.title = 'Error actualizando ordenes';
                })
              }).catch((error) => {
                logger.error({
                  message: error.message,
                  service: 'Actualizar estado de la orden (subiendo imagenes)'
                });
                respuesta.title = 'Error actualizando ordenes';
              })
          } else {
            respuesta = {title: 'Las ordenes seleccionadas necesitan ser aprobadas primero.', status: 'info'}
          }
        }).catch(() => respuesta = {title: 'Las ordenes seleccionadas necesitan ser aprobadas primero.', status: 'info'});
      } catch (error) {
        respuesta.title = error.message
        logger.error({
          message: error.message,
          service: 'actualizarEstado(try/catch)'
        })
      }
    } else {
      respuesta = {title: 'No tienes permisos suficientes.', status: 'error'};
    }
  } else if (metodo === 'actualizarTecnico') {
    if (nivelOperativo.includes(nivelUsuario.usuario.tipo)) {
      try {
        status = 200;
        const {ordenes, idTecnico, nombreTecnico } = req.body;
        const detalle_registro = {
          estado: 'Asignada',
          usuario: nivelUsuario.usuario.email,
          contrata: nivelUsuario.contrata._id,
          tecnico: nombreTecnico,
          observacion: `Se asigna la orden al técnico ${nombreTecnico}.`
        }
        await ValidarOrden(ordenes).then(async(validado) => {
          if (validado) {
            await Orden.updateMany({
              _id: { $in: ordenes}}, {
              $set: { 
                'contrata_asignada.tecnico_asignado.id': idTecnico, 
                'contrata_asignada.tecnico_asignado.nombre_tecnico': nombreTecnico, 
                'contrata_asignada.tecnico_asignado.estado_orden':  1,
                'contrata_asignada.tecnico_asignado.fecha_finalizado': null,
                'contrata_asignada.estado': 'Asignada',
                'asignado': true},
              $push: { detalle_registro} }, {
              new: true
            }).then((e:any) => {
              respuesta = {title: `Ordenes asignadas: ${e.nModified}.`, status: 'success'}
            }).catch((error:any) => {
              logger.error({
                message: error.message,
                service: 'Asignar técnico.'
              });
              respuesta.title = "Error actualizando las ordenes"
            })
          } else {
            respuesta = {title: 'Las ordenes seleccionadas necesitan ser aprobadas primero.', status: 'info'}
          }
        }).catch(() => respuesta = {title: 'Las ordenes seleccionadas necesitan ser aprobadas primero.', status: 'info'});
      } catch (error) {
        respuesta.title = error.message
      }
    } else {
      respuesta = {title: 'No tienes permisos suficientes.', status: 'error'};
    }
  } else if (metodo === 'actualizarTecnicoContrata') {
    try {
      status = 200;
      if (nivelAdmin.includes(nivelUsuario.usuario.tipo)) {
        const {ordenes, contrata, tecnico, nombre } = req.body;
        const detalle_registro = {
          estado: 'Asignada',
          usuario: nivelUsuario.usuario.email,
          contrata: contrata,
          tecnico: nombre,
          observacion: `Se asigna la orden al técnico ${nombre}.`
        };
        await ValidarOrden(ordenes).then(async(validado) => {
          if (validado) {
            await Orden.updateMany({
              _id: { $in: ordenes}}, {
              $set: { 
                'contrata_asignada.contrata': Types.ObjectId(contrata),
                'contrata_asignada.tecnico_asignado.id': tecnico, 
                'contrata_asignada.tecnico_asignado.nombre_tecnico': nombre, 
                'contrata_asignada.tecnico_asignado.estado_orden':  1,
                'contrata_asignada.tecnico_asignado.fecha_finalizado': null,
                'contrata_asignada.estado': 'Asignada',
                'asignado': true},
              $push: { detalle_registro} }, {
              new: true
            }).then((e:any) => {
              respuesta = {title: `Ordenes asignadas: ${e.nModified}.`, status: 'success'}
            }).catch((error:any) => {//error de actualizacion
              logger.error({
                message: error.message,
                service: 'Asignar técnico.'
              });
              respuesta.title = "Error actualizando las ordenes"
            })
          } else {
            respuesta = {title: 'Las ordenes seleccionadas necesitan ser aprobadas primero.', status: 'info'}
            logger.info({message: 'Ordenes pendientes de validacion.', service: 'actualizarTecnicoContrata(validar)'})
          }
        }).catch(() => respuesta = {title: 'Las ordenes seleccionadas necesitan ser aprobadas primero.', status: 'info'});
      } else {
        respuesta.title = 'No cuentas con permisos suficientes.'
      }
    } catch (error) {//error try catch
      respuesta.title = error.message;
      logger.error({
        message: error.message,
        service: 'actualizarTecnicoContrata(try/catch)'
      })
    };
  } else if (metodo === 'aprobarOrden') {
    if (nivelOperativo.includes(nivelUsuario.usuario.tipo)) {
      status = 200;
      try {
        const { codigo_requerimiento, contrata_asignada, aprobado } = req.body;
        if (aprobado) {
          let nuevoRegistro = new Registro({
            estado: 'aprobado',
            codigo_requerimiento,
            tecnico: contrata_asignada.tecnico_asignado.id,
            contrata: nivelUsuario.contrata._id,
            gestor: nivelUsuario._id,
            material_usado: contrata_asignada.tecnico_asignado.material_usado
          });
          let detalle_registro = {
            estado: 'Liquidada',         
            usuario: nivelUsuario.usuario.email,
            contrata: nivelUsuario.contrata._id,
            observacion: `${contrata_asignada.tecnico_asignado.observacion} - 
                          (aprobado por ${nivelUsuario.nombre + ' ' + nivelUsuario.apellidos})`,
            imagenes: contrata_asignada.tecnico_asignado.imagenes
          };
          await LiquidarEquipo(
            contrata_asignada.tecnico_asignado.material_usado.material_seriado, 
            contrata_asignada.tecnico_asignado.material_usado.almacen_actual,
            'aprobado');
          await LiquidarFerreteria(
            contrata_asignada.tecnico_asignado.material_usado.material_no_seriado, 
            contrata_asignada.tecnico_asignado.material_usado.almacen_actual, 
            'aprobado');
          if ((contrata_asignada.tecnico_asignado.material_usado.material_baja).length !== 0) {
            await Promise.all((contrata_asignada.tecnico_asignado.material_usado.material_baja).map(async(item:any) => {
              const nuevoEquipoBaja = new EquipoBaja({
                serie: item.serie,
                material: item.material,
                estado: 'traslado',
                orden: codigo_requerimiento,
                tecnico: contrata_asignada.tecnico_asignado.id,
                contrata: nivelUsuario.contrata._id,
                usuario_entrega: nivelUsuario._id,
                observacion_entrega: `Equipo de baja - ${item.serie}`
              });
              return await nuevoEquipoBaja.save().then(() => {
                logger.info({
                  message: `Nuevo equipo de baja - ${item.serie}`
                })
              }).catch((error:Error) => {
                logger.error({
                  message: error.message,
                  service: `Error guardando equipo de baja - ${item.serie}`
                });
              });
            }));
          };
          await Orden.findOneAndUpdate({codigo_requerimiento: codigo_requerimiento}, {
            $set: {  
              'contrata_asignada.estado': 'Liquidada',
              'contrata_asignada.tecnico_asignado.estado_orden': 3,
              'contrata_asignada.tecnico_asignado.fecha_finalizado': new Date(),
              'contrata_asignada.observacion': `${contrata_asignada.observacion} (Técnico)`
              },
            $push: { detalle_registro} 
          }).then(async() => {
            await nuevoRegistro.save().then(() => {
              respuesta = {
                title: 'Orden liquidada con exito.',
                status: 'success',
              }
            })
          }).catch((error) => {
            logger.error({
              error: error.message,
              service: 'aprobarOrden (findOneAndUpdate)'
            });
            respuesta.title = 'Error actualizando la orden'
          })
        } else {
          let detalle_registro = {
            estado: 'Orden Rechazada (tecnico)',         
            usuario: nivelUsuario.usuario.email,
            contrata: nivelUsuario.contrata._id,
            observacion: `Orden reachazada (liquidacion) por ${nivelUsuario.nombre + ' ' + nivelUsuario.apellidos}`,
            imagenes: contrata_asignada.tecnico_asignado.imagenes
          };
          await Orden.findOneAndUpdate({codigo_requerimiento: codigo_requerimiento}, {
            $set: {  
              'contrata_asignada.tecnico_asignado.estado_orden': 4,
              },
            $push: { detalle_registro } 
          }).then(async() => {
            await LiquidarEquipo(
              contrata_asignada.tecnico_asignado.material_usado.material_seriado, 
              contrata_asignada.tecnico_asignado.material_usado.almacen_actual,
              'rechazado');
            await LiquidarFerreteria(
              contrata_asignada.tecnico_asignado.material_usado.material_no_seriado, 
              contrata_asignada.tecnico_asignado.material_usado.almacen_actual, 
              'rechazado');
            respuesta = {
              title: 'Orden rechazada con exito.',
              status: 'success'
            }
          }).catch((error) => {
            logger.error({
              error: error.message,
              service: 'aprobarOrden (findOneAndUpdate)'
            });
            respuesta.title = 'Error actualizando la orden'
          })
        }
      } catch (error) {
        respuesta.title = "Error obteniendo datos del cliente.";
        logger.error({
          message: error.message,
          service: 'aprobarOrden try/catch)'
        })
      }
    }
  } else if (metodo === 'subirImagenReferencia') {
    status = 200;
    if (nivelOperativo.includes(nivelUsuario.usuario.tipo)) {
      try {
        const { ordenes } = req.body;
        const files: any = req.files;

        console.log(files);
        //funcion para subir la imagen
        // await subirImagenes([files])
      } catch (error) {
        respuesta.status = error.message;
        logger.error({
          message: error.message,
          service: 'subirImagenReferencia(try/catch)'
        })
      }
    } else {
      respuesta.title = 'No cuentas con permisos suficientes.'
    }
  } else {
    respuesta = {title: 'Metodo incorrecto.', status: 'error'};
  }
  return res.status(status).send(respuesta);
};

export const editarOrden = async (req: Request, res: Response): Promise<Response> => {
  const empleado: IEmpleado|any = req.user;
  const metodo = req.headers.metodo;
  let respuesta = {title: 'Error en el servidor', status: 'error'};

  if (metodo === 'liquidarOrdenTecnico') {
    try {
      const { almacen_actual, codigo_requerimiento, observacion } = req.body;
      const material_usado = JSON.parse(req.body.material_usado);
      if(material_usado.almacen_actual === null && almacen_actual !== null) material_usado.almacen_actual = almacen_actual;
      const files: any = req.files;

      var objForUpdate:{[key: string]: any} = {
        'contrata_asignada.tecnico_asignado.estado_orden': 2,
        'contrata_asignada.tecnico_asignado.observacion': observacion,
        'contrata_asignada.tecnico_asignado.material_usado': material_usado,
      };

      //subir las imagenes
      await subirImagenes(files)
      .then(async(imagenes) => {
        if(files.length > 0) objForUpdate['contrata_asignada.tecnico_asignado.imagenes'] = imagenes;
        await Orden.findOneAndUpdate({codigo_requerimiento}, objForUpdate
        ).then(async() => await LiquidarFerreteria(
          material_usado.material_no_seriado,
          almacen_actual,
          'pendiente')
        ).then(async() => await LiquidarEquipo(
          material_usado.material_seriado,
          almacen_actual,
          'pendiente')
        ).then(() => {
          respuesta = {
            title: 'Orden enviada correctamente.',
            status: 'success'
          }
        }).catch((error) => {//error de la consulta
          respuesta = {
            title: error.message,
            status: 'danger'
          };
          logger.error({
            message: error.message,
            service: 'liquidarOrdenTecnico(findOneAndUpdate)'
          })
        });
      }).catch((error) => {//error de cloudinary
        respuesta = {
          title: error.message,
          status: 'warning'
        };
        logger.error({
          message: error.message,
          service: 'liquidarOrdenTecnico(subirimagenes)'
        });
      })
    } catch (error) {//error del trycatch
      respuesta = {
        title: error.message,
        status: 'danger'
      }
    }    
  } else if (metodo === 'agregarReferencias') {
    if (nivelOperativo.includes(empleado.usuario.tipo)) {
      try {
        const ordenes = req.body;
        if (ordenes.length > 0) {
          await Promise.all(ordenes.map(async(nuevaOrden: IOrden|any) => {
            return await Orden.findOne({codigo_requerimiento: nuevaOrden.codigo_requerimiento}).then(async(item) => {
              let objectUpdate = {} as any;
              let variables =['-','',' ']
              if (item) {
                //validar que existan los datos en la base de datos, si no hay actualizar con la data.
                if (variables.includes(String(item.telefono))) objectUpdate['telefono'] = nuevaOrden.telefono;
                if (variables.includes(String(item.detalle_motivo))) objectUpdate['detalle_motivo'] = nuevaOrden.detalle_motivo;
                if (variables.includes(String(item.direccion))) objectUpdate['direccion'] = nuevaOrden.direccion;
                if (variables.includes(String(item.distrito))) objectUpdate['distrito'] = nuevaOrden.distrito;
                if (variables.includes(String(item.referencia))) objectUpdate['referencia'] = nuevaOrden.referencia;
                if (variables.includes(String(item.cobre_detalle.codigo_armario))) objectUpdate['cobre_detalle.codigo_armario'] = nuevaOrden.codigo_armario;
                if (variables.includes(String(item.cobre_detalle.nombre_cliente))) objectUpdate['cobre_detalle.nombre_cliente'] = nuevaOrden.nombre_cliente;
                //actualiza la orden                
                if (Object.entries(objectUpdate).length === 0) {
                  return false;
                } else {
                  return await Orden.findOneAndUpdate({
                    codigo_requerimiento: nuevaOrden.codigo_requerimiento}, {
                    $set: objectUpdate
                  }).then(() => true).catch((error) => {
                    logger.error({
                      message: error.message,
                      service: `agregarReferencias(findOneAndUpdate) - ${nuevaOrden.codigo_requerimiento}`
                    });
                    return false
                  })
                }
              } else {
                return false
              }
            })
          })).then((e) => {
            const correctas = e.filter(item => item === true);
            respuesta = {
              title: `${correctas.length} Ordenes actualizadas correctamente.`,
              status: 'success'
            }
          })
        } else {
          respuesta = {
            title: 'No se encontraron ordenes para enviar.',
            status: 'warning'
          }
        }
      } catch (error) {
        respuesta.title = error.message;
        logger.error({
          message: error.message,
          service: 'agregarReferencias(try/catch)'
        })
      }
    } else {
      respuesta.title = 'No tienes los permisos suficientes.'
    }
  } else {
    respuesta = {title: 'Metodo incorrecto.', status: 'error'};
  }
  return res.send(respuesta);
};