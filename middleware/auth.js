const jwt = require('jsonwebtoken')

//JWT Authentication middleware to populate req.user

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (authHeader) {
      const token = authHeader.split(' ')[1];
  
      jwt.verify(token, "secret_string", (err, user) => {
        if (err) {
          return res.status(403).json({ message: 'Invalid or expired token' });
        }
  
        req.user = user;
        next();
      });
    } else {
      res.status(401).json({ message: 'Authorization header missing' });
    }
  };

  module.exports = authenticateJWT;