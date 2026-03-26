import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  riskScore?: number;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

export const generateToken = (payload: TokenPayload): string => {
  // Ensure payload is a plain object
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    riskScore: payload.riskScore || 0
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE as jwt.SignOptions['expiresIn']
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    riskScore: payload.riskScore || 0
  };
  
  return jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE as jwt.SignOptions['expiresIn']
  });
};

export const verifyToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw error;
  }
};

export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    throw error;
  }
};

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    return null;
  }
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

export const extractTokenFromCookie = (cookies: any): string | null => {
  return cookies?.token || null;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp: number } | null;
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as { exp: number } | null;
    if (!decoded || !decoded.exp) return null;
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

export const refreshAccessToken = (refreshToken: string): { token: string; expiresAt: Date } | null => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const newPayload: TokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      riskScore: decoded.riskScore
    };
    
    const newToken = generateToken(newPayload);
    const expiresAt = getTokenExpirationTime(newToken);
    
    if (!expiresAt) return null;
    
    return {
      token: newToken,
      expiresAt
    };
  } catch (error) {
    return null;
  }
};