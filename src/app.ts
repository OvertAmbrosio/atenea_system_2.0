import express from 'express';
import helmet from 'helmet';
import favicon from 'serve-favicon'
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import multer from 'multer';
import path from 'path'
import passport from 'passport';
import passportMiddleware from './middlewares/passport';
//importar rutas
import authRoutes from './routes/auth.routes';
import empleadosRoutes from './routes/empleados.routes';
import contratasRoutes from './routes/contratas.routes';
import ordenesRoutes from './routes/ordenes.routes';

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'public/img/uploads'),
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + '_' + file.originalname);
  }
});

//inicializaciones
const app = express();
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.disable('x-powered-by');
app.use(helmet());
app.use(helmet.featurePolicy({
  features: {
    fullscreen: ["'self'"],
    vibrate: ["'none'"],
    syncXhr: ["'none'"]
  }
}));
app.use(helmet.referrerPolicy({
  policy: 'same-origin'
}));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.set('port', process.env.PORT || 4000);
app.use(compression( { level: 9 } ));
//middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json({limit: '10mb'}));
app.use(multer({storage}).array('orden_imagen'));
app.use(passport.initialize());
passport.use(passportMiddleware);
//routes
app.use('/api/auth', authRoutes); 
app.use('/api/empleados', passport.authenticate('jwt', { session: false }), empleadosRoutes);
app.use('/api/contratas', passport.authenticate('jwt', { session: false }), contratasRoutes);
app.use('/api/ordenes', passport.authenticate('jwt', { session: false }), ordenesRoutes);

export default app;