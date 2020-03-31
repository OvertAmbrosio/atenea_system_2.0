import { Router } from 'express';

const router:Router = Router();

import { session, acceder, cerrarSesion, configuraciones } from '../controllers/auth.controller';

router.get('/session', session);
router.post('/acceder', acceder);
router.patch('/cerrarSesion', cerrarSesion);
router.patch('/configuraciones', configuraciones);


export default router;