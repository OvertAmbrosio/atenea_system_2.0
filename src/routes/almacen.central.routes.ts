import { Router } from 'express';

import { listarAlmacen, crearRegistro, configurarAlmacen } from '../controllers/almacen.central.controller';

const router:Router = Router();

router.get('/almacen-central', listarAlmacen)
      .post('/almacen-central', crearRegistro)
      .patch('/almacen-central', configurarAlmacen)
      
export default router;