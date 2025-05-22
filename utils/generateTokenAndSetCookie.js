import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (payload, res) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, 
  });
  return token;
};

export default generateTokenAndSetCookie;
