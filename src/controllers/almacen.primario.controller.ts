import { Request, Response } from 'express';

import { IEmpleado } from '../models/Empleado';
import Almacen from '../models/Almacen';
import Albaran from '../models/Albaran';
import Equipo, { IOEquipo} from '../models/Equipo';
import SalidaAlmacen from '../lib/Logistica/SalidaAlmacen';
import logger from '../lib/logger';
import OrganizarEquiposContrata from '../lib/OrganizarEquiposContrata';
import OrganizarEquiposTecnicos from '../lib/OrganizarEquiposTecnicos';
import { Error } from 'mongoose';

const nivelLogistica = [1,3,5,6,8];

interface IEquiposAlmacen {
  material: {
    nombre: string,
    tipo?: string,
    medida?: string,
    seriado?: boolean
  },
  entrada: Array<IOEquipo>,
  contable: Array<IOEquipo>,
  salida: Array<IOEquipo>
}

export const listarAlmacen = async (req: Request, res: Response):Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;
  const metodo = req.headers.metodo;

  let respuesta = { title: 'Acceso denegado.', status: 'error', dato: '', data: {}};

  if (metodo === 'comprobarContrata') {
    if (nivelLogistica.includes(nivelUsuario)) {
      try {
        const contrata = String(req.headers.idcontrata);
        await Almacen.findOne({contrata: contrata, tipo: 'IMP'}).then(async(data) => {
          if (data) {
            respuesta = {
              title: 'Busqueda correcta.',
              status: 'success',
              dato: data._id,
              data: {}
            };
          } else {
            const nuevoAlmacen = new Almacen({
              tipo: 'IMP',
              contrata: contrata
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
  } else if (metodo === 'obtenerIdAlmacen') {
    if (nivelLogistica.includes(nivelUsuario)) {
      await Almacen.findOne({tipo: 'IMP',contrata: Empleado.contrata}).then( async(data) => {
        if (data) {
          respuesta = {title: 'Busqueda correcta.', status: 'success', data:{},  dato: data._id}
        } else {
          const nuevoAlmacenCentral = new Almacen({
            tipo: 'IMP',
            ferreteria: []
          });
          await nuevoAlmacenCentral.save().then((nuevo) => {
            respuesta = {title: 'Se creó el almacen central.', status: 'success', data:{},  dato: nuevo._id}
          }).catch((error: Error) => {
            respuesta.title = 'Error creando almacen.';
            logger.error({
              message: error.message,
              service: 'obtenerIdAlmacen (save)'
            });
          });
        };
      }).catch((error: Error) => {
        respuesta.title = "Error en la busqueda del almacen."
        logger.error({
          message: error.message,
          service: 'obtenerIdAlmacen'
        })
      })
    }
  } else if (metodo === 'obtenerAlmacen') {
    if (nivelLogistica.includes(nivelUsuario)) {
      await Almacen.findOne({tipo: 'IMP', contrata: Empleado.contrata}).populate('ferreteria.material').then(async(almacen) => {
        const equiposAlmacen = new Array;
        if (almacen) {
          await Equipo.find({
            'estado': {$ne: 'liquidado'},
            $or: [
              {almacen_entrada: almacen._id}, {almacen_salida: almacen._id}
            ]
          }).populate('material').populate({
            path: 'almacen_entrada',
            select: 'tecnico contrata tipo',
            populate: [{
              path: 'tecnico',
              select: 'nombre apellidos'
            }, {
              path: 'contrata',
              select: 'nombre'
            }]
          }).populate({
            path: 'almacen_salida',
            select: 'tecnico contrata tipo',
            populate: [{
              path: 'tecnico',
              select: 'nombre apellidos'
            }, {
              path: 'contrata',
              select: 'nombre'
            }]
          }).then(async(equipos:any) => {
            await OrganizarEquiposContrata(equipos, almacen).then(nuevaLista => {
              return respuesta = {
                title: 'Busqueda correcta.',
                status: 'success',
                data: {ferreteria:almacen.ferreteria, equipos: nuevaLista},
                dato: ''
              };
            }).catch((error) => {//error de organizar equipos
              logger.error({
                message: error.message,
                service: 'obtenerAlmacenes(OrganizarEquiposContrata)'
              })
            })
          })
        } else {
          respuesta = {
            title: 'Busqueda incorrecta.',
            status: 'warning',
            data: { ferreteria: almacen, equipos: equiposAlmacen },
            dato: ''
          };
        }
      }).catch((error) => {
        respuesta.title = 'Error en la busqueda del almacen.'
        logger.error({
          message: error.message,
          service: 'obtenerInventario(findOne)'
        })
      });
    }
  } else if (metodo === 'obtenerAlmacenes') {
    if (nivelLogistica.includes(nivelUsuario)) {
      let grupoAlmacen = {tecnicos: [] as Array<any>, almacenes: [] as Array<any>};
      await Almacen.find({tipo: 'IMS', contrata: Empleado.contrata._id}).populate('tecnico').populate('ferreteria.material').then(async(almacenes) => {
        return Promise.all(
          //recorrer los almacenes para ubicar los equipos
          almacenes.map(async(alm:any) => {
            //guardar el nombre de la contrata
            grupoAlmacen.tecnicos.push(alm.tecnico.nombre + ' ' + alm.tecnico.apellidos);
            //crear el objeto a guardar en el array de almacenes
            let nuevoAlmacen = {
              tecnico: alm.tecnico && alm.tecnico.nombre + ' ' + alm.tecnico.apellidos,
              ferreteria: alm.ferreteria,
              equipos: [] as Array<IEquiposAlmacen>
            } 
            //buscar los equipos con el id del almacen
            return await Equipo.find({
              estado: { $ne: 'liquidado'},
              $or: [
                {almacen_entrada: alm._id}, {almacen_salida: alm._id}
              ]
            }).populate('material').populate({
              path: 'almacen_entrada',
              select: 'tecnico contrata tipo',
              populate: [{
                path: 'tecnico',
                select: 'nombre apellidos'
              }, {
                path: 'contrata',
                select: 'nombre'
              }]
            }).populate({
              path: 'almacen_salida',
              select: 'tecnico contrata tipo',
              populate: [{
                path: 'tecnico',
                select: 'nombre apellidos'
              }, {
                path: 'contrata',
                select: 'nombre'
              }]
            }).then( async(listaEquipos: any) => {
              await OrganizarEquiposTecnicos(listaEquipos, alm).then((nuevaLista) => {
                nuevoAlmacen.equipos = nuevaLista;
                return grupoAlmacen.almacenes.push(nuevoAlmacen)
              }).catch((error) => {//error de organizar equipos
                logger.error({
                  message: error.message,
                  service: 'obtenerAlmacenes(OrganizarEquiposTecnico)'
                })
              })
            }).catch((error:Error) => {//erro de busque del equipo
              logger.error({
                message: error.message,
                service: 'obtenerAlmacenes(equipos.find)'
              })
            })
          })
        ).then(() => grupoAlmacen);
      }).then(() => {
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          data: grupoAlmacen,
          dato: ''
        };
      }).catch((error) => {
        respuesta.title = 'Error en la busqueda.';
        logger.error({
          message: error.message,
          service: 'obtenerAlmacenes(almacen.find)'
        })
      });
    };
  }

  return res.send(respuesta);
}

export const crearRegistro = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario:number = Empleado.usuario.tipo;
  const metodo:string|any = req.headers.metodo ? req.headers.metodo : null;

  let status = 404
  let respuesta = {title: 'Acceso Incorrecto', status: 'error', data: [] as Array<any>}

  if (metodo === 'crearSalida') {
    if (nivelLogistica.includes(nivelUsuario)) {
      try {
        const { idAlmacen, tecnicoAlmacen, dataOrden, fechaLote, descripcionSalida } = req.body;
        const descripcionAlterna = `Salida de lote de ${dataOrden.length} materiales.`;
        await SalidaAlmacen(dataOrden, idAlmacen, tecnicoAlmacen).then(async(data) => {
          const operacionesFallidas =  data.filter((item) => item.status === false);

          const nuevoAlbaran = new Albaran({
            tipo: 'salida',
            estado_registro: 'pendiente',
            lote: data,
            estado_operacion: operacionesFallidas.length > 0 ? 'error' : 'success',
            almacen_salida: idAlmacen,
            almacen_entrada: tecnicoAlmacen,
            usuario_entrega: Empleado._id,
            observacion_salida: descripcionSalida ? descripcionSalida : descripcionAlterna,
            fecha_salida: fechaLote
          });

          const titulo = operacionesFallidas.length > 0 ? 
            `Se encontrarón ${data.length} materiales, ${operacionesFallidas.length} no se almacenaron correctamente.` 
            : 
            `Se registró correctamente la salida de ${data.length} materiales.`

          await nuevoAlbaran.save().then(() => {
            status = 200;
            respuesta = {
              title: titulo,
              status: operacionesFallidas.length !== 0 ? 'warning' : 'success',
              data: []
            };
          //error nuevoAlbaran
          }).catch((error) => {
            logger.error({
              message: error.message,
              service: 'NuevoAlbaran.save'
            });
            status = 200;
            respuesta = {
              title: 'Error guardando la orden de salida.',
              status: 'warning',
              data: []
            };
          })
        //error de salidaAlmacen
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'SalidaAlmacen'
          });
          status = 200;
          respuesta = {
            title: 'Error actualizando el almacén',
            status: 'error',
            data: []
          };
        })
      } catch (error) {
        logger.error({
          message: error.message,
          service: 'CrearSalida (try/catch)'
        });
        respuesta.title = 'Error en la función para crear salida (try/catch).'
      }
    }
  } else if (metodo === 'crearDevolución') {
    if (nivelLogistica.includes(nivelUsuario)) {
      try {
        const { idAlmacen, almacenCentral, dataOrden, fechaLote, descripcionSalida } = req.body;
        const descripcionAlterna = `devolución de lote de ${dataOrden.length} materiales.`;
        await SalidaAlmacen(dataOrden, idAlmacen, almacenCentral).then(async(data) => {
          const operacionesFallidas =  data.filter((item) => item.status === false);

          const nuevoAlbaran = new Albaran({
            tipo: 'devolucion',
            estado_registro: 'pendiente',
            lote: data,
            estado_operacion: operacionesFallidas.length > 0 ? 'error' : 'success',
            almacen_salida: idAlmacen,
            almacen_entrada: almacenCentral,
            usuario_entrega: Empleado._id,
            observacion_salida: descripcionSalida ? descripcionSalida : descripcionAlterna,
            fecha_salida: fechaLote
          });

          const titulo = operacionesFallidas.length > 0 ? 
            `Se encontrarón ${data.length} materiales, ${operacionesFallidas.length} no se almacenaron correctamente.` 
            : 
            `Se registró correctamente la devolucion de ${data.length} materiales.`;

            await nuevoAlbaran.save().then(() => {
              status = 200;
              respuesta = {
                title: titulo,
                status: operacionesFallidas.length !== 0 ? 'warning' : 'success',
                data: []
              };
            //error nuevoAlbaran
            }).catch((error) => {
              logger.error({
                message: error.message,
                service: 'NuevoAlbaran.save (devolucion)'
              });
              status = 200;
              respuesta = {
                title: 'Error guardando la orden de salida.',
                status: 'warning',
                data: []
              };
            })
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'SalidaAlmacen(devolucion)'
          });
          status = 200;
          respuesta = {
            title: 'Error actualizando el almacén',
            status: 'error',
            data: []
          };
        })
      } catch (error) {
        logger.error({
          message: error.message,
          service: 'crearDevolución (try/catch)'
        });
        respuesta.title = 'Error en la función para crear salida (try/catch).'
      }
    }
  }

  return res.status(status).send(respuesta);
}