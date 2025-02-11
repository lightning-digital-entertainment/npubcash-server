import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  _: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Error:", err);

  res.status(statusCode).json({ error: true, message });
}
