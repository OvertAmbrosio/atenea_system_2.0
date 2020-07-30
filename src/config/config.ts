import dotenv from 'dotenv';

dotenv.config();

export default {
  jwtSecret: process.env.JWT_SECRET || 'clavesecretatoken123',
  DB: {
    URI: process.env.MONGODB_URI || 'mongodb://localhost/test'
  },
  redis: {
    URI: process.env.REDISCLOUD_URL || 'url_redis',
    PORT: Number(process.env.REDISCLOUD_PORT) || 11111,
    PASS: process.env.REDISCLOUD_PASS || '123456'
  }
};