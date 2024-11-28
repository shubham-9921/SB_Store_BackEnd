import { NextFunction, Request, Response } from "express";
import { ControllerType } from "../types/types.js";

export const errorMiddlewares = (
  err: { message: string; statusCode: number; name: string },
  req: any,
  res: {
    status: (arg0: any) => {
      (): any;
      new (): any;
      json: { (arg0: { status: boolean; message: any }): any; new (): any };
    };
  },
  next: any
) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  if (err.name === "CastError") {
    err.message = "Invalid Request Data";
  }
  return res.status(err.statusCode).json({
    status: false,
    message: err.message,
  });
};

export const tryCatch =
  (func: ControllerType) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(func(req, res, next)).catch(next);
