import schedule from 'node-schedule';
import app from './app';
import './database'
import logger from './lib/logger';
import Session from './models/Session'

async function main() {
  app.listen(app.get('port'), () => {
    logger.info('Servidor en el puerto ' + app.get('port'));
    schedule.scheduleJob('0 0 4 * * *', async function(){
      await Session.deleteMany({});
      logger.info('Ninguna sesión quedará viva en mi guardia!');
    });
  }).on('error', function (e) {
    logger.log({
      level: 'error',
      message: e.message,
      service: 'Index'
    });
  });
}

main();