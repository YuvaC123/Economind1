import { Request, Response, NextFunction } from 'express';
export interface AuthedRequest extends Request {
    userId?: string;
}
export declare function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): any;
//# sourceMappingURL=auth.d.ts.map