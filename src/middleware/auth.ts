import { NextFunction, Request, Response } from "express";
import { verifyAuth } from "../utils/auth";

export function isAuthMiddleware(path: string, method: string) {
  async function isAuth(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.get("user-agent");
    const hostname = req.header("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    if (!hostname || !userAgent) {
      res.status(400);
      return next(new Error("Missing headers"));
    }
    const url = protocol + "://" + hostname + path;
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      res.status(401);
      return next(new Error("Missing Authorization Header"));
    }
    const isAuth = await verifyAuth(authHeader, url, method, userAgent);
    if (!isAuth.authorized) {
      res.status(401);
      return next(new Error("Invalid Authorization Header"));
    } else {
      req.authData = isAuth;
    }
    next();
  }
  return isAuth;
}
