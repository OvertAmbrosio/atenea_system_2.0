import { Router } from 'express';

const router:Router = Router();

import { 
  listarMateriales,
  crearMaterial,
  editarMaterial,
  eliminarMaterial
} from '../controllers/material.controller';

router.get('', listarMateriales)
      .post('', crearMaterial)
      .put('', editarMaterial)
      .delete('', eliminarMaterial);

export default router;