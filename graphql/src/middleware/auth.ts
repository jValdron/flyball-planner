import { MiddlewareFn } from 'type-graphql';
import { AuthService } from '../services/AuthService';
import { Request } from 'express';
import { In } from 'typeorm';

export interface AuthContext {
  req: Request;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    clubIds: string[];
  };
}

export const createClubFilter = (user: AuthContext['user']) => {
  if (!user || user.clubIds.length === 0) {
    return null;
  }
  return { clubId: In(user.clubIds) };
};

export const isAuth: MiddlewareFn<AuthContext> = async ({ context }, next) => {
  if (context.user) {
    if (process.env.NODE_ENV === 'development') {
      console.log('isAuth: using pre-populated user', context.user.id);
    }
    return next();
  }

  const authHeader = context.req?.headers?.authorization;

  if (!authHeader) {
    if (process.env.NODE_ENV === 'development') {
      console.log('isAuth: missing Authorization header');
    }
    throw new Error('Not authenticated');
  }

  const token = authHeader.replace('Bearer ', '');
  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    if (process.env.NODE_ENV === 'development') {
      console.log('isAuth: invalid token');
    }
    throw new Error('Invalid token');
  }

  const user = await AuthService.getUserById(decoded.id);
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      console.log('isAuth: user not found for id', decoded.id);
    }
    throw new Error('User not found');
  }

  if (!user.clubs || user.clubs.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('isAuth: user has no clubs');
    }
    throw new Error('No club memberships found. Please contact your administrator to be added to a club.');
  }

  context.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    clubIds: user.clubs.map(club => club.id)
  };

  return next();
};

export const hasClubAccess: MiddlewareFn<AuthContext> = async ({ context, args }, next) => {
  if (!context.user) {
    throw new Error('Not authenticated');
  }

  const clubId = args.clubId || args.id;
  if (!clubId) {
    throw new Error('Club ID is required');
  }

  const hasAccess = context.user.clubIds.includes(clubId);
  if (!hasAccess) {
    throw new Error('Access denied: You are not a member of this club');
  }

  return next();
};


