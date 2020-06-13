import { Router } from 'express';

import { listarAlmacen, crearRegistro, editarRegistro, eliminarMaterial } from '../controllers/almacen.secundario.controller';

const router:Router = Router();

router.get('/almacen-secundario', listarAlmacen)
      .post('/almacen-secundario', crearRegistro)
      .patch('/almacen-secundario', editarRegistro)
      .delete('/almacen-secundario', eliminarMaterial)

export default router;