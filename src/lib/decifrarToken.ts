import jwt from 'jsonwebtoken';
import config from '../config/config';

function decifrarToken(token: string | any) {
  let error = false;
  let usuarioDecoded = {};
  jwt.verify(token, config.jwtSecret, function (errors: any, usuario: any) {
    if(errors) {
      error = true;
    }
    usuarioDecoded = usuario;
  })
  
  return ({error, usuarioDecoded} as any)
};

export default decifrarToken;