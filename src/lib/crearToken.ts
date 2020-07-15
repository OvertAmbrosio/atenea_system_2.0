import jwt from 'jsonwebtoken';
import config from '../config/config';

import { IEmpleado } from '../models/Empleado';

function createToken(empleado: IEmpleado, id: string) {
  const nombreC: string = (empleado.nombre).toLowerCase();
  return jwt.sign({
    id: empleado._id, 
    idSesion: id,
    email: empleado.usuario.email,
    nombre: nombreC ? (nombreC.charAt(0).toUpperCase() + nombreC.slice(1)): '', 
    apellidos: empleado.apellidos,
    cargo: empleado.cargo,
    imagen: empleado.usuario.imagen_perfil,
    tipo: empleado.usuario.tipo
  }, config.jwtSecret, {
    expiresIn: 57600
  });
};

export default createToken;