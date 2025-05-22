import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
const authHeader = req.headers.authorization || req.cookies.token;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Decoded JWT payload:', decoded);
  req.user = decoded; 
  req.userId = decoded.userId;
  next();
} catch (err) {
  return res.status(401).json({ message: 'Invalid token' });
}

};

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user.userRole;  // <-- use userRole, not role
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}




