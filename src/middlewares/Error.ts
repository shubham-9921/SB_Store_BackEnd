import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utils-classes.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  return res.status(err.statusCode).json({
    status: false,
    message: err.message,
  });
};

export const tryCatch =
  (func: ControllerType) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(func(req, res, next)).catch(next);
