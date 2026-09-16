import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token provided' });
    }
    const token = header.slice('Bearer '.length);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ msg: 'Invalid or expired token' });
    }
}
//# sourceMappingURL=auth.js.map