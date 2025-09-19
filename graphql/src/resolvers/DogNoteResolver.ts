import { Resolver, Query, Mutation, Arg, ID, UseMiddleware, Ctx, InputType, Field, FieldResolver, Root, Subscription } from 'type-graphql'

import { DogNote } from '../models/DogNote'
import { SetDogNote } from '../models/SetDogNote'
import { SetDog } from '../models/SetDog'
import { Practice } from '../models/Practice'
import { AppDataSource } from '../db'
import { AuthContext, isAuth, hasClubAccess, createClubFilter } from '../middleware/auth'
import { PubSubService, SubscriptionEvents } from '../services/PubSubService'
import { PracticeDogNote, DogNoteEvent } from '../types/SubscriptionTypes'

@InputType()
export class CreateDogNoteInput {
  @Field()
  content: string;

  @Field(() => ID)
  dogId: string;

  @Field(() => ID)
  clubId: string;

  @Field({ defaultValue: false })
  isPrivate: boolean;
}

@InputType()
export class CreateSetDogNoteInput {
  @Field()
  content: string;

  @Field(() => ID)
  setDogId: string;

  @Field(() => [ID])
  dogIds: string[];

  @Field(() => ID)
  clubId: string;

  @Field({ defaultValue: false })
  isPrivate: boolean;
}

@Resolver(DogNote)
export class DogNoteResolver {
  private dogNoteRepository = AppDataSource.getRepository(DogNote);
  private setDogNoteRepository = AppDataSource.getRepository(SetDogNote);
  private practiceRepository = AppDataSource.getRepository(Practice);

  @Query(() => [DogNote])
  @UseMiddleware(isAuth)
  async dogNotes(@Arg('dogId', () => ID) dogId: string, @Ctx() { user }: AuthContext): Promise<DogNote[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return [];

    const dogNotes = await this.dogNoteRepository
      .createQueryBuilder('dogNote')
      .leftJoinAndSelect('dogNote.dog', 'dog')
      .leftJoinAndSelect('dogNote.createdBy', 'createdBy')
      .leftJoinAndSelect('dogNote.setDogNotes', 'setDogNote')
      .leftJoinAndSelect('setDogNote.setDog', 'setDog')
      .leftJoinAndSelect('setDog.set', 'set')
      .leftJoinAndSelect('set.location', 'location')
      .leftJoinAndSelect('set.practice', 'practice')
      .leftJoinAndSelect('practice.club', 'club')
      .leftJoinAndSelect('set.dogs', 'setDogs')
      .leftJoinAndSelect('setDogs.dog', 'setDogEntity')
      .leftJoinAndSelect('setDogEntity.owner', 'owner')
      .where('(dogNote.dogId = :dogId OR setDog.dogId = :dogId)', { dogId })
      .andWhere('(setDog.dogId = :dogId OR setDog.dogId IS NULL)', { dogId })
      .andWhere('(dog.clubId IN (:...clubIds) OR setDogEntity.clubId IN (:...clubIds))', { clubIds: user?.clubIds || [] })
      .andWhere('(dogNote.isPrivate = false OR dogNote.createdById = :userId)', { userId: user?.id })
      .orderBy('dogNote.createdAt', 'DESC')
      .getMany();

    return dogNotes;
  }

  @Query(() => [PracticeDogNote])
  @UseMiddleware(isAuth)
  async dogNotesByPractice(
    @Arg('practiceId', () => ID) practiceId: string,
    @Arg('orderBy', () => String, { defaultValue: 'createdAt_DESC' }) orderBy: string,
    @Ctx() { user }: AuthContext
  ): Promise<PracticeDogNote[]> {
    if (!createClubFilter(user)) return [];

    const [field, direction] = orderBy.split('_');
    const validFields = ['createdAt', 'updatedAt'];
    const validDirections = ['ASC', 'DESC'];

    const sortField = validFields.includes(field) ? field : 'createdAt';
    const sortDirection = validDirections.includes(direction) ? direction : 'DESC';

    const setDogNotes = await this.setDogNoteRepository
      .createQueryBuilder('setDogNote')
      .leftJoinAndSelect('setDogNote.dogNote', 'dogNote')
      .leftJoinAndSelect('dogNote.createdBy', 'createdBy')
      .leftJoinAndSelect('setDogNote.setDog', 'setDog')
      .leftJoinAndSelect('setDog.dog', 'dog')
      .leftJoinAndSelect('setDog.set', 'set')
      .leftJoin('set.practice', 'practice')
      .leftJoin('dog.club', 'club')
      .where('practice.id = :practiceId', { practiceId })
      .andWhere('club.id IN (:...clubIds)', { clubIds: user?.clubIds || [] })
      .andWhere('(dogNote.isPrivate = false OR dogNote.createdById = :userId)', { userId: user?.id })
      .orderBy(`dogNote.${sortField}`, sortDirection as 'ASC' | 'DESC')
      .getMany();

    const groupedNotes = new Map<string, PracticeDogNote>();

    for (const setDogNote of setDogNotes) {
      const key = `${setDogNote.dogNote.id}-${setDogNote.setDog.setId}`;

      if (!groupedNotes.has(key)) {
        groupedNotes.set(key, {
          id: setDogNote.dogNote.id,
          content: setDogNote.dogNote.content,
          createdAt: setDogNote.dogNote.createdAt,
          updatedAt: setDogNote.dogNote.updatedAt,
          isPrivate: setDogNote.dogNote.isPrivate,
          createdBy: setDogNote.dogNote.createdBy,
          setId: setDogNote.setDog.setId,
          dogIds: []
        });
      }

      groupedNotes.get(key)!.dogIds.push(setDogNote.setDog.dogId);
    }

    return Array.from(groupedNotes.values());
  }


  @Mutation(() => DogNote)
  @UseMiddleware(isAuth, hasClubAccess)
  async createDogNote(
    @Arg('input') input: CreateDogNoteInput,
    @Ctx() { user }: AuthContext
  ): Promise<DogNote> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const dogNote = this.dogNoteRepository.create({
      content: input.content,
      dogId: input.dogId,
      createdById: user.id,
      isPrivate: input.isPrivate
    });

    const savedDogNote = await this.dogNoteRepository.save(dogNote);

    const dogNoteWithRelations = await this.dogNoteRepository.findOne({
      where: { id: savedDogNote.id },
      relations: ['dog', 'dog.club', 'createdBy', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });

    if (dogNoteWithRelations) {
      await PubSubService.publishDogNoteEvent(SubscriptionEvents.DOG_NOTE_CREATED, dogNoteWithRelations);

      const practiceId = dogNoteWithRelations.setDogNotes?.[0]?.setDog?.set?.practiceId;
      if (practiceId) {
        // Fetch practice info for privacy filtering
        const practice = await this.practiceRepository.findOne({
          where: { id: practiceId },
          select: ['id', 'clubId', 'isPrivate', 'plannedById']
        });
        await PubSubService.publishPracticeDogNoteEvent(SubscriptionEvents.PRACTICE_DOG_NOTE_CREATED, dogNoteWithRelations, practiceId, practice);
      }
    }

    return savedDogNote;
  }

  @Mutation(() => DogNote)
  @UseMiddleware(isAuth, hasClubAccess)
  async createSetDogNote(
    @Arg('input') input: CreateSetDogNoteInput,
    @Ctx() { user }: AuthContext
  ): Promise<DogNote> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const dogNote = this.dogNoteRepository.create({
      content: input.content,
      dogId: input.dogIds[0],
      createdById: user.id,
      isPrivate: input.isPrivate || false
    });

    const savedDogNote = await this.dogNoteRepository.save(dogNote);

    const setDogRepository = AppDataSource.getRepository(SetDog);

    let setId = input.setDogId;
    const setDogById = await setDogRepository.findOne({
      where: { id: input.setDogId }
    });

    if (setDogById) {
      setId = setDogById.setId;
    }

    const targetSetDogs = await setDogRepository
      .createQueryBuilder('setDog')
      .where('setDog.setId = :setId', { setId })
      .andWhere('setDog.dogId IN (:...dogIds)', { dogIds: input.dogIds })
      .getMany();

    const setDogNotes = targetSetDogs.map(setDog =>
      this.setDogNoteRepository.create({
        setDogId: setDog.id,
        dogNoteId: savedDogNote.id
      })
    );

    await this.setDogNoteRepository.save(setDogNotes);

    const dogNoteWithRelations = await this.dogNoteRepository.findOne({
      where: { id: savedDogNote.id },
      relations: ['dog', 'dog.club', 'createdBy', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });

    if (dogNoteWithRelations) {
      await PubSubService.publishDogNoteEvent(SubscriptionEvents.DOG_NOTE_CREATED, dogNoteWithRelations);

      const practiceId = dogNoteWithRelations.setDogNotes?.[0]?.setDog?.set?.practiceId;
      if (practiceId) {
        // Fetch practice info for privacy filtering
        const practice = await this.practiceRepository.findOne({
          where: { id: practiceId },
          select: ['id', 'clubId', 'isPrivate', 'plannedById']
        });
        await PubSubService.publishPracticeDogNoteEvent(SubscriptionEvents.PRACTICE_DOG_NOTE_CREATED, dogNoteWithRelations, practiceId, practice);
      }
    }

    return savedDogNote;
  }

  @Mutation(() => DogNote, { nullable: true })
  @UseMiddleware(isAuth)
  async updateDogNote(
    @Arg('id', () => ID) id: string,
    @Ctx() { user }: AuthContext,
    @Arg('content', { nullable: true }) content?: string,
    @Arg('isPrivate', { nullable: true }) isPrivate?: boolean
  ): Promise<DogNote | null> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return null;

    const dogNote = await this.dogNoteRepository.findOne({
      where: {
        id,
        dog: clubFilter
      }
    });

    if (!dogNote) return null;

    if (dogNote.createdById !== user?.id) {
      throw new Error('You can only update notes you created');
    }

    if (content !== undefined) {
      dogNote.content = content;
    }
    if (isPrivate !== undefined) {
      dogNote.isPrivate = isPrivate;
    }
    const savedDogNote = await this.dogNoteRepository.save(dogNote);

    const dogNoteWithRelations = await this.dogNoteRepository.findOne({
      where: { id: savedDogNote.id },
      relations: ['dog', 'dog.club', 'createdBy', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });

    if (dogNoteWithRelations) {
      await PubSubService.publishDogNoteEvent(SubscriptionEvents.DOG_NOTE_UPDATED, dogNoteWithRelations);

      const practiceId = dogNoteWithRelations.setDogNotes?.[0]?.setDog?.set?.practiceId;
      if (practiceId) {
        // Fetch practice info for privacy filtering
        const practice = await this.practiceRepository.findOne({
          where: { id: practiceId },
          select: ['id', 'clubId', 'isPrivate', 'plannedById']
        });
        await PubSubService.publishPracticeDogNoteEvent(SubscriptionEvents.PRACTICE_DOG_NOTE_UPDATED, dogNoteWithRelations, practiceId, practice);
      }
    }

    return savedDogNote;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteDogNote(@Arg('id', () => ID) id: string, @Ctx() { user }: AuthContext): Promise<boolean> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return false;

    const dogNote = await this.dogNoteRepository.findOne({
      where: {
        id,
        dog: clubFilter
      },
      relations: ['dog', 'dog.club', 'createdBy', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });

    if (!dogNote) return false;

    if (dogNote.createdById !== user?.id) {
      throw new Error('You can only delete notes you created');
    }

    const result = await this.dogNoteRepository.delete(id);

    if (result.affected !== 0) {
      await PubSubService.publishDogNoteEvent(SubscriptionEvents.DOG_NOTE_DELETED, dogNote);

      const practiceId = dogNote.setDogNotes?.[0]?.setDog?.set?.practiceId;
      if (practiceId) {
        // Fetch practice info for privacy filtering
        const practice = await this.practiceRepository.findOne({
          where: { id: practiceId },
          select: ['id', 'clubId', 'isPrivate', 'plannedById']
        });
        await PubSubService.publishPracticeDogNoteEvent(SubscriptionEvents.PRACTICE_DOG_NOTE_DELETED, dogNote, practiceId, practice);
      }
    }

    return result.affected !== 0;
  }

  @FieldResolver(() => [SetDog])
  async setDogs(@Root() dogNote: DogNote): Promise<SetDog[]> {
    const setDogNotes = await this.setDogNoteRepository.find({
      where: { dogNoteId: dogNote.id },
      relations: ['setDog']
    });

    if (setDogNotes.length === 0) {
      return [];
    }

    return setDogNotes.map(setDogNote => setDogNote.setDog);
  }

  @Subscription(() => DogNoteEvent, {
    topics: [SubscriptionEvents.DOG_NOTE_CREATED, SubscriptionEvents.DOG_NOTE_UPDATED, SubscriptionEvents.DOG_NOTE_DELETED],
    filter: ({ payload, context, args }) => {
      return payload.dogId === args.dogId;
    }
  })
  @UseMiddleware(isAuth)
  dogNoteChanged(
    @Root() payload: DogNoteEvent,
    @Arg('dogId') dogId: string
  ): DogNoteEvent {
    return payload;
  }
}
