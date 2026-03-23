import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const getTokenFromRequest = (req: any) => {
  const authorizationToken = req.headers.authorization?.split(" ")[1];
  if (authorizationToken) {
    return authorizationToken;
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const tokenCookie = cookieHeader
    .split(";")
    .map((part: string) => part.trim())
    .find((part: string) => part.startsWith("token="));

  return tokenCookie ? tokenCookie.slice("token=".length) : null;
};

export const authMiddleware = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
