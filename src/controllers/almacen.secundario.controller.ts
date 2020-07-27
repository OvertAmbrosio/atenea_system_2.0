import { Request, Response } from 'express';
import moment from 'moment';

import Tecnico from '../models/Empleado'
import { IEmpleado } from '../models/Empleado';
import Almacen from '../models/Almacen';
import Albaran from '../models/Albaran';
import Equipo from '../models/Equipo';
import EquipoBaja from '../models/EquipoBaja';
import logger from '../lib/logger';
import SalidaAlmacen from '../lib/Logistica/SalidaAlmacen';
import Registro from '../models/Registro';
import OrganizarEquiposTecnicos from '../lib/OrganizarEquiposTecnicos';

const nivelLogistica = [1,3,5,6,8];

export const listarAlmacen = async (req: Request, res: Response):Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;
  const metodo = req.headers.metodo;
  let respuesta = { title: 'Acceso denegado.', status: 'error', dato: '', data: {}};

  if (metodo === 'comprobarTecnico') {
    if (nivelLogistica.includes(nivelUsuario)) {
      try {
        const tecnico = String(req.headers.idtecnico);
        await Almacen.findOne({tecnico: tecnico}).then(async(data) => {
          if (data) {
            respuesta = {
              title: 'Busqueda correcta.',
              status: 'success',
              dato: data._id,
              data: {}
            };
          } else {
            const nuevoAlmacen = new Almacen({
              tipo: 'IMS',
              contrata: Empleado.contrata._id,
              tecnico: tecnico
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
  } else if (metodo  === 'obtenerAlmacen') {
    if (nivelLogistica.includes(nivelUsuario)) {
      try {
        const almacenTecnico = String(req.headers.idtecnico);
        await Almacen.findOne({_id: almacenTecnico}).populate('ferreteria.material').then(async(almacen) => {
          if (almacen) {
            await Equipo.find({
              $and:[
                {$or: [
                  {estado: 'contable'}, {estado: 'traslado'}
                ]}, 
                {$or: [{almacen_entrada: almacen._id}, {almacen_salida: almacen._id}]}
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
            }).sort('estado').then(async(equipos:any) => {
              await OrganizarEquiposTecnicos(equipos, almacen).then((nuevaLista) => {
                return respuesta = {
                  title: 'Busqueda correcta.',
                  status: 'success',
                  data: {ferreteria:almacen.ferreteria, equipos: nuevaLista},
                  dato: ''
                };
              }).catch((error) => {//error de organizar equipos
                logger.error({
                  message: error.message,
                  service: 'obtenerAlmacenes(OrganizarEquiposTecnico)'
                })
              })
            }).catch((error:Error) => {//erro de busque del equipo
              logger.error({
                message: error.message,
                service: 'obtenerAlmacen-secundario(equipos.find)'
              })
            })
          } else {
            respuesta = {
              title: 'Busqueda incorrecta.',
              status: 'warning',
              data: { ferreteria: [], equipos: [] },
              dato: ''
            };
          }
        }).catch((error) => {//error de busqueda
          respuesta.title = 'Error en la busqueda del almacen.';
          respuesta.data = {ferreteria: [], equipos: [] };
          logger.error({
            message: error.message,
            service: 'obtenerAlmacen secundario(findOne)'
          })
        });
      } catch (error) {//catch try/c
        respuesta.title = 'Error obteniendo datos del cliente.';
        logger.error({
          message: error.message,
          service: 'obtenerAlmacen (try/catch).'
        });
      }
    }
  } else if (metodo === 'registroEquipos') {
    if (nivelLogistica.includes(nivelUsuario)) {
      await EquipoBaja.find({contrata: Empleado.contrata._id, $or:[{estado: 'traslado'}, {estado: 'rechazado'}]}).populate(
        'material tecnico usuario_entrega'
      ).then((datos) => {
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          dato: '',
          data: datos
        };
      }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'registroEquipos'
        });
        respuesta.title = "Error en la busqueda."
      })
    }
  } else if (metodo === 'almacenTecnico') {
    await Almacen.findOne({tecnico: Empleado._id}).populate('ferreteria.material').sort('updatedAt').then(async(almacen) => {
      if (almacen) {
        //los equipos liquidados tienen el almacen del tec. en almacen_salida y almacen_entrada en null
        await Equipo.find({almacen_entrada: almacen?._id}).populate({
          path: 'material',
          select: 'nombre _id'
        }).then((equipos) => {
          respuesta = {
            title: 'Busqueda correcta.',
            status: 'success',
            data: {
              ferreteria: almacen.ferreteria,
              equipos: equipos
            },
            dato: almacen._id
          }
        }).catch((error) => {//error de equipo
          respuesta.title = 'Error en la busqueda del almacen.';
          respuesta.data = {ferreteria: [], equipos: [] };
          logger.error({
            message: error.message,
            service: 'almacenTecnico secundario(equipos.find)'
          })
        })
      } else {
        respuesta = {
          title: 'Almacen vacio.',
          status: 'success',
          dato: '',
          data: { ferreteria: [], equipos: []}
        }
      }
    }).catch((error) => {//error de almacen
      respuesta.title = 'Error en la busqueda del almacen.';
      respuesta.data = {ferreteria: [], equipos: [] };
      logger.error({
        message: error.message,
        service: 'almacenTecnico secundario(findOne)'
      })
    })
  } else if (metodo === 'buscarRegistroFechas') {
    try {
      const fechaInicio: string = String(req.headers.fechainicio);
      const fechaFin: string = String(req.headers.fechafin); 
      
      await Registro.find({createdAt: { 
        $gte: moment(fechaInicio).format('YYYY-MM-DD HH:mm') , 
        $lte: moment(fechaFin).format('YYYY-MM-DD HH:mm') } 
      }).populate({
        path: 'tecnico',
        select: 'nombre apellidos carnet documento_identidad'
      }).populate({
        path: 'gestor',
        select: 'nombre apellidos'
      }).populate({
        path: 'material_usado.material_no_seriado.material',
        select: 'nombre seriado medida tipo'
      }).populate({
        path: 'material_usado.material_seriado.material',
        select: 'nombre seriado medida tipo'
      }).populate({
        path: 'material_usado.material_baja.material',
        select: 'nombre seriado medida tipo'
      }).populate('orden').then((datos) => {
        console.log('aki')
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          data: datos,
          dato: ''
        };
      }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'buscarRegistroCodigo(find)'
        });
        respuesta.title = 'Error en la busqueda.'
      })
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'buscarRegistroFechas(try/catch)'
      });
      respuesta.title = 'Error obteniendo datos del cliente.'
    }
  } else if (metodo === 'buscarRegistroCodigo') {
    try {
      const { requerimiento } = req.headers;
      await Registro.find({$or: [
        {codigo_requerimiento: requerimiento},
        {'material_usado.material_seriado.serie': requerimiento}
      ]}).populate('tecnico gestor').populate({
          path: 'material_usado.material_no_seriado.material'
        }).populate({
          path: 'material_usado.material_seriado.material'
        }).populate({
          path: 'material_usado.material_baja.material'
        }).populate({
          path: 'codigo_requerimiento',
          model: 'Ordene'
        }).then((datos) => {
          respuesta = {
            title: 'Busqueda correcta.',
            status: 'success',
            data: datos,
            dato: ''
          };
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'buscarRegistroCodigo(find)'
          });
          respuesta.title = 'Error en la busqueda.'
        })
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'buscarRegistroCodigo(try/catch)'
      });
      respuesta.title = 'Error obteniendo datos del cliente.'
    }
  } else if (metodo === 'listaAlbaranPendiente') {
    await Almacen.findOne({tecnico: Empleado._id}).then(async(almacen) => {
      if (almacen) {
        await Albaran.find({almacen_entrada: almacen._id, estado_registro: 'pendiente'}).populate({
          path: 'usuario_entrega',
          select: 'nombre apellidos'
        }).populate({
          path: 'lote.material',
          select: 'nombre seriado'
        }).select('almacen_entrada createdAt lote observacion_salida usuario_entrega').sort('createdAt').then((data) => {
          respuesta = {
            title: 'Busqueda correcta',
            status: 'success',
            data: data,
            dato: ''
          }
        }).catch((error) => {
          respuesta.title = error.message;
          respuesta.status = 'danger';
          logger.error({
            message: error.message,
            service: 'listaAlbaranPendiente (albaran find)'
          });
        })
      } else {
        respuesta.title = 'No se encuentra el almacen.';
        respuesta.status = 'danger';
      }
    }).catch((error) => {
      respuesta.title = error.message;
      respuesta.status = 'danger';
      logger.error({
        message: error.message,
        service: 'listaAlbaranPendiente (almacen findone)'
      });
    })
  } else if (metodo === 'buscarAlmacenSecundario') {
    try {
      const carnet = String(req.headers.carnet).toUpperCase();
      await Tecnico.findOne({carnet: carnet}).then(async(tecData) => {
        if (tecData !== null) {
          if(String(tecData._id) === String(Empleado._id)) {
            respuesta.title = '¿Quieres darte material a ti mismo?';
          } else {
            await Almacen.findOne({tecnico: tecData._id}).then((almTecnico) => {
              if (almTecnico !== null) {
                respuesta = {
                  title: 'Busqueda correcta.',
                  status: 'success',
                  dato: '',
                  data: {
                    nombre: `${tecData.nombre} ${tecData.apellidos}`,
                    id: almTecnico._id
                  }
                }
              } else {
                respuesta.title = 'El técnico no tiene un almacen disponible.'
              }
            }).catch((error) => {//en en busqueda del almacen
              respuesta.title = 'Error buscando el almacen';
              logger.error({
                message: error.message,
                service: 'buscarAlmacenSecundario (Almacen.findOne)'
              })
            })
          }
        } else {
          respuesta.title = 'Técnico no encontrado.'
        }
      }).catch((error) => {//error buscando al tecnico
        respuesta.title = 'Error buscando el tecnico';
        logger.error({
          message: error.message,
          service: 'buscarAlmacenSecundario (Tecnico.findOne)'
        })
      })
    } catch (error) {
      respuesta.title = 'Metodo incorrecto';
      logger.error({
        message: error.message,
        service: 'buscarAlmacenSecundario (try/catch)'
      })
    }
  } else if (metodo === 'buscarAlmacenPrimario') {
    await Almacen.findOne({contrata: Empleado.contrata._id, tipo: 'IMP'}).then(almContrata => {
      if (almContrata) {
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          dato: '',
          data: {
            nombre: Empleado.contrata.nombre,
            id: almContrata._id
          }
        }
      } else {
        respuesta.title = 'Almacen Primario no encontrado.'
      }
    }).catch((error) => {
      logger.error({
        message: error.message,
        service: 'buscarAlmacenPrimario (findone)'
      }); 
      respuesta.title = 'Error buscando la contrata.'
    })
  } else if (metodo === 'obtenerIdsAlmacenes') {
    await Almacen.find({tipo: 'IMS', contrata: Empleado.contrata._id}).populate('tecnico').then((almacenes) => {
      respuesta = {
        title: 'Busqueda correcta.',
        status: 'success',
        dato: '',
        data: almacenes.length > 0 ? almacenes.map((e:any) => {
          return {
            _id: e._id,
            nombre: e.tecnico.nombre + ' ' + e.tecnico.apellidos
          }
        }):[]
      }
    }).catch((error) => {
      respuesta.title = error.message;
      logger.error({
        message: error.message,
        service: 'obtenerIdsAlmacenes'
      })
    })
  }

  return res.send(respuesta);
};

export const crearRegistro = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const metodo:string|any = req.headers.metodo ? req.headers.metodo : null;

  let status = 404
  let respuesta = {title: 'Acceso Incorrecto', status: 'error', data: [] as Array<any>}
  if (metodo === 'trasladoInventario') {
    try {
      const { tecnicoSalida, tecnicoEntrada, dataOrden, fechaLote, descripcionTraslado } = req.body;
      const descripcionAlterna = `traslado de lote de ${dataOrden.length} materiales.`;
      await SalidaAlmacen(dataOrden, tecnicoSalida, tecnicoEntrada).then(async(data) => {
        const operacionesFallidas =  data.filter((item) => item.status === false);

        const nuevoAlbaran = new Albaran({
          tipo: 'traslado',
          estado_registro: 'pendiente',
          lote: data,
          estado_operacion: operacionesFallidas.length > 0 ? 'error' : 'success',
          almacen_salida: tecnicoSalida,
          almacen_entrada: tecnicoEntrada,
          usuario_entrega: Empleado._id,
          observacion_salida: descripcionTraslado ? descripcionTraslado : descripcionAlterna,
          fecha_salida: fechaLote
        });

        const titulo = operacionesFallidas.length > 0 ? 
          `Se encontrarón ${data.length} materiales, ${operacionesFallidas.length} no se almacenaron correctamente.` 
          : 
          `Se registró correctamente el traslado de ${data.length} materiales.`;

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
          service: 'SalidaAlmacen(trasladoInventario)'
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
        service: 'trasladoInventario (try/catch)'
      });
      respuesta.title = 'Error en la función para crear el traslado (try/catch).'
    }
  } else if (metodo === 'equiposBaja') {
    try {
      const { dataEquipos, descripcion } = req.body;
      status = 200;
      let errores = 0;
      if (dataEquipos.length > 0) {
        await Promise.all(dataEquipos.map(async(item:any) => {
          const nuevoEquipoBaja = new EquipoBaja({
            serie: item.serie,
            material: item.id_material,
            estado: 'traslado',
            orden: item.id_orden,
            tecnico: item.id_tecnico,
            contrata: Empleado.contrata._id,
            usuario_entrega: Empleado._id,
            observacion_entrega: descripcion ? descripcion : `Equipo de baja - ${item.serie}`
          });
          await nuevoEquipoBaja.save().catch((error) => {
            ++errores;
            logger.error({
              message: error.message,
              service: `Error guardando equipo de baja - ${item.serie}`
            });
          });
        })).then(() => {
          respuesta.title = "Equipos enviados correctamente.";
          respuesta.status = "success";
        }).catch(() => {
          respuesta.title = `(${errores}) Errores enviando los equipos.`
        })
      } else {
        respuesta.title = "No se encontró equipos."
      }
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'equiposBaja (try/catch)'
      });
      respuesta.title = 'Error enviando los equipos de baja. (try/catch).'
    }
  }
  return res.status(status).send(respuesta);
};

export const editarRegistro = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const metodo:string|any = req.headers.metodo ? req.headers.metodo : null;

  let status = 404
  let respuesta = {title: 'Acceso Incorrecto', status: 'error', data: [] as Array<any>}
  if (metodo === 'actualizarEquiposBaja') {
    try {
      status = 200;
      const { id, serie, estado, descripcion } = req.body;
      const descripcionAlterna = estado === 'recibido' ? `se aceptó correctamente el quipo ${serie}.` : `se rechazó el quipo ${serie}.`;
      await EquipoBaja.findOneAndUpdate({_id: id}, {
        estado: estado,
        usuario_aprueba: Empleado._id,
        observacion_aprueba: descripcion ? descripcion : descripcionAlterna
      }).then(() => {
        respuesta.title = "Equipo actualizado correctamente.";
        respuesta.status = "success";
      }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'actualizarEquiposBaja'
        });
      });
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'actualizarEquiposBaja (try/catch)'
      });
      respuesta.title = 'Error en la función para crear el actualizarEquiposBaja (try/catch).'
    }
  }
  return res.status(status).send(respuesta);
};

export const eliminarMaterial = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const metodo:string|any = req.headers.metodo ? req.headers.metodo : null;

  let status = 404
  let respuesta = {title: 'Acceso Incorrecto', status: 'error'}
  
  if (metodo === 'eliminarEquipoBaja') {
    try {
      const idEquipo = req.headers.id;
      status = 200;
      await EquipoBaja.findByIdAndDelete({_id: idEquipo, contrata: Empleado.contrata._id}).then(() => {
        respuesta = {
          title: 'Equipo eliminado correctamente del registro.',
          status: 'success'
        };
      }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'eliminarEquipoBaja (try/catch)'
        });
        respuesta.title = 'No se pudo eliminar el equipo.'
      })
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'eliminarEquipoBaja (try/catch)'
      });
      respuesta.title = 'Error en la función para crear el eliminarEquipoBaja (try/catch).'
    }
  }
  return res.status(status).send(respuesta);
};