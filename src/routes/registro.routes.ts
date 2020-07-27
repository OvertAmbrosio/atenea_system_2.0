import { Router } from 'express';

const router:Router = Router();

import { listarRegistros } from '../controllers/registro.controller';

router.get('', listarRegistros);

export default router;