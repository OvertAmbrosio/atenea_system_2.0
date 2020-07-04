import { Router } from 'express';

const router:Router = Router();

import { listarOrden, ordenDetalle, guardarOrden, actualizarOrden, editarOrden } from '../controllers/ordenes.controller';

router.get('', listarOrden)
      .get('/detalle', ordenDetalle)
      .post('', guardarOrden)
      .patch('', actualizarOrden)
      .put('', editarOrden)
      // .delete('', borrarContrata);

export default router;