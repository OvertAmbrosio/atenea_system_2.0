import Validator from 'validator'
import isEmpty from 'is-empty'
import Empleado, { IEmpleado } from '../models/Empleado';
import logger from '../lib/logger';

interface IError {
  nombre?: string,
  apellidos?: string,
  email?: string,
  password?: string,
  password2?: string,
}

export default async function validarRegistro(data: IEmpleado) {
  let errors:IError = {};
  //Convierte los campos vacios en Cadenaas (string) vacias para usar las funciones de validacion
  data.usuario.email = !isEmpty(data.usuario.email) ? 
                        data.usuario.email : "";
  data.nombre = !isEmpty(data.nombre) ? data.nombre : "";
  data.apellidos = !isEmpty(data.apellidos) ? data.apellidos : "";
  // Validar nombre
  if (Validator.isEmpty(data.nombre)) {
    errors.nombre = 'Se necesita el nombre del usuario.'
  }
  // Validar Apellidos
  if (Validator.isEmpty(data.apellidos)) {
    errors.apellidos = 'Se necesita el apellido del usuario.'
  }
  // Validar Email
  await Empleado.findOne({ 'usuario.email': data.usuario.email })
    .then((usuario) => {
      if (usuario) errors.email = 'El Correo ya existe.'
    }).catch((error) => {
      logger.error('Error validando el registro del usuario')
      logger.error(error.message);
    })
  if (Validator.isEmpty(data.usuario.email)) {
    errors.email = 'Se necesita el Correo.'
  } else if (!Validator.isEmail(data.usuario.email)) {
    errors.email = 'Correo inválido.'
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
