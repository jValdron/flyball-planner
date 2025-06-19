import { Resolver, Query, Mutation, Arg, ID, Int } from 'type-graphql';
import { Dog, DogStatus, TrainingLevel } from '../models/Dog';
import { AppDataSource } from '../db';

@Resolver(Dog)
export class DogResolver {
  private dogRepository = AppDataSource.getRepository(Dog);

  @Query(() => [Dog])
  async dogs(): Promise<Dog[]> {
    return await this.dogRepository.find();
  }

  @Query(() => Dog, { nullable: true })
  async dog(@Arg('id') id: string): Promise<Dog | null> {
    return await this.dogRepository.findOneBy({ id });
  }

  @Query(() => Int)
  async activeDogsInClub(@Arg('clubId', () => ID) clubId: string): Promise<number> {
    return await this.dogRepository.count({
      where: {
        clubId,
        status: DogStatus.Active
      }
    });
  }

  @Mutation(() => Dog)
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
    return await this.dogRepository.save(dog);
  }

  @Mutation(() => Dog, { nullable: true })
  async updateDog(
    @Arg('id') id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('ownerId', { nullable: true }) ownerId?: string,
    @Arg('clubId', { nullable: true }) clubId?: string,
    @Arg('trainingLevel', () => TrainingLevel, { nullable: true }) trainingLevel?: TrainingLevel,
    @Arg('status', () => DogStatus, { nullable: true }) status?: DogStatus,
    @Arg('crn', { nullable: true }) crn?: string
  ): Promise<Dog | null> {
    const dog = await this.dogRepository.findOneBy({ id });
    if (!dog) return null;

    Object.assign(dog, {
      name: name ?? dog.name,
      ownerId: ownerId ?? dog.ownerId,
      clubId: clubId ?? dog.clubId,
      trainingLevel: trainingLevel ?? dog.trainingLevel,
      status: status ?? dog.status,
      crn: crn ?? (crn === '' ? null : crn)
    });

    return await this.dogRepository.save(dog);
  }

  @Mutation(() => Boolean)
  async deleteDog(@Arg('id') id: string): Promise<boolean> {
    const result = await this.dogRepository.delete(id);
    return result.affected !== 0;
  }
}
