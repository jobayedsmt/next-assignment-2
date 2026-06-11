import type { Request, Response, NextFunction } from "express";

export const roleMiddleware = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    // console.log("ROLE CHECK USER:", user);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};