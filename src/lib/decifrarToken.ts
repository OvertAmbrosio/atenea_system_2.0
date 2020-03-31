import jwt from 'jsonwebtoken';
import config from '../config/config';

function decifrarToken(token: string | any) {
  let error = false;
  let usuarioDecoded = {};
  jwt.verify(token, config.jwtSecret, function (error: any, usuario: any) {
    if(error) {
      error = true;
    }
    usuarioDecoded = usuario;
  })

  return ({error, usuarioDecoded} as any)
};

export default decifrarToken;