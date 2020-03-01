import mongoose, { ConnectionOptions } from 'mongoose';
import config from './config/config';
import logger from './lib/logger';

const dbOptions: ConnectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

mongoose.connect(config.DB.URI, dbOptions);

const connection = mongoose.connection;

connection.once('open', () => {
  console.log('Base de datos conectada');
});

connection.on('error', err => {
  logger.log({
    level: 'error',
    message: err.message,
    service: 'Base de datos'
  });
  process.exit(0);
})