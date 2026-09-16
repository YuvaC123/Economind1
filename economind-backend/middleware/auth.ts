import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

export interface AuthedRequest extends Request {
  userId?: string
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): any {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided' })
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    req.userId = payload.userId
    next()
  } catch (error) {
    return res.status(401).json({ msg: 'Invalid or expired token' })
  }
}
