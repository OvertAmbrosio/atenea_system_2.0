import { Router } from 'express';

import { listarRegistro, actualizarRegistro } from '../controllers/albaran.controller';

const router:Router = Router();

router.get('/albaran', listarRegistro)
      .patch('/albaran', actualizarRegistro)

export default router;