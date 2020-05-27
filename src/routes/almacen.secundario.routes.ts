import { Router } from 'express';

import { listarAlmacen } from '../controllers/almacen.secundario.controller';

const router:Router = Router();

router.get('/almacen-secundario', listarAlmacen)

export default router;