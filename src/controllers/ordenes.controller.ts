import { Request, Response } from 'express';
import moment from 'moment';
import Orden, { IOrden } from '../models/Orden';
import { IEmpleado } from '../models/Empleado';

import obtenerFecha from '../lib/obtenerFecha'
import logger from '../lib/logger';
import obtenerFiltros from '../lib/obtenerFiltros';
import subirImagenes from '../lib/subirImagenes';
import { Error, Schema } from 'mongoose';
import LiquidarFerreteria from '../lib/Logistica/Ferreteria/LiquidarFerreteria';
import LiquidarEquipo from '../lib/Logistica/Equipos/LiquidarEquipo';

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
          }).then(async(data: any) => {
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
        await Orden.find({
          tipo: tipo,
          'contrata_asignada.nombre_contrata': nivelUsuario.contrata.nombre, 
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
        }).then(async(data: any) => {
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
        }).then(async(data: any) => {
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
        }).then((data: any) => {
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
      await Orden.findOne({codigo_requerimiento: codigo}).select({
        tipo:1, codigo_requerimiento:1, fecha_registro:1, distrito:1, contrata_asignada:1
      }).then((data) => {
        status = 200;
        if (!data?.contrata_asignada?.nombre_contrata === nivelUsuario.contrata.nombre) {
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
        { 'contrata_asignada.tecnico_asignado.fecha_finalizado': new Date() }
      ]
    }).sort('contrata_asignada.tecnico_asignado.estado_orden').then((data) => {
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
      const {ordenes, contrata} = req.body;
      try {
        const detalle_registro = {
          contrata: contrata,
          usuario: nivelUsuario.usuario.email,
          estado: 'Pendiente',
          observacion: 'Se asigna la orden a la contrata desde el panel administrativo.'
        };
        await Orden.updateMany({
            _id: { $in: ordenes }
          }, {
            $set: {'contrata_asignada.nombre_contrata': contrata, 'asignado': true}, 
            $push: { detalle_registro } 
          }).then(() => {
            respuesta = {title: 'Ordenes actualizadas correctamente.', status: 'success'};
            status = 200;
          }).catch((error) => {
            respuesta.title = 'Error actualizando ordenes.'
            logger.error({
              message: error.message,
              service: 'Error asignando las ordenes a la contrata.'
            })
          })
      } catch (error) {
        respuesta.title = 'Error obteniendo valores.';
        status = 400;
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
      const {ordenes, estado, observacion } = req.body;
      const files: any = req.files;
      let estado_tecnico = 1;
      if (tecAsignado.includes(String(estado).toLowerCase())) {
        estado_tecnico = 1;
      } else {
        estado_tecnico = 3;
      }
      //funcion para subir imagenes a cloudinary, si no hay imagenes devolverá vacio
      await subirImagenes(files)
        .then(async(imagenes) => {
          //asignar las imagenes al registro
          let detalle_registro = {
            estado: estado,         
            usuario: nivelUsuario.usuario.email,
            contrata: nivelUsuario.contrata.nombre,
            observacion: `${observacion} (actualizado a "${estado}")`,
            imagenes: imagenes
          };
          //convertir el formdata(text) en array
          let arrayOrden = ordenes.split(",").map(String);
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
      respuesta = {title: 'No tienes permisos suficientes.', status: 'error'};
    }
  } else if (metodo === 'actualizarTecnico') {
    if (nivelOperativo.includes(nivelUsuario.usuario.tipo)) {
      const {ordenes, idTecnico, nombreTecnico } = req.body;
      const detalle_registro = {
        estado: 'Asignada',
        usuario: nivelUsuario.usuario.email,
        contrata: nivelUsuario.contrata.nombre,
        tecnico: nombreTecnico,
        observacion: `Se asigna la orden al técnico ${nombreTecnico}.`
      }
      await Orden.updateMany({
        _id: { $in: ordenes}}, {
        $set: { 
          'contrata_asignada.tecnico_asignado.id': idTecnico, 
          'contrata_asignada.tecnico_asignado.nombre_tecnico': nombreTecnico, 
          'contrata_asignada.tecnico_asignado.estado_orden':  1,
          'contrata_asignada.tecnico_asignado.fecha_finalizado': null,
          'contrata_asignada.estado': 'Asignada'},
        $push: { detalle_registro} }, {
        new: true
      }).then((e:any) => {
        status = 200,
        respuesta = {title: `Ordenes asignadas: ${e.nModified}.`, status: 'success'}
      }).catch((error:any) => {
        logger.error({
          message: error.message,
          service: 'Asignar técnico.'
        });
        respuesta.title = "Error actualizando las ordenes"
      })
    } else {
      respuesta = {title: 'No tienes permisos suficientes.', status: 'error'};
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
        ).then((a) => {
          console.log(a);
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
  } else {
    respuesta = {title: 'Metodo incorrecto.', status: 'error'};
  }
  return res.send(respuesta);
};