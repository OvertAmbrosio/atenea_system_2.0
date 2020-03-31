import Validator from 'validator'
import isEmpty from 'is-empty'
import Empleado, { IEmpleado } from '../models/Empleado';
import { IUsuario } from '../models/Usuario';
import logger from '../lib/logger';

interface IError {
  email?: string,
  password?: string,
}

export default async function validarLoginInput(data: IUsuario) {
  let errors:IError = {};
  let usuarioObjeto:any = {}
  // Convert empty fields to an empty string so we can use validator functions
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  if (Validator.isEmpty(data.email)) {
    errors.email = "Se necesita el Correo";
  } else if (!Validator.isEmail(data.email)) {
    errors.email = "Correo inválido";
  } else if (Validator.isEmpty(data.password)) {
    // Password checks
    errors.password = "Se necesita la contraseña";
  } else {
    // Email checks
    await Empleado.findOne({ 'usuario.email': data.email }).then(async (usuario) => {
      usuarioObjeto = usuario;
      if (!usuario) {
        errors.email = "El correo no existe."
      } else {
        if (!usuario.usuario.estado) {
          errors.email = "Usuario inactivo. Porfavor contacta al administrador."
        } else {
          const isMatch = await usuario.comparePassword(data.password);
          if (!isMatch) errors.password = "Contraseña incorrecta."
        }
      };
    }).catch((error) => {
      logger.error('Error buscando el usuario en la validacion de accesos')
      logger.error(error.message);
    });
  };

  return {
    errors,
    isValid: isEmpty(errors),
    usuarioObjeto
  };
};
