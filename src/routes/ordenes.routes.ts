import { Router } from 'express';

const router:Router = Router();

import { guardarOrden, actualizarOrden } from '../controllers/ordenes.controller';

// router.get('', listarContratas)
router      .post('', guardarOrden)
            .patch('', actualizarOrden)
      // .put('', actualizarContrata)
      // .delete('', borrarContrata);

export default router;