import jwt from "jsonwebtoken";

const createToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      companyId: user.companyId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE_IN,
    },
  );

export default createToken;
