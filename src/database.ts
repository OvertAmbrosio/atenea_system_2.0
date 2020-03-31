import mongoose, { ConnectionOptions } from 'mongoose';
import config from './config/config';
import logger from './lib/logger';

const dbOptions: ConnectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
};

mongoose.connect(config.DB.URI, dbOptions);

const connection = mongoose.connection;

connection.once('open', () => {
  console.log('Base de datos conectada');
});

connection.on('error', err => {
  console.log(process.env.MONGODB_URI);
  logger.log({
    level: 'error',
    message: err.message,
    service: 'Base de datos'
  });
  process.exit(0);
})