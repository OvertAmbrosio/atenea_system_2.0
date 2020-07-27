import { Request, Response } from 'express';
import moment from 'moment';

import logger from '../lib/logger';
import Registro from '../models/Registro';

export const listarRegistros = async (req: Request, res: Response):Promise<Response> => {

  const metodo = req.headers.metodo;
  let respuesta = { title: 'Acceso denegado.', status: 'error', dato: '', data: [] as Array<any>};

  if (metodo === 'buscarRegistroFechas') {
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
      }).populate('contrata', 'nombre').populate({
        path: 'orden',
        select: '-_id tipo'
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
        service: 'buscarRegistroFechas(try/catch)'
      });
      respuesta.title = 'Error obteniendo datos del cliente.'
    }
  } else if (metodo === 'buscarRegistroCodigo') {
    try {
      const { busqueda } = req.headers;
      await Registro.find({$or: [
        {codigo_requerimiento: busqueda},
        {'material_usado.material_seriado.serie': busqueda}
      ]}).populate({
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
      }).populate('contrata', 'nombre').populate({
        path: 'orden',
        select: '-_id tipo'
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
  } else if (metodo === 'liquidadasFechaContador') {
    try {
      const fechaInicio: string = String(req.headers.fechainicio);
      const fechaFin: string = String(req.headers.fechafin); 
      const contrata = req.headers.busqueda;

      let queryConsulta:any = {
        createdAt: { 
          $gte: moment(fechaInicio).format('YYYY-MM-DD HH:mm') , 
          $lte: moment(fechaFin).format('YYYY-MM-DD HH:mm') 
        }
      };

      if (contrata !== null || contrata !== undefined) queryConsulta['contrata'] = contrata;

      console.log(queryConsulta);

      await Registro.find(queryConsulta).populate({
        path: 'tecnico',
        select: 'nombre apellidos'
      }).populate({
        path: 'orden',
        select: 'tipo'
      }).select('codigo_requerimiento tecnico orden').then(registros => {
        let tecnicos = [] as Array<any>;
        if (registros.length > 0) {
          registros.map((e:any) => {
            if (!tecnicos.includes(e.tecnico.nombre + ' ' + e.tecnico.apellidos)) {
              tecnicos.push(e.tecnico.nombre + ' ' + e.tecnico.apellidos)
            }
          })
        }
        
        respuesta = {
          title: 'Busqueda correcta.',
          status: 'success',
          data: [tecnicos, registros],
          dato: ''
        };
      }).catch((error) => {
        logger.error({
          message: error.message,
          service: 'liquidadasFechaContador(find)'
        });
        respuesta.title = 'Error en la busqueda.'
      })
    } catch (error) {
      logger.error({
        message: error.message,
        service: 'liquidadasFechaContador(try/catch)'
      });
      respuesta.title = 'Error en la busqueda.'
    }
  }

  return res.send(respuesta)
}