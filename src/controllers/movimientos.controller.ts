import { Request, Response } from 'express';
import Movimiento from '../models/Movimiento';
import moment from 'moment';
import logger from '../lib/logger';

export const listarMovimientos = async (req: Request, res: Response): Promise<Response> => {

  const metodo = String(req.headers.metodo);
  let respuesta = {title: 'Acceso incorrecto.', status: 'error', data: [] as Array<any>}

  if (metodo === '') {
    try {
      const fechaInicio = req.headers.fechainicio;
      const fechaFin = req.headers.fechafin;
      
      await Movimiento.find({createdAt: { 
        $gte: moment(fechaInicio).format('YYYY-MM-DD HH:mm') , 
        $lte: moment(fechaFin).format('YYYY-MM-DD HH:mm') }  
      }).populate({
        path: 'almacen',
        select: 'contrata tecnico tipo',
        populate: [
          {
            path: 'contrata',
            select: 'nombre'
          },
          {
            path: 'tecnico',
            select: 'nombre apellidos'
          }
        ]
      }).populate({
        path: 'material',
        select: 'nombre'
      }).then((listaMovimientos) => {
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          data: listaMovimientos
        };
      }).catch((error) => {
        respuesta.title = error.message
        logger.error({
          message: error.message,
          service: 'Movimientos(metodo vacio)'
        })
      })
    } catch (error) {
      respuesta.title = error.message
      logger.error({
        message: error.message,
        service: 'Movimientos(metodo vacio try/catch)'
      })
    }
  } else if (metodo === 'busquedaAlmacen') {
    try {
      const fechaInicio = req.headers.fechainicio;
      const fechaFin = req.headers.fechafin;
      const busqueda = String(req.headers.busqueda);

      await Movimiento.find({almacen: busqueda, createdAt: { 
        $gte: moment(fechaInicio).format('YYYY-MM-DD HH:mm') , 
        $lte: moment(fechaFin).format('YYYY-MM-DD HH:mm') }  
      }).populate({
        path: 'almacen',
        select: 'contrata tecnico tipo',
        populate: [
          {
            path: 'contrata',
            select: 'nombre'
          },
          {
            path: 'tecnico',
            select: 'nombre apellidos'
          }
        ]
      }).populate({
        path: 'material',
        select: 'nombre'
      }).then((listaMovimientos) => {
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          data: listaMovimientos
        };
      }).catch((error) => {
        respuesta.title = error.message
        logger.error({
          message: error.message,
          service: 'busquedaAlmacen'
        })
      })
    } catch (error) {
      respuesta.title = error.message
      logger.error({
        message: error.message,
        service: 'busquedaAlmacen(metodo vacio try/catch)'
      })
    }
  } else if (metodo === 'busquedaMaterial') {
    try {
      const fechaInicio = req.headers.fechainicio;
      const fechaFin = req.headers.fechafin;
      const busqueda = String(req.headers.busqueda);
      
      await Movimiento.find({material: busqueda, createdAt: { 
        $gte: moment(fechaInicio).format('YYYY-MM-DD HH:mm') , 
        $lte: moment(fechaFin).format('YYYY-MM-DD HH:mm') }  
      }).populate({
        path: 'almacen',
        select: 'contrata tecnico tipo',
        populate: [
          {
            path: 'contrata',
            select: 'nombre'
          },
          {
            path: 'tecnico',
            select: 'nombre apellidos'
          }
        ]
      }).populate({
        path: 'material',
        select: 'nombre'
      }).then((listaMovimientos) => {
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          data: listaMovimientos
        };
      }).catch((error) => {
        respuesta.title = error.message
        logger.error({
          message: error.message,
          service: 'busquedaMaterial'
        })
      })
    } catch (error) {
      respuesta.title = error.message
      logger.error({
        message: error.message,
        service: 'busquedaMaterial(metodo vacio try/catch)'
      })
    }
  }

  return res.send(respuesta);

};