
import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";

export const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {

    try {
      
      const token = req.headers.authorization

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      console.log(token)

      const decoded = jwt.verify(
        token as string,
        process.env.JWT_SECRET as string
      ) as JwtPayload

      
      const userData = await pool.query(
        `
        SELECT * FROM users WHERE email = $1
      `,
        [decoded.email],
      )

      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!"
        })
      }

      req.user = decoded;
      console.log("user added:", req.user);
    }
    catch (err) {
      console.log("err", err)
    }

    next();
  }

};