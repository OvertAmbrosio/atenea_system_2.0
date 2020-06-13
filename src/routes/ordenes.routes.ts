import { Router } from 'express';

const router:Router = Router();

import { listarOrden, guardarOrden, actualizarOrden, editarOrden } from '../controllers/ordenes.controller';

router.get('', listarOrden)
      .post('', guardarOrden)
      .patch('', actualizarOrden)
      .put('', editarOrden)
      // .delete('', borrarContrata);

export default router;