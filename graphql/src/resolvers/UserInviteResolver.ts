import { Resolver, Query, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql'
import { randomBytes } from 'crypto'

import { UserInvite } from '../models/UserInvite'
import { User } from '../models/User'
import { Club } from '../models/Club'
import { AppDataSource } from '../db'
import { isAuth, hasClubAccess, AuthContext } from '../middleware/auth'

const INVITE_EXPIRATION_DAYS = parseInt(process.env.USER_INVITE_EXPIRATION_DAYS || '7', 10)
const INVITE_EXPIRATION_MS = INVITE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000

@Resolver(() => UserInvite)
export class UserInviteResolver {
  private userInviteRepository = AppDataSource.getRepository(UserInvite);
  private userRepository = AppDataSource.getRepository(User);
  private clubRepository = AppDataSource.getRepository(Club);

  @Mutation(() => UserInvite)
  @UseMiddleware(isAuth, hasClubAccess)
  async createUserInvite(
    @Arg('email') email: string,
    @Arg('clubId') clubId: string,
    @Ctx() { user }: AuthContext
  ): Promise<UserInvite> {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      const club = await this.clubRepository.findOne({
        where: { id: clubId },
        relations: ['users']
      });

      if (!club) {
        throw new Error('Club not found');
      }

      const isAlreadyMember = club.users.some(u => u.id === existingUser.id);
      if (isAlreadyMember) {
        throw new Error('User is already a member of this club');
      }

      club.users.push(existingUser);
      await this.clubRepository.save(club);

      const invite = new UserInvite();
      invite.code = randomBytes(32).toString('hex');
      invite.email = email;
      invite.clubId = clubId;
      invite.invitedById = user.id;
      invite.expiresAt = new Date(Date.now() + INVITE_EXPIRATION_MS);
      invite.usedAt = new Date();
      invite.usedById = existingUser.id;

      return await this.userInviteRepository.save(invite);
    }

    const existingInvite = await this.userInviteRepository.findOne({
      where: { email, clubId, usedAt: null as any }
    });

    if (existingInvite && !existingInvite.isExpired) {
      existingInvite.expiresAt = new Date(Date.now() + INVITE_EXPIRATION_MS);
      existingInvite.invitedById = user.id;
      return await this.userInviteRepository.save(existingInvite);
    }

    const invite = new UserInvite();
    invite.code = randomBytes(32).toString('hex');
    invite.email = email;
    invite.clubId = clubId;
    invite.invitedById = user.id;
    invite.expiresAt = new Date(Date.now() + INVITE_EXPIRATION_MS);

    return await this.userInviteRepository.save(invite);
  }

  @Query(() => [UserInvite])
  @UseMiddleware(isAuth, hasClubAccess)
  async userInvitesByClub(@Arg('clubId') clubId: string): Promise<UserInvite[]> {
    return await this.userInviteRepository.find({
      where: { clubId },
      relations: ['invitedBy', 'usedBy', 'club'],
      order: { createdAt: 'DESC' }
    });
  }

  @Query(() => UserInvite, { nullable: true })
  async userInviteByCode(@Arg('code') code: string): Promise<UserInvite | null> {
    const invite = await this.userInviteRepository.findOne({
      where: { code },
      relations: ['club', 'invitedBy']
    });

    if (!invite || invite.isExpired || invite.isUsed) {
      return null;
    }

    return invite;
  }

  @Mutation(() => User)
  async acceptUserInvite(
    @Arg('code') code: string,
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Arg('firstName') firstName: string,
    @Arg('lastName') lastName: string
  ): Promise<User> {
    const invite = await this.userInviteRepository.findOne({
      where: { code },
      relations: ['club']
    });

    if (!invite) {
      throw new Error('Invalid invite code');
    }

    if (invite.isExpired) {
      throw new Error('Invite has expired');
    }

    if (invite.isUsed) {
      throw new Error('Invite has already been used');
    }

    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new Error('Username is already taken');
    }

    const existingUserByEmail = await this.userRepository.findOne({ where: { email: invite.email } });
    if (existingUserByEmail) {
      throw new Error('An account with this email already exists. Please log in instead.');
    }

    const newUser = new User();
    newUser.username = username;
    newUser.email = invite.email;
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.password = await require('../services/AuthService').AuthService.hashPassword(password);

    const savedUser = await this.userRepository.save(newUser);

    const club = await this.clubRepository.findOne({
      where: { id: invite.clubId },
      relations: ['users']
    });

    if (!club) {
      throw new Error('Club not found');
    }

    club.users.push(savedUser);
    await this.clubRepository.save(club);

    invite.usedAt = new Date();
    invite.usedById = savedUser.id;
    await this.userInviteRepository.save(invite);

    return savedUser;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, hasClubAccess)
  async removeUserFromClub(
    @Arg('userId') userId: string,
    @Arg('clubId') clubId: string,
    @Ctx() { user }: AuthContext
  ): Promise<boolean> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (userId === user.id) {
      throw new Error('You cannot remove yourself from the club');
    }

    const club = await this.clubRepository.findOne({
      where: { id: clubId },
      relations: ['users']
    });

    if (!club) {
      throw new Error('Club not found');
    }

    club.users = club.users.filter(u => u.id !== userId);
    await this.clubRepository.save(club);

    return true;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth, hasClubAccess)
  async usersByClub(@Arg('clubId') clubId: string): Promise<User[]> {
    const club = await this.clubRepository.findOne({
      where: { id: clubId },
      relations: ['users']
    });

    if (!club) {
      throw new Error('Club not found');
    }

    return club.users;
  }
}
