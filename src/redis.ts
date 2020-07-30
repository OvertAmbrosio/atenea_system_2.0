import redis from 'redis';
import logger from './lib/logger';
import config from './config/config';

const client = redis.createClient(config.redis.PORT, 
  config.redis.URI, 
  {no_ready_check: true}
);

client.auth(config.redis.PASS, function (err) {
  if (err) {
    logger.error({
      message: err.message,
      service:'Redis Auth'
    })
  }
});

client.on('error', function (err) {
  logger.error({
    message: err,
    service:'Redis On'
  })
  console.log('Error ' + err);
}); 

client.on('connect', function() {
  logger.info({
    message: 'Conectado a Redis.',
    service:'Redis On'
  })
});

export default client;