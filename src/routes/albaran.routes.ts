import { Router } from 'express';

import { listarRegistro, actualizarRegistro, registroTecnico } from '../controllers/albaran.controller';

const router:Router = Router();

router.get('/albaran', listarRegistro)
      .patch('/albaran', actualizarRegistro)
      .put('/albaran', registroTecnico)

export default router;