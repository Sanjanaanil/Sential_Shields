import bcrypt from 'bcryptjs';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateDeviceFingerprint = (req: any): string => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['sec-ch-ua'] || '',
    req.headers['sec-ch-ua-platform'] || '',
  ];
  
  return Buffer.from(components.join('|')).toString('base64');
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitized } = user.toObject ? user.toObject() : user;
  return sanitized;
};

export const calculateRiskLevel = (score: number): string => {
  if (score < 30) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 80) return 'HIGH';
  return 'CRITICAL';
};