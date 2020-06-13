import Validator from 'validator'
import isEmpty from 'is-empty'
import Empleado from '../models/Empleado';
import logger from '../lib/logger';

interface IError {
  error?: string,
}

export default async function validarLoginTecnico(data: any) {
  let errors:IError = {};
  let usuarioObjeto:any = {}
  // Convert empty fields to an empty string so we can use validator functions
  data.carnet = !isEmpty(data.carnet) ? data.carnet : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  if (Validator.isEmpty(data.carnet)) {
    errors.error = "Se necesita el Carnet";
  } else if (data.carnet === '-') {
    errors.error = "Carnet no valido";
  } else if (Validator.isEmpty(data.password)) {
    // Password checks
    errors.error = "Se necesita la contraseña";
  } else {
    // carnet checks
    await Empleado.findOne({ carnet: data.carnet }).then(async (usuario) => {
      usuarioObjeto = usuario;
      if (!usuario) {
        errors.error = "El carnet no existe."
      } else {
        if (!usuario.usuario.estado) {
          errors.error = "Usuario inactivo. Porfavor contacta al administrador."
        } else {
          const isMatch = await usuario.comparePassword(data.password);
          if (!isMatch) errors.error = "Contraseña incorrecta."
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
