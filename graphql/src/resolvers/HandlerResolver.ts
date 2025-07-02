import { Resolver, Query, Mutation, Arg, UseMiddleware, Ctx } from 'type-graphql';
import { Handler } from '../models/Handler';
import { AppDataSource } from '../db';
import { ID } from 'type-graphql';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';
import { AuthContext, isAuth, hasClubAccess, createClubFilter } from '../middleware/auth';

@Resolver(Handler)
export class HandlerResolver {
  private handlerRepository = AppDataSource.getRepository(Handler);

  @Query(() => [Handler])
  @UseMiddleware(isAuth)
  async handlers(@Ctx() { user }: AuthContext): Promise<Handler[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return [];

    return await this.handlerRepository.find({
      where: clubFilter
    });
  }

  @Query(() => Handler, { nullable: true })
  @UseMiddleware(isAuth)
  async handler(@Arg('id') id: string, @Ctx() { user }: AuthContext): Promise<Handler | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    return await this.handlerRepository.findOne({
      where: {
        id,
        ...clubFilter
      }
    });
  }

  @Query(() => [Handler], { nullable: true })
  @UseMiddleware(isAuth, hasClubAccess)
  async dogsByHandlersInClub(@Arg('clubId', () => ID) clubId: string): Promise<Handler[]> {
    return await this.handlerRepository.find({
      where: {
        clubId: clubId
      },
      relations: ['dogs']
    });
  }

  @Mutation(() => Handler)
  @UseMiddleware(isAuth, hasClubAccess)
  async createHandler(
    @Arg('givenName') givenName: string,
    @Arg('surname') surname: string,
    @Arg('clubId', () => ID) clubId: string
  ): Promise<Handler> {
    const handler = this.handlerRepository.create({ givenName, surname, clubId });
    const savedHandler = await this.handlerRepository.save(handler);

    await PubSubService.publishHandlerEvent(SubscriptionEvents.HANDLER_CREATED, savedHandler);

    return savedHandler;
  }

  @Mutation(() => Handler, { nullable: true })
  @UseMiddleware(isAuth)
  async updateHandler(
    @Arg('id') id: string,
    @Ctx() { user }: AuthContext,
    @Arg('givenName', { nullable: true }) givenName?: string,
    @Arg('surname', { nullable: true }) surname?: string
  ): Promise<Handler | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    const handler = await this.handlerRepository.findOne({
      where: {
        id,
        ...clubFilter
      }
    });
    if (!handler) return null;

    Object.assign(handler, {
      givenName: givenName ?? handler.givenName,
      surname: surname ?? handler.surname
    });

    const updatedHandler = await this.handlerRepository.save(handler);

    await PubSubService.publishHandlerEvent(SubscriptionEvents.HANDLER_UPDATED, updatedHandler);

    return updatedHandler;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteHandler(@Arg('id') id: string, @Ctx() { user }: AuthContext): Promise<boolean> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return false;

    const handler = await this.handlerRepository.findOne({
      where: {
        id,
        ...clubFilter
      }
    });
    if (!handler) return false;

    const result = await this.handlerRepository.delete(id);
    const deleted = result.affected !== 0;

    if (deleted) {
      await PubSubService.publishHandlerEvent(SubscriptionEvents.HANDLER_DELETED, handler);
    }

    return deleted;
  }
}
