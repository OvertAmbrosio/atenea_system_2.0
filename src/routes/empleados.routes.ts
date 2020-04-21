import { Router } from 'express';

const router:Router = Router();

import { listarEmpleados, crearEmpleado, actualizarEmpleado, cambiarPassword } from '../controllers/empleados.controller';


router.get('', listarEmpleados)
      .post('', crearEmpleado)
      .put('', actualizarEmpleado)
      .patch('', cambiarPassword)

export default router;