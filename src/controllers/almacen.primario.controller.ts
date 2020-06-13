import { Request, Response } from 'express';

import { IEmpleado } from '../models/Empleado';
import Almacen from '../models/Almacen';
import Albaran from '../models/Albaran';
import Equipo from '../models/Equipo';
import SalidaAlmacen from '../lib/Logistica/SalidaAlmacen';
import logger from '../lib/logger';

const nivelAdmin = [1,3,5];
const nivelJefes = [1,3,5,6]
const nivelLogistica = [1,3,5,6,8];

interface IEquiposAlmacen {
  material: {
    nombre: string,
    tipo: string,
    medida: string,
    seriado: boolean
  },
  entrada: Array<string>,
  contable: Array<String>,
  salida: Array<String>
}

export const listarAlmacen = async (req: Request, res: Response):Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;
  const metodo = req.headers.metodo;

  let respuesta = { title: 'Acceso denegado.', status: 'error', dato: '', data: {}};

  if (metodo === 'comprobarContrata') {
    if (nivelAdmin.includes(nivelUsuario)) {
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
      await Almacen.findOne({contrata: Empleado.contrata}).then( async(data) => {
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
      await Almacen.findOne({contrata: Empleado.contrata}).populate('ferreteria.material').then(async(almacen) => {
        const equiposAlmacen = new Array;
        if (almacen) {
          await Equipo.find({$or: [{almacen_entrada: almacen._id}, {almacen_salida: almacen._id}]}).populate('material').then(async(equipos) => {
            const materiales = [] as Array<any>;
            const ObtenerMateriales = equipos.map((item:any) => {
              if (!materiales.some(material => material.nombre === item.material.nombre)) {
                return materiales.push({_id: item.material._id ,nombre:item.material.nombre, tipo:item.material.tipo})
              }
            });

            const CrearObjeto = materiales.map((item) => {
              let objeto = {
                material: {
                  id: item._id,
                  nombre: item.nombre,
                  tipo: item.tipo,
                  seriado: true,
                  medida: 'UNIDAD',
                },      
                entrada: [] as Array<string>,
                contable: [] as Array<string>,
                salida: [] as Array<string>,
              };
              const nuevoObjeto = equipos.map((itemDos:any) => {
                if (objeto.material.nombre === itemDos.material.nombre) {
                  if (itemDos.estado === 'contable' && String(itemDos.almacen_entrada) === String(almacen._id)) {
                    return objeto.contable.push(itemDos._id);
                  } else if (itemDos.estado === 'traslado' && String(itemDos.almacen_salida) === String(almacen._id)) {
                    return objeto.salida.push(itemDos._id);
                  } else if (itemDos.estado === 'traslado' && String(itemDos.almacen_entrada) === String(almacen._id)) {
                    return objeto.entrada.push(itemDos._id);
                  }
                }
              });
              Promise.all(nuevoObjeto).then(() => equiposAlmacen.push(objeto));
            });

            Promise.all([ObtenerMateriales, CrearObjeto]).then(() => {
              respuesta = {
                title: 'Busqueda correcta.',
                status: 'success',
                data: {ferreteria:almacen.ferreteria, equipos: equiposAlmacen},
                dato: ''
              };
            });
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
      await Almacen.find({tipo: 'IMS'}).populate('tecnico').populate('ferreteria.material').then(async(almacenes) => {
        return Promise.all(
          //recorrer los almacenes para ubicar los equipos
          almacenes.map(async(alm:any) => {
            //guardar el nombre de la contrata
            if(String(alm.tecnico.contrata) === String(Empleado.contrata._id)) grupoAlmacen.tecnicos.push(alm.tecnico.nombre + ' ' + alm.tecnico.apellidos);
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
            }).populate('material').then( async(listaEquipos) => {
              //comprobar que no este vacio
              if (listaEquipos.length !== 0) {
                //crear objeto nuevoEquipo 
                let nuevoEquipo: IEquiposAlmacen = {
                  material: {
                    nombre: '',
                    tipo: '',
                    medida: '',
                    seriado: true
                  },
                  entrada: [] as Array<string>,
                  contable: [] as Array<string>,
                  salida: [] as Array<string>
                };
                //recorrer cada equipo para llenar el array de equipos
                listaEquipos.forEach((item:any) => {
                  //asignar los nombres
                  nuevoEquipo.material.nombre = item.material.nombre;
                  nuevoEquipo.material.tipo = item.material.tipo;
                  nuevoEquipo.material.medida = item.material.medida;
                  //llenar los array
                  if (String(item.almacen_entrada) === String(alm._id)) {
                    if (item.estado === 'contable') {
                      return nuevoEquipo.contable.push(item._id);
                    } else if (item.estado === 'traslado') {
                      return nuevoEquipo.entrada.push(item._id);
                    }
                  } else {
                    return nuevoEquipo.salida.push(item._id);
                  };
                });
                //agregar el nuevoEquipo al nuevoAlmacen
                return nuevoAlmacen.equipos.push(nuevoEquipo);
              }
            }).then(() => grupoAlmacen.almacenes.push(nuevoAlmacen)).catch((error) => {
              logger.error({
                message: error.message,
                service: 'obtenerAlmacenes(equipos.find)'
              })
            })
          })
        ).then(() => grupoAlmacen);
      }).then((a) => {
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
    if (nivelAdmin.includes(nivelUsuario)) {
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
    if (nivelJefes.includes(nivelUsuario)) {
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