import { Router } from 'express';

const router:Router = Router();

import { listarEmpleados, crearEmpleado, actualizarEmpleado } from '../controllers/empleados.controller';


router.get('', listarEmpleados)
      .post('', crearEmpleado)
      .put('', actualizarEmpleado)

export default router;