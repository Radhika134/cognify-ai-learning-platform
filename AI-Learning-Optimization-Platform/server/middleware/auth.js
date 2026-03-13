const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token provided. Access denied." });
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user ID to request object
        req.userId = decoded.userId;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token. Access denied." });
    }
};

module.exports = protect;
