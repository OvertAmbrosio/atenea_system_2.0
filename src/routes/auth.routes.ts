import { Router } from 'express';
const router = Router();

import { registrar, acceder } from '../controllers/usuario.controller';

router.post('/registrar', registrar);
router.post('/acceder', acceder);


export default router;