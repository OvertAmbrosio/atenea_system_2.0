import { Router } from 'express';

const router:Router = Router();

import { listarOrden, guardarOrden, actualizarOrden } from '../controllers/ordenes.controller';

router.get('', listarOrden)
      .post('', guardarOrden)
      .patch('', actualizarOrden)
      // .put('', actualizarContrata)
      // .delete('', borrarContrata);

export default router;