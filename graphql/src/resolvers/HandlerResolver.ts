import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Handler } from '../models/Handler';
import { AppDataSource } from '../db';
import { ID } from 'type-graphql';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';

@Resolver(Handler)
export class HandlerResolver {
  private handlerRepository = AppDataSource.getRepository(Handler);

  @Query(() => [Handler])
  async handlers(): Promise<Handler[]> {
    return await this.handlerRepository.find();
  }

  @Query(() => Handler, { nullable: true })
  async handler(@Arg('id') id: string): Promise<Handler | null> {
    return await this.handlerRepository.findOneBy({ id });
  }

  @Query(() => [Handler], { nullable: true })
  async dogsByHandlersInClub(@Arg('clubId', () => ID) clubId: string): Promise<Handler[]> {
    return await this.handlerRepository.find({
      where: {
        clubId: clubId
      },
      relations: ['dogs']
    });
  }

  @Mutation(() => Handler)
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
  async updateHandler(
    @Arg('id') id: string,
    @Arg('givenName', { nullable: true }) givenName?: string,
    @Arg('surname', { nullable: true }) surname?: string
  ): Promise<Handler | null> {
    const handler = await this.handlerRepository.findOneBy({ id });
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
  async deleteHandler(@Arg('id') id: string): Promise<boolean> {
    const handler = await this.handlerRepository.findOneBy({ id });
    if (!handler) return false;

    const result = await this.handlerRepository.delete(id);
    const deleted = result.affected !== 0;

    if (deleted) {
      await PubSubService.publishHandlerEvent(SubscriptionEvents.HANDLER_DELETED, handler);
    }

    return deleted;
  }
}
