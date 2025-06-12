import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { SetDog, Lane } from '../models/SetDog';
import { AppDataSource } from '../db';
import { InputType, Field, ID } from 'type-graphql';
import { Set as SetModel, SetType } from '../models/Set';

@InputType()
class SetDogUpdate {
  @Field(() => ID)
  dogId: string;

  @Field()
  index: number;

  @Field(() => Lane)
  lane: Lane;
}

@InputType()
class SetUpdate {
  @Field(() => ID)
  practiceId: string;

  @Field(() => ID)
  locationId: string;

  @Field()
  index: number;

  @Field(() => SetType)
  type: SetType;

  @Field({ nullable: true })
  typeCustom?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => [SetDogUpdate])
  dogs: SetDogUpdate[];
}

@Resolver(SetModel)
export class PracticeSetResolver {
  private setRepository = AppDataSource.getRepository(SetModel);

  @Query(() => [SetModel])
  async sets(
    @Arg('practiceId') practiceId: string,
    @Arg('locationId') locationId: string
  ): Promise<SetModel[]> {
    return await this.setRepository.find({
      where: { practiceId, locationId },
      relations: ['setDogs', 'setDogs.dog'],
      order: { index: 'ASC' }
    });
  }

  @Query(() => SetModel, { nullable: true })
  async set(@Arg('id') id: string): Promise<SetModel | null> {
    return await this.setRepository.findOne({
      where: { id },
      relations: ['setDogs', 'setDogs.dog']
    });
  }

  @Mutation(() => SetModel)
  async updateSet(
    @Arg('id', () => ID, { nullable: true }) id: string | null,
    @Arg('update') update: SetUpdate
  ): Promise<SetModel> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingSetWithIndex = await queryRunner.manager.findOne(SetModel, {
        where: {
          practiceId: update.practiceId,
          locationId: update.locationId,
          index: update.index
        }
      });

      if (existingSetWithIndex && existingSetWithIndex.id !== id) {
        throw new Error(`A set with index ${update.index} already exists in this practice and location`);
      }

      let set: SetModel;
      if (id) {
        const existingSet = await queryRunner.manager.findOne(SetModel, {
          where: { id },
          relations: ['setDogs']
        });
        if (!existingSet) {
          throw new Error('Set not found');
        }
        set = existingSet;
        Object.assign(set, {
          practiceId: update.practiceId,
          locationId: update.locationId,
          index: update.index,
          type: update.type,
          typeCustom: update.typeCustom,
          notes: update.notes
        });
      } else {
        set = queryRunner.manager.create(SetModel, {
          practiceId: update.practiceId,
          locationId: update.locationId,
          index: update.index,
          type: update.type,
          typeCustom: update.typeCustom,
          notes: update.notes
        });
      }

      const savedSet = await queryRunner.manager.save(set);

      if (id) {
        await queryRunner.manager.delete(SetDog, { setId: savedSet.id });
      }

      const setDogs = update.dogs.map(dogUpdate =>
        queryRunner.manager.create(SetDog, {
          setId: savedSet.id,
          dogId: dogUpdate.dogId,
          index: dogUpdate.index,
          lane: dogUpdate.lane
        })
      );

      await queryRunner.manager.save(setDogs);

      await queryRunner.commitTransaction();

      const result = await this.setRepository.findOne({
        where: { id: savedSet.id },
        relations: ['setDogs', 'setDogs.dog']
      });

      if (!result) {
        throw new Error('Failed to retrieve saved set');
      }

      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  @Mutation(() => Boolean)
  async deleteSet(@Arg('id') id: string): Promise<boolean> {
    const result = await this.setRepository.delete(id);
    return result.affected !== 0;
  }
}
