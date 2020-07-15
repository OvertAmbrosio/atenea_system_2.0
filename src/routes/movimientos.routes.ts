import { Router } from 'express';

const router:Router = Router();

import { listarMovimientos } from '../controllers/movimientos.controller';

router.get('', listarMovimientos)

export default router;