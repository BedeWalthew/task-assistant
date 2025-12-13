import { type Request, type Response, type NextFunction } from 'express';
import { type AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => e.message).join(', ');
        return next(new AppError(message, 400));
      }
      return next(error);
    }
  };
