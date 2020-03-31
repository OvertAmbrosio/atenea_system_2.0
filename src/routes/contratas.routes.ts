import { Router } from 'express';

const router:Router = Router();

import { listarContratas, crearContrata, actualizarContrata, borrarContrata } from '../controllers/contrata.controller';

router.get('', listarContratas)
      .post('', crearContrata)
      .put('', actualizarContrata)
      .delete('', borrarContrata);

export default router;