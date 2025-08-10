const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Access denied. Invalid token format.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = authenticateJWT;