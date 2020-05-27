import { Request, Response } from 'express';
import moment from 'moment';

import { IEmpleado } from '../models/Empleado';
import Albaran from '../models/Albaran';
import logger from '../lib/logger';
import DeshacerEntrada from '../lib/Logistica/DeshacerEntrada';
import DeshacerSalida from '../lib/Logistica/DeshacerSalida';
import AprobarRegistro from '../lib/Logistica/AprobarRegistro';

const nivelAdmin = [1,3,5];
const nivelJefe = [1,3,5,6]
const nivelLogistica = [1,3,5,6,8];

export const listarRegistro = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;
  const metodo = req.headers.metodo;

  let status = 404
  let respuesta = {title: 'Acceso Incorrecto', status: 'error', data: [] as Array<any>}

  if(metodo === 'registroCentralEntrada') {//buscar por fechas de las ordenes de entrada
    if (nivelAdmin.includes(nivelUsuario)) {
      try {
        const fechaInicio: string|any = req.headers.fechainicio;
        const fechaFin: string|any = req.headers.fechafin;
        
        await Albaran.find({
            tipo: 'entrada', 
            createdAt: { 
              $gte: moment(fechaInicio).add(1, 'day').format('YYYY-MM-DD HH:mm') , 
              $lte: moment(fechaFin).add(1, 'day').format('YYYY-MM-DD HH:mm') } 
          }).sort({
            createdAt: -1
          }).populate('almacen_entrada').populate({path: 'usuario_entrega', select: 'nombre apellidos'}).populate('lote.material')
            .then((data) => {
              status = 200;
              respuesta = {
                title: 'Busqueda Correcta.',
                status: 'success',
                data: data
              }
          }).catch((error) => {
            status = 200;
            respuesta = {
              title: 'Error en la busqueda.',
              status: 'error',
              data: [{message: error.message}]
            };
          })
      } catch (error) {
        respuesta.title = 'Error obteniendo datos del cliente.'
        logger.error({
          message: error.mesage,
          service: 'registroCentralEntrada (try/catch)'
        })
      }
    }
  } else if (metodo === 'registroCentralSalida') {//buscar por fechas las ordenes de salida
    if (nivelAdmin.includes(nivelUsuario)) {
      try {
        const almacen: string = String(req.headers.almacen);
        const fechaInicio: string|any = req.headers.fechainicio;
        const fechaFin: string|any = req.headers.fechafin;
        await Albaran.find({
            tipo: 'salida', 
            almacen_salida: almacen,
            createdAt: { 
              $gte: moment(fechaInicio).add(1, 'day').format('YYYY-MM-DD HH:mm') , 
              $lte: moment(fechaFin).add(1, 'day').format('YYYY-MM-DD HH:mm') } 
          }).sort({
            createdAt: -1
          }).populate({
            path: 'almacen_entrada',
            select: 'contrata',
            populate: {
              path: 'contrata',
              select: 'nombre'
            }
          }).populate({
            path: 'usuario_confirma',
            select: 'nombre apellidos'
          }).populate({
            path: 'usuario_entrega', 
            select: 'nombre apellidos'
          }).populate('lote.material')
            .then((data) => {
              status = 200;
              respuesta = {
                title: 'Busqueda Correcta.',
                status: 'success',
                data: data
              }
          }).catch((error) => {
            status = 200;
            respuesta = {
              title: 'Error en la busqueda.',
              status: 'error',
              data: [{message: error.message}]
            };
          })
      } catch (error) {
        respuesta.title = 'Error obteniendo datos del cliente.'
        logger.error({
          message: error.mesage,
          service: 'registroCentralSalida (try/catch)'
        })
      }
    }
  } else if (metodo === 'pendientesCentral') {//buscar las ordenes de salida pendientes
    if (nivelAdmin.includes(nivelUsuario)) {
      const almacen: string = String(req.headers.almacen);
      await Albaran.find({
        tipo: 'salida', 
        almacen_salida: almacen,
        estado_registro: 'PENDIENTE'
      }).sort({
        createdAt: -1
      }).populate({
        path: 'almacen_entrada',
        select: 'contrata',
        populate: {
          path: 'contrata',
          select: 'nombre'
        }
      }).populate({
        path: 'usuario_confirma',
        select: 'nombre apellidos'
      }).populate({
        path: 'usuario_entrega', 
        select: 'nombre apellidos'
      }).populate('lote.material')
        .then((data) => {
          status = 200;
          respuesta = {
            title: 'Busqueda Correcta.',
            status: 'success',
            data: data
          }
      }).catch((error) => {
        status = 200;
        respuesta = {
          title: 'Error en la busqueda.',
          status: 'error',
          data: [{message: error.message}]
        };
      })
    }
  } else if (metodo === 'entradasPrimario') {//buscar ordenes de entrada del almacen primario(contrata)
    if (nivelAdmin.includes(nivelUsuario)) {
      const almacen: string = String(req.headers.almacen);
      await Albaran.find({
        tipo: 'salida', 
        almacen_entrada: almacen,
        estado_registro: 'PENDIENTE'
      }).sort({
        createdAt: -1
      }).populate({
        path: 'almacen_entrada',
        select: 'contrata',
        populate: {
          path: 'contrata',
          select: 'nombre'
        }
      }).populate({
        path: 'usuario_confirma',
        select: 'nombre apellidos'
      }).populate({
        path: 'usuario_entrega', 
        select: 'nombre apellidos'
      }).populate('lote.material')
        .then((data) => {
          status = 200;
          respuesta = {
            title: 'Busqueda Correcta.',
            status: 'success',
            data: data
          }
      }).catch((error) => {
        status = 200;
        respuesta = {
          title: 'Error en la busqueda.',
          status: 'error',
          data: [{message: error.message}]
        };
      })
    }
  } else if (metodo === 'registroPrimarioEntrada') {//buscar registro de ordenes por fecha
    if (nivelAdmin.includes(nivelUsuario)) {
      try {
        const almacen: string = String(req.headers.almacen);
        const fechaInicio: string|any = req.headers.fechainicio;
        const fechaFin: string|any = req.headers.fechafin;
        await Albaran.find({
            tipo: 'salida', 
            almacen_entrada: almacen,
            createdAt: { 
              $gte: moment(fechaInicio).add(1, 'day').format('YYYY-MM-DD HH:mm') , 
              $lte: moment(fechaFin).add(1, 'day').format('YYYY-MM-DD HH:mm') } 
          }).sort({
            createdAt: -1
          }).populate({
            path: 'almacen_entrada',
            select: 'contrata',
            populate: {
              path: 'contrata',
              select: 'nombre'
            }
          }).populate({
            path: 'usuario_confirma',
            select: 'nombre apellidos'
          }).populate({
            path: 'usuario_entrega', 
            select: 'nombre apellidos'
          }).populate('lote.material')
            .then((data) => {
              status = 200;
              respuesta = {
                title: 'Busqueda Correcta.',
                status: 'success',
                data: data
              }
          }).catch((error) => {
            status = 200;
            respuesta = {
              title: 'Error en la busqueda.',
              status: 'error',
              data: [{message: error.message}]
            };
          })
      } catch (error) {
        respuesta.title = 'Error obteniendo datos del cliente.'
        logger.error({
          message: error.mesage,
          service: 'registroPrimarioEntrada (try/catch)'
        })
      }
    }
  } else if (metodo === 'pendientesPrimario') {//buscar ordenes de salida pendientes
    if (nivelAdmin.includes(nivelUsuario)) {
      const almacen: string = String(req.headers.almacen);
      await Albaran.find({
        $or:[
          {tipo: 'salida'}, {tipo: 'devolucion'}
        ],
        almacen_salida: almacen,
        estado_registro: 'PENDIENTE'
      }).sort({
        createdAt: -1
      }).populate({
        path: 'almacen_entrada',
        select: 'tecnico',
        populate: {
          path: 'tecnico',
          select: 'nombre apellidos'
        }
      }).populate({
        path: 'usuario_confirma',
        select: 'nombre apellidos'
      }).populate({
        path: 'usuario_entrega', 
        select: 'nombre apellidos'
      }).populate('lote.material')
        .then((data) => {
          status = 200;
          respuesta = {
            title: 'Busqueda Correcta.',
            status: 'success',
            data: data
          }
      }).catch((error) => {
        status = 200;
        respuesta = {
          title: 'Error en la busqueda.',
          status: 'error',
          data: [{message: error.message}]
        };
      })
    }
  } else if (metodo === 'registroPrimarioSalida') {//buscar ordenes de salida por fecha
    if (nivelAdmin.includes(nivelUsuario)) {
      try {
        const almacen: string = String(req.headers.almacen);
        const fechaInicio: string|any = req.headers.fechainicio;
        const fechaFin: string|any = req.headers.fechafin;
        await Albaran.find({
            $or: [
              {tipo: 'salida'}, {tipo: 'devolucion'}
            ],
            almacen_salida: almacen,
            createdAt: { 
              $gte: moment(fechaInicio).add(1, 'day').format('YYYY-MM-DD HH:mm') , 
              $lte: moment(fechaFin).add(1, 'day').format('YYYY-MM-DD HH:mm') } 
          }).sort({
            createdAt: -1
          }).populate({
            path: 'almacen_entrada',
            select: 'tecnico',
            populate: {
              path: 'tecnico',
              select: 'nombre apellidos'
            }
          }).populate({
            path: 'usuario_confirma',
            select: 'nombre apellidos'
          }).populate({
            path: 'usuario_entrega', 
            select: 'nombre apellidos'
          }).populate('lote.material')
            .then((data) => {
              status = 200;
              respuesta = {
                title: 'Busqueda Correcta.',
                status: 'success',
                data: data
              }
          }).catch((error) => {
            status = 200;
            console.log(error);
            respuesta = {
              title: 'Error en la busqueda.',
              status: 'error',
              data: [{message: error.message}]
            };
          })
      } catch (error) {
        respuesta.title = 'Error obteniendo datos del cliente.'
        logger.error({
          message: error.mesage,
          service: 'registroCentralSalida (try/catch)'
        })
      }
    }
  } else if (metodo === 'devolucionCentral') {//buscar ordenes devolución(central) pendientes
    if (nivelAdmin.includes(nivelUsuario)) {
      status = 200;
      try {
        const almacen: string = String(req.headers.almacen);
        await Albaran.find({
          tipo: 'devolucion',
          estado_registro: 'PENDIENTE',
          almacen_entrada: almacen,
        }).sort({
          createdAt: -1
        }).populate({
          path: 'almacen_entrada',
          select: 'tecnico',
          populate: {
            path: 'tecnico',
            select: 'nombre apellidos'
          }
        }).populate({
          path: 'usuario_confirma',
          select: 'nombre apellidos'
        }).populate({
          path: 'usuario_entrega', 
          select: 'nombre apellidos'
        }).populate('lote.material')
          .then((data) => {
            status = 200;
            respuesta = {
              title: 'Busqueda Correcta.',
              status: 'success',
              data: data
            }
        }).catch((error) => {
          status = 200;
          console.log(error);
          respuesta = {
            title: 'Error en la busqueda.',
            status: 'error',
            data: [{message: error.message}]
          };
        })
      } catch (error) {
        respuesta.title = 'Error obteniendo datos del cliente.'
        logger.error({
          message: error.mesage,
          service: 'devolucionCentral (try/catch)'
        })
      }
    }
  } else if (metodo === 'registroCentralDevolucion') {//buscar ordenes devolución(central) por fechas
    if (nivelAdmin.includes(nivelUsuario)) {
      status = 200;
      try {
        const almacen: string = String(req.headers.almacen);
        const fechaInicio: string|any = req.headers.fechainicio;
        const fechaFin: string|any = req.headers.fechafin;
        await Albaran.find({
          tipo: 'devolucion',
          almacen_entrada: almacen,
          createdAt: { 
            $gte: moment(fechaInicio).add(1, 'day').format('YYYY-MM-DD HH:mm') , 
            $lte: moment(fechaFin).add(1, 'day').format('YYYY-MM-DD HH:mm') } 
        }).sort({
          createdAt: -1
        }).populate({
          path: 'almacen_entrada',
          select: 'tecnico',
          populate: {
            path: 'tecnico',
            select: 'nombre apellidos'
          }
        }).populate({
          path: 'usuario_confirma',
          select: 'nombre apellidos'
        }).populate({
          path: 'usuario_entrega', 
          select: 'nombre apellidos'
        }).populate('lote.material')
          .then((data) => {
            status = 200;
            respuesta = {
              title: 'Busqueda Correcta.',
              status: 'success',
              data: data
            }
        }).catch((error) => {
          status = 200;
          console.log(error);
          respuesta = {
            title: 'Error en la busqueda.',
            status: 'error',
            data: [{message: error.message}]
          };
        })
      } catch (error) {
        respuesta.title = 'Error obteniendo datos del cliente.'
        logger.error({
          message: error.mesage,
          service: 'devolucionCentral (try/catch)'
        })
      }
    }
  }

  return res.status(status).send(respuesta);
};

export const actualizarRegistro = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;
  const metodo = req.headers.metodo;
  const estados = ['success', 'error'];
  const tipos = ['ENTRADA', 'PENDIENTE']
  let status = 404;
  let respuesta = {title: 'Acceso Incorrecto', status: 'error', data: [] as Array<any>}
  
  if (metodo === 'deshacerEntrada') {
    if (nivelAdmin.includes(nivelUsuario)) {
      let errores = 0;
      try {
        const data = req.body;
        const estados = ['success', 'error'];

        const revertirInventario = (data.lote).map( async(item:any) => {
          if (item.status === true && estados.includes(data.estado_operacion)) {
            return await DeshacerEntrada(item.seriado, item, data.almacen_entrada).catch(() => ++errores)
          } else {
            return false
          };
        });

        await Promise.all(revertirInventario).then(async() => {
          status = 200
          if (errores == 0) {
            await Albaran.findByIdAndUpdate({_id: data._id}, {
              estado_operacion: 'deshacer',
              observacion_entrada: `Entrada Deshecha por ${Empleado.nombre} ${Empleado.apellidos}`
            }).then(() => {
                respuesta.title = 'Operación realizada con exito.';
                respuesta.status = 'success';
              }).catch((error) => {
                logger.error({
                  message: error.message,
                  service: 'Albaran update (promise.all)'
                });
                respuesta.title = 'Error actualizando el registro.'
              })
          } else {
            return respuesta.title = 'Hubo un error actualizando el inventario.';
          }
        }).catch((error) => {
          respuesta.title = 'Hubo un error ejecutando la operacion.';
          logger.error({
            message: error.message,
            service: 'Promise.all'
          });
        })
      } catch (error) {
        logger.error({
          message: error.message,
          service: 'deshacerEntrada (try/catch)'
        });
        console.log(error);
      }
    }
  } else if (metodo === 'deshacerSalida') {
    if (nivelJefe.includes(nivelUsuario)) {
      try {
        const { almacen } = req.body;
        const estados = ['success', 'error'];

        await Albaran.findById({_id: almacen}).then(async(data) => {
          if (data && data.almacen_salida) {
            if (estados.includes(data.estado_operacion) && tipos.includes(data.estado_registro)) {
              await DeshacerSalida(data.lote, data.almacen_entrada, data.almacen_salida).then(async(datos) => {
                status = 200;
                await Albaran.findByIdAndUpdate({_id: almacen}, {
                  lote: datos,
                  estado_operacion: 'deshacer',
                  estado_registro: 'rechazado',
                  observacion_salida: `operación deshecha por ${Empleado.nombre} ${Empleado.apellidos}`
                }).then(() => {
                  respuesta.title = "Operación realizada con exito.";
                  respuesta.status = 'success';
                }).catch((error) => {
                  logger.error({
                    message:error.message,
                    service: 'deshacerSalida(findByIdAndUpdate)'
                  });
                  respuesta.title = "Error actualizando el registro."
                })
              //errores funcion deshacer
              }).catch(() => {
                respuesta.title = "Error actualizando el inventario."
              });
            } else {
              status = 200;
              respuesta.title = 'Esa operación no se puede deshacer o ya está deshecha.';
              respuesta.status = 'warning';
            }
          } else {
            status = 200;
            respuesta.title = 'No se encontraron datos del registro.';
            respuesta.status = 'warning';
          }
        //error en la busqueda
        }).catch((error) => {
          console.log(error);
          status = 200;
          respuesta.title = "Error actualizando el registro.";
          logger.error({
            message: error.message,
            service: 'deshacerSalida(findById)'
          });
        })
      //error del catch
      } catch (error) {
        logger.error({
          message: error.message,
          service: 'deshacerSalida (try/catch)'
        });
        console.log(error);
      }
    }
  } else if (metodo === 'actualizarRegistro') {
    if (nivelJefe.includes(nivelUsuario)) {
      try {
        const { almacen, observacion, aprobado } = req.body;
        await Albaran.findById({_id: almacen}).then(async(data) => {
          status = 200;
          if (data && data.almacen_salida) {
            if (estados.includes(data.estado_operacion) && data.estado_registro === 'PENDIENTE') {
              if (aprobado) {
                await AprobarRegistro(data.lote, data.almacen_entrada, data.almacen_salida).then(async() => {
                  status = 200;
                  const obs = observacion ? observacion : `operación aprobada por ${Empleado.nombre} ${Empleado.apellidos}`
                  await Albaran.findByIdAndUpdate({_id: almacen}, {
                    usuario_confirma: Empleado._id,
                    fecha_confirmacion: new Date(),
                    estado_registro: 'aprobado',
                    observacion_entrada: obs
                  }).then(() => {
                    respuesta.title = "Operación realizada con exito.";
                    respuesta.status = 'success';
                  }).catch((error) => {
                    logger.error({
                      message:error.message,
                      service: 'actualizarRegistro(findByIdAndUpdate)'
                    });
                    respuesta.title = "Error actualizando el registro."
                  })
                })
              } else {
                await DeshacerSalida(data.lote, data.almacen_entrada, data.almacen_salida).then(async(datos) => {
                  status = 200;
                  const obs = observacion ? observacion : `operación rechazada por ${Empleado.nombre} ${Empleado.apellidos}`
                  await Albaran.findByIdAndUpdate({_id: almacen}, {
                    lote: datos,
                    usuario_confirma: Empleado._id,
                    fecha_confirmacion: new Date(),
                    estado_registro: 'rechazado',
                    observacion_entrada: obs
                  }).then(() => {
                    respuesta.title = "Operación realizada con exito.";
                    respuesta.status = 'success';
                  }).catch((error) => {
                    logger.error({
                      message:error.message,
                      service: 'actualizarRegistro(findByIdAndUpdate)'
                    });
                    respuesta.title = "Error actualizando el registro."
                  })
                //errores funcion deshacer
                }).catch(() => {
                  respuesta.title = "Error actualizando el inventario."
                });
              }
            } else {
              respuesta.title = 'Esa operación no se puede deshacer o ya está deshecha.'
            }
          } else {
            respuesta.title = "No se encontraron datos del registro."
          }
        //error en la busqueda
        }).catch((error) => {
          console.log(error);
          status = 200;
          respuesta.title = "Error actualizando el registro.";
          logger.error({
            message: error.message,
            service: 'actualizarRegistro(findById)'
          });
        })
      } catch (error) {
        logger.error({
          message: error.message,
          service: 'actualizarRegistro (try/catch)'
        });
        console.log(error);
      }
    }
  } else {
    respuesta.title = "Metodo incorrecto"
  }

  return res.status(status).send(respuesta);
}