import { Request, Response } from 'express';

import { IEmpleado } from '../models/Empleado';
import Albaran from '../models/Albaran';
import Almacen from '../models/Almacen';
import Equipo from '../models/Equipo';
import EntradaAlmacen from '../lib/Logistica/EntradaAlmacen';
import SalidaAlmacen from '../lib/Logistica/SalidaAlmacen';
import logger from '../lib/logger';
import { Error } from 'mongoose';

const nivelAdmin = [1,3];
const nivelLogistica = [1,3,5];

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

export const listarAlmacen = async (req: Request, res: Response): Promise<Response> => {
  
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario = Empleado.usuario.tipo;
  const metodo = req.headers.metodo;

  let status = 404
  let respuesta = {title: 'Acceso Incorrecto', status: 'error', data: {}, dato: ''}

  if (metodo === 'obtenerIdAlmacen') {
    if (nivelAdmin.includes(nivelUsuario)) {
      await Almacen.findOne({tipo: 'IMC'}).then( async(data) => {
        if (data) {
          status = 200;
          respuesta = {title: 'Busqueda correcta.', status: 'success', data:{},  dato: data._id}
        } else {
          const nuevoAlmacenCentral = new Almacen({
            tipo: 'IMC',
            ferreteria: []
          });
          await nuevoAlmacenCentral.save().then((nuevo) => {
            status = 200;
            respuesta = {title: 'Se creó el almacen central.', status: 'success', data:{},  dato: nuevo._id}
          }).catch((error: Error) => {
            status = 200;
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
    if (nivelAdmin.includes(nivelUsuario)) {
      await Almacen.findOne({tipo: 'IMC'}).populate('ferreteria.material').then(async(almacen) => {
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
              status = 200;
              respuesta = {
                title: 'Busqueda correcta.',
                status: 'success',
                data: {ferreteria:almacen.ferreteria, equipos: equiposAlmacen},
                dato: ''
              };
            });
          })
        } else {
          status = 200;
          respuesta = {
            title: 'Busqueda correcta.',
            status: 'success',
            data: { ferreteria: almacen, equipos: equiposAlmacen },
            dato: ''
          };
        }
      }).catch((error) => {
        respuesta.title = 'Error en la busqueda del almacen.'
        logger.error({
          message: error.message,
          service: 'Almacen findOne'
        })
      })
    }
  } else if (metodo === 'obtenerAlmacenes') {
    if (nivelAdmin.includes(nivelUsuario)) {
      let grupoAlmacen = {contratas: [] as Array<any>, almacenes: [] as Array<any>};
      await Almacen.find({tipo: 'IMP'}).populate('contrata').populate('ferreteria.material').then(async(almacenes) => {
        return Promise.all(
          //recorrer los almacenes para ubicar los equipos
          almacenes.map(async(alm:any) => {
            //guardar el nombre de la contrata
            grupoAlmacen.contratas.push(alm.contrata.nombre);
            //crear el objeto a guardar en el array de almacenes
            let nuevoAlmacen = {
              contrata: alm.contrata && alm.contrata.nombre,
              ferreteria: alm.ferreteria,
              equipos: [] as Array<IEquiposAlmacen>
            } 
            //buscar los equipos con el id del almacen
            return await Equipo.find({
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
        status = 200
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

  return res.status(status).send(respuesta);
};

export const configurarAlmacen = async (req: Request, res: Response): Promise<Response> => {
  // const Empleado: IEmpleado|any = req.user;
  // const nivelUsuario = Empleado.usuario.tipo;
  const metodo = req.headers.metodo;

  let status = 404
  let respuesta = {title: 'Acceso Incorrecto', status: 'error', data: [] as Array<any>}

  if (metodo === 'comprobarSeries') {
    status = 200 
    const series = req.body;
    if (series.length > 0) {
      await Equipo.find({_id: { $in: series}}).select('_id').then((data) => {
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          data: data
        };
      }).catch((error: Error) => {
        status = 400;
        logger.error({
          message: error.message,
          service: 'Error comprobando las series.'
        });
        respuesta.title = "Error comprobando las series."
      })
    } else {
      respuesta.title = "No se encontraron series en la petición."
    }
  }
  return res.status(status).send(respuesta);
};

export const crearRegistro = async (req: Request, res: Response): Promise<Response> => {
  const Empleado: IEmpleado|any = req.user;
  const nivelUsuario:number = Empleado.usuario.tipo;
  const metodo:string|any = req.headers.metodo ? req.headers.metodo : null;

  let status = 404
  let respuesta = {title: 'Acceso Incorrecto', status: 'error', data: [] as Array<any>}

  if (metodo === 'crearEntrada') {
    if (nivelAdmin.includes(nivelUsuario)) {
      try {
        const { idAlmacen, dataOrden, fechaLote, descripcionEntrada } = req.body;
        const descripcionAlterna = `Entrada de lote de ${dataOrden.length} materiales.`;
        
        await EntradaAlmacen(dataOrden, idAlmacen).then(async(data) => {
          const operacionesFallidas =  data.filter((item) => item.status === false);
          
          const nuevoAlbaran = new Albaran({
            tipo: 'entrada',
            lote: data,
            estado_operacion: operacionesFallidas.length > 0 ? 'error' : 'success',
            almacen_entrada: idAlmacen,
            usuario_entrega: Empleado._id,
            observacion_entrada: descripcionEntrada ? descripcionEntrada : descripcionAlterna,
            fecha_entrega: fechaLote
          });

          const titulo = operacionesFallidas.length > 0 ? 
            `Se encontrarón ${data.length} materiales, ${operacionesFallidas.length} no se guardó correctamente.` 
            : 
            `Se guardó correctamente la entrada de ${data.length} materiales.`

          await nuevoAlbaran.save().then(() => {
            status = 200;
            respuesta = {
              title: titulo,
              status: operacionesFallidas.length !== 0 ? 'warning' : 'success',
              data: []
            };
          }).catch((error) => {
            logger.error({
              message: error.message,
              service: 'NuevoAlbaran.save'
            });
            status = 200;
            respuesta = {
              title: 'Error guardando la orden de entrada.',
              status: 'warning',
              data: []
            };
          })
        //error de EntradaAlmacen
        }).catch((error) => {
          logger.error({
            message: error.message,
            service: 'EntradaAlmacen'
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
          service: 'CrearEntrada (try/catch)'
        });
        respuesta.title = 'Error en la función para crear entrada (try/catch).'
      };
    };
  } else if (metodo === 'crearSalida') {
    if (nivelAdmin.includes(nivelUsuario)) {
      try {
        const { idAlmacen, almacenContrata, dataOrden, fechaLote, descripcionEntrada } = req.body;
        const descripcionAlterna = `Salida de lote de ${dataOrden.length} materiales.`;
        await SalidaAlmacen(dataOrden, idAlmacen, almacenContrata).then(async(data) => {
          const operacionesFallidas =  data.filter((item) => item.status === false);

          const nuevoAlbaran = new Albaran({
            tipo: 'salida',
            estado_registro: 'pendiente',
            lote: data,
            estado_operacion: operacionesFallidas.length > 0 ? 'error' : 'success',
            almacen_salida: idAlmacen,
            almacen_entrada: almacenContrata,
            usuario_entrega: Empleado._id,
            observacion_salida: descripcionEntrada ? descripcionEntrada : descripcionAlterna,
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
  }

  return res.status(status).send(respuesta);
}