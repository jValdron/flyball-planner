import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { AppDataSource } from '../db'
import { User } from '../models/User'

function getJwtSecret(): string {
  const env = process.env.NODE_ENV;
  const secret = process.env.JWT_SECRET;
  if (env === 'development') {
    return secret || 'dev-key';
  }
  if (!secret) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return secret;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      getJwtSecret(),
      { expiresIn: '30d' }
    );
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, getJwtSecret());
    } catch (error) {
      return null;
    }
  }

  static async authenticateUser(credentials: LoginCredentials): Promise<AuthUser | null> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { username: credentials.username }
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }

  static async getUserById(id: string): Promise<User | null> {
    const userRepository = AppDataSource.getRepository(User);
    return userRepository.findOne({
      where: { id },
      relations: ['clubs']
    });
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    const userRepository = AppDataSource.getRepository(User);
    return userRepository.findOne({
      where: { username },
      relations: ['clubs']
    });
  }
}
