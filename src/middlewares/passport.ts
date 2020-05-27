import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import config from '../config/config';
import Empleado from '../models/Empleado';
import logger from '../lib/logger';

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret
} 

export default new Strategy(opts, async (payload, done) => {
  try {
    await Empleado.findById(payload.id).populate('contrata')
      .then((usuario) => {
        return done(null, usuario)
    }).catch((error) => {
        logger.log({
          level: 'error',
          message: error.message,
          service: 'Passport find'
        })
        return done(null, false)
    })
  } catch (error) {
    logger.log({
      level: 'error',
      message: error.message,
      service: 'Passport try'
    })
  }
})