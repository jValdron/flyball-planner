import { Resolver, Query, Mutation, Arg, ID, Int, UseMiddleware, Ctx } from 'type-graphql'

import { Dog, DogStatus, TrainingLevel } from '../models/Dog'
import { AppDataSource } from '../db'
import { AuthContext, isAuth, hasClubAccess, createClubFilter } from '../middleware/auth'
import { PubSubService, SubscriptionEvents } from '../services/PubSubService'

@Resolver(Dog)
export class DogResolver {
  private dogRepository = AppDataSource.getRepository(Dog);

  @Query(() => [Dog])
  @UseMiddleware(isAuth)
  async dogs(@Ctx() { user }: AuthContext): Promise<Dog[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return [];

    return await this.dogRepository.find({
      where: clubFilter
    });
  }

  @Query(() => Dog, { nullable: true })
  @UseMiddleware(isAuth)
  async dog(@Arg('id') id: string, @Ctx() { user }: AuthContext): Promise<Dog | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    return await this.dogRepository.findOne({
      where: {
        id,
        ...clubFilter
      }
    });
  }

  @Query(() => Int)
  @UseMiddleware(isAuth, hasClubAccess)
  async activeDogsInClub(@Arg('clubId', () => ID) clubId: string): Promise<number> {
    return await this.dogRepository.count({
      where: {
        clubId,
        status: DogStatus.Active
      }
    });
  }

  @Mutation(() => Dog)
  @UseMiddleware(isAuth, hasClubAccess)
  async createDog(
    @Arg('name') name: string,
    @Arg('ownerId') ownerId: string,
    @Arg('clubId') clubId: string,
    @Arg('trainingLevel', () => TrainingLevel) trainingLevel: TrainingLevel,
    @Arg('status', () => DogStatus) status: DogStatus,
    @Arg('crn', { nullable: true }) crn?: string
  ): Promise<Dog> {
    const dog = this.dogRepository.create({
      name,
      ownerId,
      clubId,
      trainingLevel,
      status,
      crn: crn === '' ? null : crn
    });
    const savedDog = await this.dogRepository.save(dog);

    await PubSubService.publishDogEvent(SubscriptionEvents.DOG_CREATED, savedDog);

    return savedDog;
  }

  @Mutation(() => Dog, { nullable: true })
  @UseMiddleware(isAuth)
  async updateDog(
    @Arg('id') id: string,
    @Ctx() { user }: AuthContext,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('ownerId', { nullable: true }) ownerId?: string,
    @Arg('trainingLevel', () => TrainingLevel, { nullable: true }) trainingLevel?: TrainingLevel,
    @Arg('status', () => DogStatus, { nullable: true }) status?: DogStatus,
    @Arg('crn', { nullable: true }) crn?: string
  ): Promise<Dog | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    const dog = await this.dogRepository.findOne({
      where: {
        id,
        ...clubFilter
      }
    });
    if (!dog) return null;

    Object.assign(dog, {
      name: name ?? dog.name,
      ownerId: ownerId ?? dog.ownerId,
      trainingLevel: trainingLevel ?? dog.trainingLevel,
      status: status ?? dog.status,
      crn: crn ?? (crn === '' ? null : crn)
    });

    const updatedDog = await this.dogRepository.save(dog);

    await PubSubService.publishDogEvent(SubscriptionEvents.DOG_UPDATED, updatedDog);

    return updatedDog;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteDog(@Arg('id') id: string, @Ctx() { user }: AuthContext): Promise<boolean> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return false;

    const dog = await this.dogRepository.findOne({
      where: {
        id,
        ...clubFilter
      }
    });
    if (!dog) return false;

    const result = await this.dogRepository.delete(id);
    const deleted = result.affected !== 0;

    if (deleted) {
      await PubSubService.publishDogEvent(SubscriptionEvents.DOG_DELETED, dog);
    }

    return deleted;
  }
}
