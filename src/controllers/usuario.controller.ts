import { Request, Response } from 'express';

export const registrar = (req: Request, res: Response) => {
  res.send('registro');
};

export const acceder = (req: Request, res: Response) => {
  res.send('acceder');
}