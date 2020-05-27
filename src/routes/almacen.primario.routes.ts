import { Router } from 'express';
import { listarAlmacen, crearRegistro } from '../controllers/almacen.primario.controller';

const router:Router = Router();

router.get('/almacen-primario', listarAlmacen)
      .post('/almacen-primario', crearRegistro);

export default router;