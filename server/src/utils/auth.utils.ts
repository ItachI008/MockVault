import jwt from 'jsonwebtoken';

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

export const signToken = (userId: string) =>
  jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET || 'development-secret-change-me',
    { expiresIn: '7d' }
  );

export const toPublicUser = (user: any) => ({
  id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  avatar: user.avatar || null,
  isOnboarded: user.isOnboarded,
  isVerified: user.isVerified,
});
