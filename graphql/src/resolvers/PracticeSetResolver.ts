import { Resolver, Query, Mutation, Arg, UseMiddleware, Ctx, InputType, Field, ID } from 'type-graphql'
import { In } from 'typeorm'

import { SetDog, Lane } from '../models/SetDog'
import { Set as SetModel, SetType, SetRating } from '../models/Set'
import { Location } from '../models/Location'
import { Practice } from '../models/Practice'
import { AppDataSource } from '../db'
import { AuthContext, isAuth, createClubFilter } from '../middleware/auth'
import { PubSubService, SubscriptionEvents } from '../services/PubSubService'
import { PracticeSummaryService } from '../services/PracticeSummaryService'

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

  @Field({ nullable: true })
  isWarmup?: boolean;

  @Field(() => SetRating, { nullable: true })
  rating?: SetRating;

  @Field(() => [SetDogUpdate], { nullable: true })
  dogs?: SetDogUpdate[];
}

@Resolver(SetModel)
export class PracticeSetResolver {
  private setRepository = AppDataSource.getRepository(SetModel);
  private practiceRepository = AppDataSource.getRepository(Practice);

  @Query(() => [SetModel])
  @UseMiddleware(isAuth)
  async sets(
    @Arg('practiceId') practiceId: string,
    @Ctx() { user }: AuthContext
  ): Promise<SetModel[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return [];

    // Check that the practice belongs to user's club
    const practice = await this.practiceRepository.findOne({
      where: {
        id: practiceId,
        ...clubFilter
      }
    });
    if (!practice) return [];

    return await this.setRepository.find({
      where: { practiceId },
      relations: ['dogs', 'dogs.dog'],
      order: { index: 'ASC' }
    });
  }

  @Query(() => SetModel, { nullable: true })
  @UseMiddleware(isAuth)
  async set(@Arg('id') id: string, @Ctx() { user }: AuthContext): Promise<SetModel | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    // Check that the set's practice belongs to user's club
    const set = await this.setRepository.findOne({
      where: { id },
      relations: ['dogs', 'dogs.dog']
    });
    if (!set || !set.practiceId) return null;

    const practice = await this.practiceRepository.findOne({
      where: {
        id: set.practiceId,
        ...clubFilter
      }
    });
    if (!practice) return null;

    return set;
  }

  @Mutation(() => [SetModel])
  @UseMiddleware(isAuth)
  async updateSets(
    @Arg('updates', () => [SetUpdate]) updates: SetUpdate[],
    @Ctx() { user }: AuthContext
  ): Promise<SetModel[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) {
      throw new Error('Access denied: You are not a member of any clubs');
    }

    // Get the practiceId from the first update that has one
    const practiceId = updates.find(u => u.practiceId)?.practiceId;
    if (practiceId) {
      // Check that the practice belongs to user's club
      const practice = await this.practiceRepository.findOne({
        where: {
          id: practiceId,
          ...clubFilter
        }
      });
      if (!practice) {
        throw new Error('Access denied: Practice not found or you do not have access to it');
      }
    }

    // For existing sets, verify they belong to the same practice
    const existingSetIds = updates.map(u => u.id).filter(Boolean) as string[];
    if (existingSetIds.length > 0) {
      const existingSets = await this.setRepository.find({
        where: { id: In(existingSetIds) },
        relations: ['dogs']
      });

      // Check that all existing sets belong to the same practice
      const setPracticeIds = [...new Set(existingSets.map(s => s.practiceId).filter(Boolean))];
      if (setPracticeIds.length > 1) {
        throw new Error('All sets must belong to the same practice');
      }

      // If we have a practiceId from existing sets, verify it matches
      if (setPracticeIds.length === 1 && practiceId && setPracticeIds[0] !== practiceId) {
        throw new Error('All sets must belong to the same practice');
      }
    }

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
          if (update.locationId !== undefined) set.locationId = update.locationId;
          if (update.index !== undefined) set.index = update.index;
          if (update.type !== undefined) set.type = update.type;
          if (update.typeCustom !== undefined) set.typeCustom = update.typeCustom;
          if (update.notes !== undefined) set.notes = update.notes;
          if (update.isWarmup !== undefined) set.isWarmup = update.isWarmup;
          if (update.rating !== undefined) set.rating = update.rating;

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
            notes: update.notes,
            isWarmup: update.isWarmup ?? false,
            rating: update.rating
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

        const update = updates.find(u => u.id === result.id);
        if (update && update.rating !== undefined && result.practiceId) {
          await PubSubService.publishPracticeSetRatingEvent(
            SubscriptionEvents.PRACTICE_SET_RATING_UPDATED,
            result.id,
            result.practiceId,
            result.rating
          );
        }
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
  @UseMiddleware(isAuth)
  async deleteSets(@Arg('ids', () => [String]) ids: string[], @Ctx() { user }: AuthContext): Promise<boolean> {
    if (ids.length === 0) {
      return true;
    }

    const clubFilter = createClubFilter(user);
    if (!clubFilter) {
      throw new Error('Access denied: You are not a member of any clubs');
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

    // Check that the practice belongs to user's club
    const practice = await this.practiceRepository.findOne({
      where: {
        id: practiceId,
        ...clubFilter
      }
    });
    if (!practice) {
      throw new Error('Access denied: Practice not found or you do not have access to it');
    }

    // Validation: Don't delete default set if others with same index remain
    const allSetsBeforeDelete = await this.setRepository.find({ where: { practiceId } });
    const idsToDeleteSet = new Set(ids);
    const defaultLocationIds = new Set(
      (await AppDataSource.getRepository(Location).find({ where: { isDefault: true } })).map(l => l.id)
    );
    for (const set of sets) {
      if (defaultLocationIds.has(set.locationId)) {
        const otherSet = allSetsBeforeDelete.find(
          s => s.index === set.index && s.locationId !== set.locationId && !idsToDeleteSet.has(s.id)
        );
        if (otherSet) {
          throw new Error(
            `Cannot delete set with default location at index ${set.index} while another set with the same index in a different location remains.`
          );
        }
      }
    }

    // Delete sets
    const result = await this.setRepository.delete({ id: In(ids) });
    const deleted = result.affected !== 0;

    if (deleted) {
      for (const set of sets) {
        await PubSubService.publishPracticeSetEvent(SubscriptionEvents.PRACTICE_SET_DELETED, set);
      }

      // Reorder indices only when an entire index was removed across all locations
      const remainingSets = await this.setRepository.find({
        where: { practiceId },
        order: { index: 'ASC' }
      });
      const deletedIndices = Array.from(new Set(sets.map(s => s.index))).sort((a, b) => a - b);

      // Determine which indices are fully removed (no remaining set at that index)
      const remainingIndexSet = new Set(remainingSets.map(s => s.index));
      const indicesToCollapse = deletedIndices.filter(idx => !remainingIndexSet.has(idx));

      if (indicesToCollapse.length > 0) {
        // Work on a local copy to handle multiple collapses in order
        const setsNeedingUpdate: SetModel[] = [];
        for (const deletedIndex of indicesToCollapse) {
          for (const set of remainingSets) {
            if (set.index > deletedIndex) {
              set.index = set.index - 1;
              setsNeedingUpdate.push(set);
            }
          }
          // After collapsing this index, reflect new indices for subsequent iterations
          for (const set of remainingSets) {
            // nothing extra needed; we've already mutated remainingSets indices
          }
        }

        if (setsNeedingUpdate.length > 0) {
          // Deduplicate by id in case of multiple decrements
          const latestById = new Map<string, SetModel>();
          for (const set of setsNeedingUpdate) {
            latestById.set(set.id, set);
          }

          for (const set of latestById.values()) {
            await this.setRepository.update(set.id, { index: set.index });
          }

          const fullUpdatedSets = await this.setRepository.find({
            where: { id: In(Array.from(latestById.keys())) },
            relations: ['dogs', 'dogs.dog']
          });

          for (const set of fullUpdatedSets) {
            await PubSubService.publishPracticeSetEvent(SubscriptionEvents.PRACTICE_SET_UPDATED, set);
          }
        }
      }

      // Publish summary event
      const summary = await PracticeSummaryService.createPracticeSummaryById(practiceId);
      if (summary) {
        await PubSubService.publishPracticeSummaryEvent(SubscriptionEvents.PRACTICE_SET_DELETED, summary);
      }
    }

    return deleted;
  }
}
