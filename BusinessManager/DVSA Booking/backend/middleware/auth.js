// Authentication middleware
const { verifyToken } = require('../utils/auth');

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token' });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Authentication failed' });
    }
}

function adminMiddleware(req, res, next) {
    // Placeholder - implement role-based access control
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

module.exports = { authMiddleware, adminMiddleware };
