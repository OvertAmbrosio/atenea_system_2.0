import app from './app';
import './database'
import logger from './lib/logger';

async function main() {
  await app.listen(app.get('port'), () => {
    logger.info('Servidor en el puerto ' + app.get('port'))
  }).on('error', function (e) {
    logger.log({
      level: 'error',
      message: e.message,
      service: 'Index'
    })
  });
}

main();