export default {
  jwtSecret: process.env.JWT_SECRET || 'clavesecretatoken123',
  DB: {
    URI: process.env.MONGODB_URI || 'mongodb://localhost/test'
  }
};