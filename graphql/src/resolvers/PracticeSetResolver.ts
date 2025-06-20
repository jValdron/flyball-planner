import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { SetDog, Lane } from '../models/SetDog';
import { AppDataSource } from '../db';
import { InputType, Field, ID } from 'type-graphql';
import { Set as SetModel, SetType } from '../models/Set';
import { Location } from '../models/Location';
import { In } from 'typeorm';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';
import { PracticeSummaryService } from '../services/PracticeSummaryService';

@InputType()
class SetDogUpdate {
  @Field(() => ID, { nullable: true })
  dogId?: string;

  @Field({ nullable: true })
  index?: number;

  @Field(() => Lane, { nullable: true })
  lane?: Lane;
}

@InputType()
class SetUpdate {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => ID, { nullable: true })
  practiceId?: string;

  @Field(() => ID, { nullable: true })
  locationId?: string;

  @Field({ nullable: true })
  index?: number;

  @Field(() => SetType, { nullable: true })
  type?: SetType;

  @Field({ nullable: true })
  typeCustom?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => [SetDogUpdate], { nullable: true })
  dogs?: SetDogUpdate[];
}

@Resolver(SetModel)
export class PracticeSetResolver {
  private setRepository = AppDataSource.getRepository(SetModel);

  @Query(() => [SetModel])
  async sets(
    @Arg('practiceId') practiceId: string
  ): Promise<SetModel[]> {
    return await this.setRepository.find({
      where: { practiceId },
      relations: ['dogs', 'dogs.dog'],
      order: { index: 'ASC' }
    });
  }

  @Query(() => SetModel, { nullable: true })
  async set(@Arg('id') id: string): Promise<SetModel | null> {
    return await this.setRepository.findOne({
      where: { id },
      relations: ['dogs', 'dogs.dog']
    });
  }

  @Mutation(() => [SetModel])
  async updateSets(
    @Arg('updates', () => [SetUpdate]) updates: SetUpdate[]
  ): Promise<SetModel[]> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const results: SetModel[] = [];
      const affectedPracticeIds = new Set<string>();

      for (const update of updates) {
        let set: SetModel;
        let id = update.id;
        if (id) {
          const existingSet = await queryRunner.manager.findOne(SetModel, {
            where: { id },
            relations: ['dogs']
          });
          if (!existingSet) {
            throw new Error('Set not found');
          }
          set = existingSet;
          if (update.practiceId !== undefined) set.practiceId = update.practiceId;
          if (update.locationId !== undefined) set.locationId = update.locationId;
          if (update.index !== undefined) set.index = update.index;
          if (update.type !== undefined) set.type = update.type;
          if (update.typeCustom !== undefined) set.typeCustom = update.typeCustom;
          if (update.notes !== undefined) set.notes = update.notes;

          // Track affected practice
          if (set.practiceId) {
            affectedPracticeIds.add(set.practiceId);
          }
        } else {
          set = queryRunner.manager.create(SetModel, {
            practiceId: update.practiceId,
            locationId: update.locationId,
            index: update.index,
            type: update.type,
            typeCustom: update.typeCustom,
            notes: update.notes
          });

          // Track affected practice
          if (update.practiceId) {
            affectedPracticeIds.add(update.practiceId);
          }
        }
        const savedSet = await queryRunner.manager.save(set);
        if (id && update.dogs !== undefined) {
          await queryRunner.manager.delete(SetDog, { setId: savedSet.id });
        }
        if (update.dogs !== undefined) {
          const dogs = update.dogs.map(dogUpdate =>
            queryRunner.manager.create(SetDog, {
              setId: savedSet.id,
              dogId: dogUpdate.dogId,
              index: dogUpdate.index,
              lane: dogUpdate.lane
            })
          );
          await queryRunner.manager.save(dogs);
        }
        const result = await queryRunner.manager.findOne(SetModel, {
          where: { id: savedSet.id },
          relations: ['dogs', 'dogs.dog']
        });
        if (!result) {
          throw new Error('Failed to retrieve saved set');
        }
        results.push(result);
      }

      // Check that SetDog records have lane defined when location is double lane
      const allSets = await queryRunner.manager.find(SetModel, {
        relations: ['dogs']
      });
      const locationIds = [...new Set(allSets.map(set => set.locationId))];
      const locations = await queryRunner.manager.find(Location, {
        where: { id: In(locationIds) }
      });
      const locationMap = new Map(locations.map(loc => [loc.id, loc]));

      for (const set of allSets) {
        const location = locationMap.get(set.locationId);
        if (location?.isDoubleLane) {
          for (const setDog of set.dogs) {
            if (setDog.lane === null || setDog.lane === undefined) {
              throw new Error(`Lane must be defined for SetDog in double lane location ${location.name}`);
            }
          }
        }
      }

      // Check for duplicate SetDog indices within each set per lane
      const allSetDogs = await queryRunner.manager.find(SetDog);
      const setDogSeen = new Map<string, Map<Lane | null, Set<number>>>();
      for (const setDog of allSetDogs) {
        if (setDog.setId && setDog.index !== undefined) {
          if (!setDogSeen.has(setDog.setId)) {
            setDogSeen.set(setDog.setId, new Map());
          }
          const laneMap = setDogSeen.get(setDog.setId)!;
          const lane = setDog.lane;
          if (!laneMap.has(lane)) {
            laneMap.set(lane, new Set());
          }
          const seenIndices = laneMap.get(lane)!;
          if (seenIndices.has(setDog.index)) {
            throw new Error(`Duplicate SetDog index ${setDog.index} found for setId ${setDog.setId} in lane ${lane || 'null'}`);
          }
          seenIndices.add(setDog.index);
        }
      }

      // Check for duplicate set indices within each location (not across all locations)
      const locationSetMap = new Map<string, Set<number>>();
      for (const set of allSets) {
        if (set.practiceId && set.locationId && set.index !== undefined) {
          const locationKey = `${set.practiceId}|${set.locationId}`;
          if (!locationSetMap.has(locationKey)) {
            locationSetMap.set(locationKey, new Set());
          }
          const seenIndices = locationSetMap.get(locationKey)!;
          if (seenIndices.has(set.index)) {
            throw new Error(`Duplicate index ${set.index} found for practiceId ${set.practiceId} and locationId ${set.locationId}`);
          }
          seenIndices.add(set.index);
        }
      }
      await queryRunner.commitTransaction();

      for (const result of results) {
        const eventType = SubscriptionEvents.PRACTICE_SET_UPDATED;
        await PubSubService.publishPracticeSetEvent(eventType, result);
      }

      for (const practiceId of affectedPracticeIds) {
        const summary = await PracticeSummaryService.createPracticeSummaryById(practiceId);
        if (summary) {
          await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_SET_UPDATED, summary);
        }
      }

      return results;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  @Mutation(() => Boolean)
  async deleteSets(@Arg('ids', () => [String]) ids: string[]): Promise<boolean> {
    if (ids.length === 0) {
      return true;
    }

    const sets = await this.setRepository.find({
      where: { id: In(ids) },
      relations: ['dogs', 'dogs.dog']
    });

    if (sets.length === 0) {
      return false;
    }

    const practiceId = sets[0].practiceId;
    if (!practiceId) {
      return false;
    }

    const allSamePractice = sets.every(set => set.practiceId === practiceId);
    if (!allSamePractice) {
      throw new Error('All sets must be from the same practice');
    }

    const result = await this.setRepository.delete({ id: In(ids) });
    const deleted = result.affected !== 0;

    if (deleted) {
      for (const set of sets) {
        await PubSubService.publishPracticeSetEvent(SubscriptionEvents.PRACTICE_SET_DELETED, set);
      }

      const summary = await PracticeSummaryService.createPracticeSummaryById(practiceId);
      if (summary) {
        await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_SET_DELETED, summary);
      }
    }

    return deleted;
  }
}
