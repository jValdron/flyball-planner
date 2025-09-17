import { Resolver, Query, Mutation, Arg, ID, UseMiddleware, Ctx, InputType, Field } from 'type-graphql';
import { DogNote } from '../models/DogNote';
import { SetDogNote } from '../models/SetDogNote';
import { SetDog } from '../models/SetDog';
import { AppDataSource } from '../db';
import { AuthContext, isAuth, hasClubAccess, createClubFilter } from '../middleware/auth';
import { PubSubService, SubscriptionEvents } from '../services/PubSubService';
import { PracticeDogNote } from '../types/SubscriptionTypes';

@InputType()
export class CreateDogNoteInput {
  @Field()
  content: string;

  @Field(() => ID)
  dogId: string;

  @Field(() => ID)
  clubId: string;
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
}

@Resolver(DogNote)
export class DogNoteResolver {
  private dogNoteRepository = AppDataSource.getRepository(DogNote);
  private setDogNoteRepository = AppDataSource.getRepository(SetDogNote);

  @Query(() => [DogNote])
  @UseMiddleware(isAuth)
  async dogNotes(@Arg('dogId', () => ID) dogId: string, @Ctx() { user }: AuthContext): Promise<DogNote[]> {
    const clubFilter = createClubFilter(user);
    if (!clubFilter) return [];

    return await this.dogNoteRepository.find({
      where: {
        dogId,
        dog: clubFilter
      },
      relations: [
        'dog',
        'setDogNotes',
        'setDogNotes.setDog',
        'setDogNotes.setDog.set',
        'setDogNotes.setDog.set.location',
        'setDogNotes.setDog.set.practice',
        'setDogNotes.setDog.set.practice.club',
        'setDogNotes.setDog.set.dogs',
        'setDogNotes.setDog.set.dogs.dog',
        'setDogNotes.setDog.set.dogs.dog.owner'
      ],
      order: {
        createdAt: 'DESC'
      }
    });
  }

  @Query(() => [PracticeDogNote])
  @UseMiddleware(isAuth)
  async dogNotesByPractice(@Arg('practiceId', () => ID) practiceId: string, @Ctx() { user }: AuthContext): Promise<PracticeDogNote[]> {
    if (!createClubFilter(user)) return [];

    const setDogNotes = await this.setDogNoteRepository
      .createQueryBuilder('setDogNote')
      .leftJoinAndSelect('setDogNote.dogNote', 'dogNote')
      .leftJoinAndSelect('setDogNote.setDog', 'setDog')
      .leftJoinAndSelect('setDog.dog', 'dog')
      .leftJoinAndSelect('setDog.set', 'set')
      .leftJoin('set.practice', 'practice')
      .leftJoin('dog.club', 'club')
      .where('practice.id = :practiceId', { practiceId })
      .andWhere('club.id IN (:...clubIds)', { clubIds: user?.clubIds || [] })
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
    @Arg('input') input: CreateDogNoteInput
  ): Promise<DogNote> {
    const dogNote = this.dogNoteRepository.create({
      content: input.content,
      dogId: input.dogId
    });

    const savedDogNote = await this.dogNoteRepository.save(dogNote);

    const dogNoteWithRelations = await this.dogNoteRepository.findOne({
      where: { id: savedDogNote.id },
      relations: ['dog', 'dog.club', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });

    if (dogNoteWithRelations) {
      const practiceId = dogNoteWithRelations.setDogNotes?.[0]?.setDog?.set?.practiceId;
      if (practiceId) {
        await PubSubService.publishPracticeDogNoteEvent(SubscriptionEvents.PRACTICE_DOG_NOTE_CREATED, dogNoteWithRelations, practiceId);
      }
    }

    return savedDogNote;
  }

  @Mutation(() => DogNote)
  @UseMiddleware(isAuth, hasClubAccess)
  async createSetDogNote(
    @Arg('input') input: CreateSetDogNoteInput
  ): Promise<DogNote> {
    const dogNote = this.dogNoteRepository.create({
      content: input.content,
      dogId: input.dogIds[0]
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
      relations: ['dog', 'dog.club', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });

    if (dogNoteWithRelations) {
      const practiceId = dogNoteWithRelations.setDogNotes?.[0]?.setDog?.set?.practiceId;
      if (practiceId) {
        await PubSubService.publishPracticeDogNoteEvent(SubscriptionEvents.PRACTICE_DOG_NOTE_CREATED, dogNoteWithRelations, practiceId);
      }
    }

    return savedDogNote;
  }

  @Mutation(() => DogNote, { nullable: true })
  @UseMiddleware(isAuth)
  async updateDogNote(
    @Arg('id', () => ID) id: string,
    @Arg('content') content: string,
    @Ctx() { user }: AuthContext
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

    dogNote.content = content;
    const savedDogNote = await this.dogNoteRepository.save(dogNote);

    const dogNoteWithRelations = await this.dogNoteRepository.findOne({
      where: { id: savedDogNote.id },
      relations: ['dog', 'dog.club', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });

    if (dogNoteWithRelations) {
      const practiceId = dogNoteWithRelations.setDogNotes?.[0]?.setDog?.set?.practiceId;
      if (practiceId) {
        await PubSubService.publishPracticeDogNoteEvent(SubscriptionEvents.PRACTICE_DOG_NOTE_UPDATED, dogNoteWithRelations, practiceId);
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
      relations: ['dog', 'dog.club', 'setDogNotes', 'setDogNotes.setDog', 'setDogNotes.setDog.set']
    });

    if (!dogNote) return false;

    const result = await this.dogNoteRepository.delete(id);

    if (result.affected !== 0) {
      const practiceId = dogNote.setDogNotes?.[0]?.setDog?.set?.practiceId;
      if (practiceId) {
        await PubSubService.publishPracticeDogNoteEvent(SubscriptionEvents.PRACTICE_DOG_NOTE_DELETED, dogNote, practiceId);
      }
    }

    return result.affected !== 0;
  }
}
