import { IOrden } from '../models/Orden';

export default async function obtenerFiltros (tipo:string|any, data:Array<IOrden>) {
  switch (tipo) {
    case 'averiashfc':
      return new Promise(async(resolve, reject) => {
        let contratas:Array<string>|any = [];
        let estados:Array<string>|any = [];
        let segmentos:Array<string>|any = [];
        let distritos:Array<string>|any = [];
        let zonal:Array<string>|any = [];
        let nodo:Array<string>|any = [];
        
        let filtroContrata:Array<Object> = [];
        let filtroEstado:Array<Object> = [];
        let filtroSegmento:Array<Object> = [];
        let filtroDistrito:Array<Object> = [];
        let filtroZonal:Array<Object> = [];
        let filtroNodo:Array<Object> = [];
  
        await data.map((d) => {
          if(!contratas.includes(d.contrata_asignada?.nombre_contrata)) {
            contratas.push(d.contrata_asignada?.nombre_contrata);
            filtroContrata.push({text: d.contrata_asignada?.nombre_contrata, value: d.contrata_asignada?.nombre_contrata});
          }
          if(!estados.includes(d.contrata_asignada?.estado)) {
            estados.push(d.contrata_asignada?.estado);
            filtroEstado.push({text: d.contrata_asignada?.estado, value: d.contrata_asignada?.estado});
          }
          if(!segmentos.includes(d.codigo_segmento)) {
            segmentos.push(d.codigo_segmento);
            filtroSegmento.push({text: d.codigo_segmento, value: d.codigo_segmento});
          }
          if(!distritos.includes(d.distrito)) {
            distritos.push(d.distrito);
            filtroDistrito.push({text: d.distrito, value: d.distrito});
          }
          if (!zonal.includes(d.hfc_detalle.codigo_zonal)) {
            zonal.push(d.hfc_detalle.codigo_zonal);
            filtroZonal.push({text: d.hfc_detalle.codigo_zonal, value: d.hfc_detalle.codigo_zonal});
          }
          if (!nodo.includes(d.hfc_detalle.codigo_nodo)) {
            nodo.push(d.hfc_detalle.codigo_nodo);
            filtroNodo.push({text: d.hfc_detalle.codigo_nodo, value: d.hfc_detalle.codigo_nodo});
          }
        });
        resolve({filtroContrata, filtroEstado, filtroSegmento, filtroDistrito, filtroZonal, filtroNodo})
      });
    case 'altashfc':
      return new Promise(async(resolve, reject) => {
        let contratas:Array<string>|any = [];
        let estados:Array<string>|any = [];
        let segmentos:Array<string>|any = [];
        let distritos:Array<string>|any = [];
        let nodo:Array<string>|any = [];
        
        let filtroContrata:Array<Object> = [];
        let filtroEstado:Array<Object> = [];
        let filtroSegmento:Array<Object> = [];
        let filtroDistrito:Array<Object> = [];
        let filtroNodo:Array<Object> = [];
  
        await data.map((d) => {
          if(!contratas.includes(d.contrata_asignada?.nombre_contrata)) {
            contratas.push(d.contrata_asignada?.nombre_contrata);
            filtroContrata.push({text: d.contrata_asignada?.nombre_contrata, value: d.contrata_asignada?.nombre_contrata});
          }
          if(!estados.includes(d.contrata_asignada?.estado)) {
            estados.push(d.contrata_asignada?.estado);
            filtroEstado.push({text: d.contrata_asignada?.estado, value: d.contrata_asignada?.estado});
          }
          if(!segmentos.includes(d.codigo_segmento)) {
            segmentos.push(d.codigo_segmento);
            filtroSegmento.push({text: d.codigo_segmento, value: d.codigo_segmento});
          }
          if(!distritos.includes(d.distrito)) {
            distritos.push(d.distrito);
            filtroDistrito.push({text: d.distrito, value: d.distrito});
          }
          if (!nodo.includes(d.hfc_detalle.codigo_nodo)) {
            nodo.push(d.hfc_detalle.codigo_nodo);
            filtroNodo.push({text: d.hfc_detalle.codigo_nodo, value: d.hfc_detalle.codigo_nodo});
          }
        });
        resolve({filtroContrata, filtroEstado, filtroSegmento, filtroDistrito, filtroNodo})
      });
    case 'basicas':
      return new Promise(async(resolve, reject) => {
        let contratas:Array<string>|any = [];
        let estados:Array<string>|any = [];
        let segmentos:Array<string>|any = [];
        let distritos:Array<string>|any = [];
        let mdfs:Array<string>|any = [];
        let armarios:Array<string>|any = [];
        
        let filtroContrata:Array<Object> = [];
        let filtroEstado:Array<Object> = [];
        let filtroSegmento:Array<Object> = [];
        let filtroDistrito:Array<Object> = [];
        let filtroMdf:Array<Object> = [];
        let filtroArmario:Array<Object> = [];
  
        await data.map((d) => {
          if(!contratas.includes(d.contrata_asignada?.nombre_contrata)) {
            contratas.push(d.contrata_asignada?.nombre_contrata);
            filtroContrata.push({text: d.contrata_asignada?.nombre_contrata, value: d.contrata_asignada?.nombre_contrata});
          }
          if(!estados.includes(d.contrata_asignada?.estado)) {
            estados.push(d.contrata_asignada?.estado);
            filtroEstado.push({text: d.contrata_asignada?.estado, value: d.contrata_asignada?.estado});
          }
          if(!segmentos.includes(d.cobre_detalle.detalle_segmento)) {
            segmentos.push(d.cobre_detalle.detalle_segmento);
            filtroSegmento.push({text: d.cobre_detalle.detalle_segmento, value: d.cobre_detalle.detalle_segmento});
          }
          if(!distritos.includes(d.distrito)) {
            distritos.push(d.distrito);
            filtroDistrito.push({text: d.distrito, value: d.distrito});
          }
          if (!armarios.includes(d.cobre_detalle.codigo_armario)) {
            armarios.push(d.cobre_detalle.codigo_armario);
            filtroArmario.push({text: d.cobre_detalle.codigo_armario, value: d.cobre_detalle.codigo_armario});
          }
          if (!mdfs.includes(d.cobre_detalle.codigo_mdf)) {
            mdfs.push(d.cobre_detalle.codigo_mdf);
            filtroMdf.push({text: d.cobre_detalle.codigo_mdf, value: d.cobre_detalle.codigo_mdf});
          }
        });
        resolve({filtroContrata, filtroEstado, filtroSegmento, filtroDistrito, filtroArmario, filtroMdf})
      });
    case 'speedy':
      return new Promise(async(resolve, reject) => {
        let contratas:Array<string>|any = [];
        let estados:Array<string>|any = [];
        let segmentos:Array<string>|any = [];
        let mdfs:Array<string>|any = [];
        let armarios:Array<string>|any = [];
        let dslam: Array<string>|any = [];
        
        let filtroContrata:Array<Object> = [];
        let filtroEstado:Array<Object> = [];
        let filtroSegmento:Array<Object> = [];
        let filtroMdf:Array<Object> = [];
        let filtroArmario:Array<Object> = [];
        let filtroDslam:Array<Object> = [];
  
        await data.map((d) => {
          if(!contratas.includes(d.contrata_asignada?.nombre_contrata)) {
            contratas.push(d.contrata_asignada?.nombre_contrata);
            filtroContrata.push({text: d.contrata_asignada?.nombre_contrata, value: d.contrata_asignada?.nombre_contrata});
          }
          if(!estados.includes(d.contrata_asignada?.estado)) {
            estados.push(d.contrata_asignada?.estado);
            filtroEstado.push({text: d.contrata_asignada?.estado, value: d.contrata_asignada?.estado});
          }
          if(!segmentos.includes(d.cobre_detalle.detalle_segmento)) {
            segmentos.push(d.cobre_detalle.detalle_segmento);
            filtroSegmento.push({text: d.cobre_detalle.detalle_segmento, value: d.cobre_detalle.detalle_segmento});
          }
          if (!armarios.includes(d.cobre_detalle.codigo_armario)) {
            armarios.push(d.cobre_detalle.codigo_armario);
            filtroArmario.push({text: d.cobre_detalle.codigo_armario, value: d.cobre_detalle.codigo_armario});
          }
          if (!mdfs.includes(d.cobre_detalle.codigo_mdf)) {
            mdfs.push(d.cobre_detalle.codigo_mdf);
            filtroMdf.push({text: d.cobre_detalle.codigo_mdf, value: d.cobre_detalle.codigo_mdf});
          }
          if (!dslam.includes(d.cobre_detalle.dslam)) {
            dslam.push(d.cobre_detalle.dslam);
            filtroDslam.push({text: d.cobre_detalle.dslam, value: d.cobre_detalle.dslam});
          }
        });
        filtroDslam = filtroDslam.sort(function (a:any, b:any) {
          if (a.text > b.text) {
            return 1;
          }
          if (b.text > a.text) {
            return -1;
          }
          return 0;
        });
        resolve({filtroContrata, filtroEstado, filtroSegmento, filtroArmario, filtroMdf, filtroDslam})
      })
    default:
      break;
  }

}