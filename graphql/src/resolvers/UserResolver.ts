import { Resolver, Query, Mutation, Arg, Ctx, UseMiddleware, ObjectType, Field } from 'type-graphql'

import { User } from '../models/User'
import { AppDataSource } from '../db'
import { isAuth } from '../middleware/auth'
import { AuthService, LoginCredentials } from '../services/AuthService'

@ObjectType()
class LoginResponse {
  @Field()
  token: string;

  @Field(() => User)
  user: User;
}

@Resolver(() => User)
export class UserResolver {
  @Mutation(() => LoginResponse)
  async loginUser(
    @Arg('username') username: string,
    @Arg('password') password: string
  ): Promise<LoginResponse> {
    const credentials: LoginCredentials = { username, password };
    const userData = await AuthService.authenticateUser(credentials);

    if (!userData) {
      throw new Error('Invalid username or password');
    }

    const user = await AuthService.getUserById(userData.id);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.clubs || user.clubs.length === 0) {
      throw new Error('No club memberships found. Please contact your administrator to be added to a club.');
    }

    const token = AuthService.generateToken(user);

    return {
      token,
      user
    };
  }

  @Query(() => User)
  @UseMiddleware(isAuth)
  async currentUser(@Ctx() context: any): Promise<User> {
    const user = await AuthService.getUserById(context.user.id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async changePassword(
    @Arg('currentPassword') currentPassword: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() context: any
  ): Promise<boolean> {
    const userId = context.user.id;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await AuthService.verifyPassword(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');

    user.password = await AuthService.hashPassword(newPassword);
    await userRepository.save(user);
    return true;
  }

  @Query(() => User)
  @UseMiddleware(isAuth)
  async me(@Ctx() context: any): Promise<User> {
    const user = await AuthService.getUserById(context.user.id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  async users(): Promise<User[]> {
    const userRepository = AppDataSource.getRepository(User);
    return userRepository.find({
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt']
    });
  }

  @Query(() => User, { nullable: true })
  @UseMiddleware(isAuth)
  async user(@Arg('id') id: string): Promise<User | null> {
    return AuthService.getUserById(id);
  }

    @Mutation(() => User)
  @UseMiddleware(isAuth)
  async updateUser(
    @Ctx() context: any,
    @Arg('firstName', { nullable: true }) firstName?: string,
    @Arg('lastName', { nullable: true }) lastName?: string,
    @Arg('email', { nullable: true }) email?: string
  ): Promise<User> {
    const userId = context.user.id;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('Email is already taken');
      }
    }

    Object.assign(user, {
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      email: email ?? user.email
    });

    await userRepository.save(user);

    const updatedUser = await AuthService.getUserById(userId);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }
    return updatedUser;
  }
}
