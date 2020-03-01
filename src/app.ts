import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
//importar rutas
import authRoutes from './routes/auth.routes';

//inicializaciones
const app = express();

//configuraciones
app.set('port', process.env.port || 3000);
dotenv.config();

//middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//routes
app.get('/', (req, res) => {
  res.send('Servidor listo');
});

app.use(authRoutes);

export default app;