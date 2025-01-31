import { IOEquipo } from "../models/Equipo";
import logger from "./logger";

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

export default async function OrganizarEquiposTecnicos(equipos:IOEquipo[], almacen_tecnico: any): Promise<IEquiposAlmacen[]> {
  //crear objeto nuevoEquipo 
  let equiposTecnico: IEquiposAlmacen[] = [];
  //recorrer cada equipo para 
  const LlenarEquipos = equipos.map(equipo => {
    try {
      //buscar si el equipo se encuentra en equipoTecnico
      const busqueda = equiposTecnico.filter(e => e.material.nombre === equipo.material.nombre);
      const index = equiposTecnico.findIndex(e => e.material.nombre === equipo.material.nombre);
      //si hay resultados en la 'busqueda' hacer push y agregar los equipos, de lo contrario crearlo
      if (busqueda.length !== 0) {//si hay
        //llenar los array
        if (equipo.estado === 'traslado' && String(equipo.almacen_salida._id) === String(almacen_tecnico._id)) {
          busqueda[0].salida.push(equipo);
        } else if (String(equipo.almacen_entrada._id) === String(almacen_tecnico._id)){
          if (equipo.estado === 'contable') {
            busqueda[0].contable.push(equipo);
          } else if (equipo.estado === 'traslado') {
            busqueda[0].entrada.push(equipo);
          }
        };
        return equiposTecnico[index] = busqueda[0];
      } else {//no hay
        //crear objeto a enviar
        let nuevoEquipoTecnico = {
          material: equipo.material,
          entrada: [] as Array<IOEquipo>,
          contable: [] as Array<IOEquipo>,
          salida: [] as Array<IOEquipo>
        };
        //llenar los array
        if (equipo.almacen_entrada === null && String(equipo.almacen_salida._id) === String(almacen_tecnico._id)) {
          nuevoEquipoTecnico.salida.push(equipo);
        } else if (String(equipo.almacen_entrada._id) === String(almacen_tecnico._id)){
          if (equipo.estado === 'contable') {
            nuevoEquipoTecnico.contable.push(equipo);
          } else if (equipo.estado === 'traslado') {
            nuevoEquipoTecnico.entrada.push(equipo);
          }
        };
        //agregar el nuevo objeto al principal
        return equiposTecnico.push(nuevoEquipoTecnico);
      }
    } catch (error) {
      return error;
    }
  })
  
  return new Promise((resolve, reject) => {
    try {
      if (equipos.length !== 0) {
        return Promise.all(LlenarEquipos)
          .then(() => resolve(equiposTecnico))
          .catch((error) => {
            return reject(error)
          })
      } else {
        return resolve([])
      }
    } catch (error) {
      logger.error({
        message: error,
        service: 'Error organizando equipos'
      });
      return reject(error.message);
    }
  });
  
}