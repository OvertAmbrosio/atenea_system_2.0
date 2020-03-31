import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import passportMiddleware from './middlewares/passport';

//importar rutas
import authRoutes from './routes/auth.routes';
import empleadosRoutes from './routes/empleados.routes';
import contratasRoutes from './routes/contratas.routes';
import ordenesRoutes from './routes/ordenes.routes';

//inicializaciones
const app = express();

//configuraciones
app.set('port', process.env.port || 4000);
app.use(compression());

//middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json({limit: '10mb'}));
app.use(passport.initialize());
passport.use(passportMiddleware);
//routes
app.use('/api/auth', authRoutes); 
app.use('/api/empleados', passport.authenticate('jwt', { session: false }), empleadosRoutes);
app.use('/api/contratas', passport.authenticate('jwt', { session: false }), contratasRoutes);
app.use('/api/ordenes', passport.authenticate('jwt', { session: false }), ordenesRoutes);

export default app;